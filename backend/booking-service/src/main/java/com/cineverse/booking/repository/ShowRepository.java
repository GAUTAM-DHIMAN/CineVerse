package com.cineverse.booking.repository;

import com.cineverse.booking.model.Show;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface ShowRepository extends JpaRepository<Show, Long> {

    List<Show> findByMovieId(String movieId);

    List<Show> findByScreenId(Long screenId);

    /**
     * Check for overlapping shows on the same screen.
     * A show overlaps if its time range intersects with [startTime, endTime].
     */
    @Query("SELECT s FROM Show s WHERE s.screenId = :screenId " +
           "AND s.startTime < :endTime AND s.endTime > :startTime")
    List<Show> findOverlappingShows(Long screenId, LocalDateTime startTime, LocalDateTime endTime);
}
