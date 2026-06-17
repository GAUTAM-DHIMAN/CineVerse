package com.cineverse.booking.service;

import com.cineverse.booking.model.*;
import com.cineverse.booking.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled task that expires locked seats and bookings after the 5-minute TTL.
 * Runs every 30 seconds to check for expired locks.
 */
@Component
public class SeatLockScheduler {

    private static final Logger log = LoggerFactory.getLogger(SeatLockScheduler.class);
    private static final int LOCK_TTL_MINUTES = 5;

    private final ShowSeatRepository showSeatRepository;
    private final BookingRepository bookingRepository;
    private final CacheManager cacheManager;

    public SeatLockScheduler(ShowSeatRepository showSeatRepository,
                             BookingRepository bookingRepository,
                             CacheManager cacheManager) {
        this.showSeatRepository = showSeatRepository;
        this.bookingRepository = bookingRepository;
        this.cacheManager = cacheManager;
    }

    /**
     * Release expired seat locks every 30 seconds.
     */
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void expireLockedSeats() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(LOCK_TTL_MINUTES);

        // Expire locked seats
        List<ShowSeat> expiredSeats = showSeatRepository
                .findByStatusAndLockedAtBefore(SeatStatus.LOCKED, cutoff);

        if (!expiredSeats.isEmpty()) {
            log.info("Expiring {} locked seats past TTL", expiredSeats.size());
            for (ShowSeat seat : expiredSeats) {
                seat.setStatus(SeatStatus.AVAILABLE);
                seat.setLockedAt(null);
                seat.setLockedBy(null);
                showSeatRepository.save(seat);
            }
            // Evict cache for all shows affected
            expiredSeats.stream()
                    .map(ShowSeat::getShowId)
                    .distinct()
                    .forEach(this::evictShowSeatsCache);
        }

        // Expire locked bookings
        List<Booking> expiredBookings = bookingRepository
                .findByStatusAndLockedAtBefore(BookingStatus.LOCKED, cutoff);

        if (!expiredBookings.isEmpty()) {
            log.info("Expiring {} locked bookings past TTL", expiredBookings.size());
            for (Booking booking : expiredBookings) {
                booking.setStatus(BookingStatus.EXPIRED);
                bookingRepository.save(booking);
            }
        }
    }

    private void evictShowSeatsCache(Long showId) {
        try {
            var cache = cacheManager.getCache("showSeats");
            if (cache != null) {
                cache.evict(showId);
            }
        } catch (Exception e) {
            log.error("Failed to evict showSeats cache in scheduler for showId: " + showId, e);
        }
    }
}
