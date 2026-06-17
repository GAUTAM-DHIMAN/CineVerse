package com.cineverse.booking.service;

import com.cineverse.booking.model.*;
import com.cineverse.booking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Concurrency tests for BookingService.
 * Simulates multiple threads trying to book the same seats simultaneously.
 */
@ExtendWith(MockitoExtension.class)
class ConcurrentBookingTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ShowSeatRepository showSeatRepository;

    @Mock
    private ShowRepository showRepository;

    @Mock
    private RedisSeatLockService redisSeatLockService;

    @Mock
    private BookingEventPublisher bookingEventPublisher;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache cache;

    @InjectMocks
    private BookingService bookingService;

    private ShowSeat seat1;

    @BeforeEach
    void setUp() {
        seat1 = new ShowSeat();
        seat1.setId(1L);
        seat1.setShowId(100L);
        seat1.setSeatId(10L);
        seat1.setSeatNumber("A1");
        seat1.setSeatType(SeatType.REGULAR);
        seat1.setPrice(200.0);
        seat1.setStatus(SeatStatus.AVAILABLE);
    }

    @Test
    void initiateBooking_concurrentRequests_onlyOneShouldSucceed() throws InterruptedException {
        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(threadCount);

        when(showRepository.existsById(100L)).thenReturn(true);
        // Returns a fresh available seat on every thread invocation to prevent shared state mutation
        when(showSeatRepository.findAllById(List.of(1L))).thenAnswer(inv -> {
            ShowSeat freshSeat = new ShowSeat();
            freshSeat.setId(1L);
            freshSeat.setShowId(100L);
            freshSeat.setSeatId(10L);
            freshSeat.setSeatNumber("A1");
            freshSeat.setSeatType(SeatType.REGULAR);
            freshSeat.setPrice(200.0);
            freshSeat.setStatus(SeatStatus.AVAILABLE);
            return List.of(freshSeat);
        });

        // Mock Redis lock behavior: allow only the first lock request, block others
        AtomicInteger redisLockCalls = new AtomicInteger(0);
        when(redisSeatLockService.lockSeats(eq(100L), anyList(), anyString())).thenAnswer(inv -> {
            // Only one thread gets true (success), others get false
            return redisLockCalls.incrementAndGet() == 1;
        });

        // Mock cache behavior
        when(cacheManager.getCache("showSeats")).thenReturn(cache);

        // Mock save behaviors
        when(showSeatRepository.save(any(ShowSeat.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            b.setId(Thread.currentThread().getId());
            return b;
        });

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        List<String> errors = new CopyOnWriteArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            final String userId = "user-" + i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // wait for all threads to start together
                    bookingService.initiateBooking(userId, 100L, List.of(1L));
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                    errors.add(e.getMessage());
                } finally {
                    endLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // release latch to start threads simultaneously
        endLatch.await(); // wait for all threads to finish
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one booking should succeed");
        assertEquals(threadCount - 1, failureCount.get(), "All other concurrent bookings should fail");

        // Check that failures were due to seat locking
        for (String err : errors) {
            assertEquals("One or more seats are being booked by another user. Please try again.", err);
        }
    }
}
