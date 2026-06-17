package com.cineverse.booking.repository;

import com.cineverse.booking.model.SeatStatus;
import com.cineverse.booking.model.ShowSeat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ShowSeatRepository extends JpaRepository<ShowSeat, Long> {

    List<ShowSeat> findByShowId(Long showId);

    List<ShowSeat> findByShowIdAndSeatIdIn(Long showId, List<Long> seatIds);

    /**
     * Find seats whose lock has expired (LOCKED status and lockedAt older than cutoff).
     */
    List<ShowSeat> findByStatusAndLockedAtBefore(SeatStatus status, LocalDateTime cutoff);
}
