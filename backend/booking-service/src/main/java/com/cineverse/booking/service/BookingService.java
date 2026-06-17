package com.cineverse.booking.service;

import com.cineverse.booking.model.*;
import com.cineverse.booking.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Core booking workflow service.
 * FSM: select seats → lock seats (5-min TTL via Redis) → confirm → update status.
 * Uses Redis for distributed seat locking and @Version for DB-level optimistic locking.
 */
@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private static final int LOCK_TTL_MINUTES = 5;

    private final BookingRepository bookingRepository;
    private final ShowSeatRepository showSeatRepository;
    private final ShowRepository showRepository;
    private final RedisSeatLockService redisSeatLockService;
    private final BookingEventPublisher bookingEventPublisher;
    private final CacheManager cacheManager;

    public BookingService(BookingRepository bookingRepository,
                          ShowSeatRepository showSeatRepository,
                          ShowRepository showRepository,
                          RedisSeatLockService redisSeatLockService,
                          BookingEventPublisher bookingEventPublisher,
                          CacheManager cacheManager) {
        this.bookingRepository = bookingRepository;
        this.showSeatRepository = showSeatRepository;
        this.showRepository = showRepository;
        this.redisSeatLockService = redisSeatLockService;
        this.bookingEventPublisher = bookingEventPublisher;
        this.cacheManager = cacheManager;
    }

    /**
     * Initiate a booking: lock the selected seats with a 5-minute TTL (Redis + DB).
     * @param userId the user making the booking
     * @param showId the show to book
     * @param seatIds list of ShowSeat IDs to book
     * @return the created Booking in LOCKED state
     */
    @Transactional
    public Booking initiateBooking(String userId, Long showId, List<Long> seatIds) {
        // Validate show exists
        if (!showRepository.existsById(showId)) {
            throw new IllegalArgumentException("Show not found with id: " + showId);
        }

        // Fetch the requested seats
        List<ShowSeat> seats = showSeatRepository.findAllById(seatIds);
        if (seats.size() != seatIds.size()) {
            throw new IllegalArgumentException("One or more seats not found");
        }

        // Validate all seats belong to the same show and are available
        double totalPrice = 0;
        for (ShowSeat seat : seats) {
            if (!seat.getShowId().equals(showId)) {
                throw new IllegalArgumentException("Seat " + seat.getSeatNumber() + " does not belong to this show");
            }
            if (seat.getStatus() != SeatStatus.AVAILABLE) {
                throw new IllegalArgumentException("Seat " + seat.getSeatNumber() + " is not available (status: " + seat.getStatus() + ")");
            }
            totalPrice += seat.getPrice();
        }

        // Acquire Redis distributed locks first (fast-fail for concurrent bookings)
        List<Long> actualSeatIds = seats.stream().map(ShowSeat::getSeatId).toList();
        if (!redisSeatLockService.lockSeats(showId, actualSeatIds, userId)) {
            throw new IllegalArgumentException("One or more seats are being booked by another user. Please try again.");
        }

        // Lock the seats in the database (optimistic locking via @Version)
        LocalDateTime now = LocalDateTime.now();
        try {
            for (ShowSeat seat : seats) {
                seat.setStatus(SeatStatus.LOCKED);
                seat.setLockedAt(now);
                seat.setLockedBy(userId);
                showSeatRepository.save(seat);
            }
        } catch (ObjectOptimisticLockingFailureException e) {
            // Release Redis locks on DB conflict
            redisSeatLockService.releaseSeats(showId, actualSeatIds, userId);
            throw new IllegalArgumentException("Seats were modified by another user. Please try again.");
        }

        // Create booking in LOCKED state
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setShowId(showId);
        booking.setShowSeatIds(seatIds);
        booking.setStatus(BookingStatus.LOCKED);
        booking.setTotalPrice(totalPrice);
        booking.setLockedAt(now);

        Booking savedBooking = bookingRepository.save(booking);
        evictShowSeatsCache(showId);
        return savedBooking;
    }

    /**
     * Confirm a locked booking — transitions from LOCKED to CONFIRMED.
     * Simulates payment processing before confirmation.
     */
    @Transactional
    public Booking confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.LOCKED) {
            throw new IllegalArgumentException("Booking cannot be confirmed — current status: " + booking.getStatus());
        }

        // Check if lock has expired
        if (booking.getLockedAt().plusMinutes(LOCK_TTL_MINUTES).isBefore(LocalDateTime.now())) {
            expireBooking(booking);
            throw new IllegalArgumentException("Booking lock has expired. Please rebook.");
        }

        // --- Payment Simulation ---
        log.info("Processing payment for booking {} — amount: {}", bookingId, booking.getTotalPrice());
        // In production, integrate with Stripe/Razorpay here
        boolean paymentSuccess = simulatePayment(booking.getTotalPrice());
        if (!paymentSuccess) {
            throw new IllegalArgumentException("Payment failed. Please try again.");
        }

        // Confirm seats
        List<ShowSeat> seats = showSeatRepository.findAllById(booking.getShowSeatIds());
        for (ShowSeat seat : seats) {
            seat.setStatus(SeatStatus.BOOKED);
            seat.setLockedAt(null);
            showSeatRepository.save(seat);
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setConfirmedAt(LocalDateTime.now());
        Booking confirmed = bookingRepository.save(booking);

        // Publish booking confirmed event to RabbitMQ
        bookingEventPublisher.publishBookingConfirmed(confirmed);

        evictShowSeatsCache(confirmed.getShowId());
        return confirmed;
    }

    /**
     * Cancel a booking — releases locked/booked seats back to AVAILABLE.
     */
    @Transactional
    public Booking cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalArgumentException("Booking is already " + booking.getStatus());
        }

        // Release all seats (DB + Redis)
        releaseSeats(booking);

        booking.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }

    /**
     * Expire a booking — called when the lock TTL has passed.
     */
    @Transactional
    public void expireBooking(Booking booking) {
        releaseSeats(booking);
        booking.setStatus(BookingStatus.EXPIRED);
        bookingRepository.save(booking);
    }

    /**
     * Get a booking by ID.
     */
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with id: " + id));
    }

    /**
     * Get all bookings for a user.
     */
    public List<Booking> getBookingsByUser(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    /**
     * Release seats back to AVAILABLE status (both DB and Redis).
     */
    private void releaseSeats(Booking booking) {
        List<ShowSeat> seats = showSeatRepository.findAllById(booking.getShowSeatIds());
        List<Long> seatIds = seats.stream().map(ShowSeat::getSeatId).toList();

        // Release Redis locks
        redisSeatLockService.releaseSeats(booking.getShowId(), seatIds, booking.getUserId());

        // Release DB locks
        for (ShowSeat seat : seats) {
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.setLockedAt(null);
            seat.setLockedBy(null);
            showSeatRepository.save(seat);
        }
        evictShowSeatsCache(booking.getShowId());
    }

    private void evictShowSeatsCache(Long showId) {
        try {
            var cache = cacheManager.getCache("showSeats");
            if (cache != null) {
                cache.evict(showId);
            }
        } catch (Exception e) {
            log.error("Failed to evict showSeats cache for showId: " + showId, e);
        }
    }

    /**
     * Simulate a payment (always succeeds for demo purposes).
     * In production, replace with actual payment gateway integration.
     */
    private boolean simulatePayment(Double amount) {
        log.info("Payment simulation: charged ${}", amount);
        return true;
    }
}
