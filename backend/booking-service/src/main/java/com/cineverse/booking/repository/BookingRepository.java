package com.cineverse.booking.repository;

import com.cineverse.booking.model.Booking;
import com.cineverse.booking.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(String userId);

    List<Booking> findByShowId(Long showId);

    /**
     * Find bookings whose lock has expired (LOCKED status and lockedAt older than cutoff).
     */
    List<Booking> findByStatusAndLockedAtBefore(BookingStatus status, LocalDateTime cutoff);
}
