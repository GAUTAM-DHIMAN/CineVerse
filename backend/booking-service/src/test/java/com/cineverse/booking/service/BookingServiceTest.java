package com.cineverse.booking.service;

import com.cineverse.booking.model.*;
import com.cineverse.booking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BookingService — booking workflow, seat locking, confirmation.
 */
@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

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

    @InjectMocks
    private BookingService bookingService;

    private ShowSeat seat1;
    private ShowSeat seat2;

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

        seat2 = new ShowSeat();
        seat2.setId(2L);
        seat2.setShowId(100L);
        seat2.setSeatId(11L);
        seat2.setSeatNumber("A2");
        seat2.setSeatType(SeatType.REGULAR);
        seat2.setPrice(200.0);
        seat2.setStatus(SeatStatus.AVAILABLE);
    }

    @Test
    void initiateBooking_withAvailableSeats_shouldLockAndCreateBooking() {
        when(showRepository.existsById(100L)).thenReturn(true);
        when(showSeatRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(seat1, seat2));
        when(redisSeatLockService.lockSeats(eq(100L), anyList(), eq("user@test.com"))).thenReturn(true);
        when(showSeatRepository.save(any(ShowSeat.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            b.setId(1L);
            return b;
        });

        Booking booking = bookingService.initiateBooking("user@test.com", 100L, List.of(1L, 2L));

        assertNotNull(booking);
        assertEquals(BookingStatus.LOCKED, booking.getStatus());
        assertEquals(400.0, booking.getTotalPrice());
        assertEquals("user@test.com", booking.getUserId());
        verify(redisSeatLockService).lockSeats(eq(100L), anyList(), eq("user@test.com"));
    }

    @Test
    void initiateBooking_withLockedSeats_shouldThrow() {
        seat1.setStatus(SeatStatus.LOCKED);

        when(showRepository.existsById(100L)).thenReturn(true);
        when(showSeatRepository.findAllById(List.of(1L))).thenReturn(List.of(seat1));

        assertThrows(IllegalArgumentException.class,
                () -> bookingService.initiateBooking("user@test.com", 100L, List.of(1L)));
    }

    @Test
    void initiateBooking_withRedisLockFailure_shouldThrow() {
        when(showRepository.existsById(100L)).thenReturn(true);
        when(showSeatRepository.findAllById(List.of(1L))).thenReturn(List.of(seat1));
        when(redisSeatLockService.lockSeats(eq(100L), anyList(), eq("user@test.com"))).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> bookingService.initiateBooking("user@test.com", 100L, List.of(1L)));
    }

    @Test
    void confirmBooking_withLockedBooking_shouldConfirm() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setUserId("user@test.com");
        booking.setShowId(100L);
        booking.setShowSeatIds(List.of(1L, 2L));
        booking.setStatus(BookingStatus.LOCKED);
        booking.setTotalPrice(400.0);
        booking.setLockedAt(LocalDateTime.now()); // Not expired

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(showSeatRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(seat1, seat2));
        when(showSeatRepository.save(any(ShowSeat.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking confirmed = bookingService.confirmBooking(1L);

        assertEquals(BookingStatus.CONFIRMED, confirmed.getStatus());
        assertNotNull(confirmed.getConfirmedAt());
        verify(bookingEventPublisher).publishBookingConfirmed(any(Booking.class));
    }

    @Test
    void confirmBooking_withExpiredLock_shouldThrow() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setUserId("user@test.com");
        booking.setShowId(100L);
        booking.setShowSeatIds(List.of(1L));
        booking.setStatus(BookingStatus.LOCKED);
        booking.setLockedAt(LocalDateTime.now().minusMinutes(10)); // Expired

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(showSeatRepository.findAllById(List.of(1L))).thenReturn(List.of(seat1));
        when(showSeatRepository.save(any(ShowSeat.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThrows(IllegalArgumentException.class, () -> bookingService.confirmBooking(1L));
    }

    @Test
    void cancelBooking_shouldReleaseSeats() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setUserId("user@test.com");
        booking.setShowId(100L);
        booking.setShowSeatIds(List.of(1L));
        booking.setStatus(BookingStatus.LOCKED);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(showSeatRepository.findAllById(List.of(1L))).thenReturn(List.of(seat1));
        when(showSeatRepository.save(any(ShowSeat.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking cancelled = bookingService.cancelBooking(1L);

        assertEquals(BookingStatus.CANCELLED, cancelled.getStatus());
        verify(redisSeatLockService).releaseSeats(eq(100L), anyList(), eq("user@test.com"));
    }

    @Test
    void getBookingById_withNonExistent_shouldThrow() {
        when(bookingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> bookingService.getBookingById(999L));
    }
}
