package com.cineverse.booking.service;

import com.cineverse.booking.model.*;
import com.cineverse.booking.repository.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for Show scheduling with overlap validation.
 */
@Service
public class ShowService {

    private final ShowRepository showRepository;
    private final ShowSeatRepository showSeatRepository;
    private final SeatRepository seatRepository;
    private final ScreenRepository screenRepository;

    public ShowService(ShowRepository showRepository,
                       ShowSeatRepository showSeatRepository,
                       SeatRepository seatRepository,
                       ScreenRepository screenRepository) {
        this.showRepository = showRepository;
        this.showSeatRepository = showSeatRepository;
        this.seatRepository = seatRepository;
        this.screenRepository = screenRepository;
    }

    /**
     * Schedule a new show, validating no overlaps on the same screen.
     * Also initializes ShowSeat entries for all seats in the screen.
     */
    @Transactional
    @CacheEvict(value = "showsByMovie", key = "#show.movieId")
    public Show createShow(Show show) {
        // Validate screen exists
        if (!screenRepository.existsById(show.getScreenId())) {
            throw new IllegalArgumentException("Screen not found with id: " + show.getScreenId());
        }

        // Check for overlapping shows
        List<Show> overlaps = showRepository.findOverlappingShows(
                show.getScreenId(), show.getStartTime(), show.getEndTime());
        if (!overlaps.isEmpty()) {
            throw new IllegalArgumentException(
                    "Show overlaps with an existing show on this screen (ID: " + overlaps.get(0).getId() + ")");
        }

        Show saved = showRepository.save(show);

        // Initialize ShowSeat entries for all seats in the screen
        List<Seat> seats = seatRepository.findByScreenId(show.getScreenId());
        for (Seat seat : seats) {
            ShowSeat showSeat = new ShowSeat();
            showSeat.setShowId(saved.getId());
            showSeat.setSeatId(seat.getId());
            showSeat.setSeatNumber(seat.getSeatNumber());
            showSeat.setSeatType(seat.getType());
            showSeat.setPrice(seat.getPrice());
            showSeat.setStatus(SeatStatus.AVAILABLE);
            showSeatRepository.save(showSeat);
        }

        return saved;
    }

    public List<Show> getAllShows() {
        return showRepository.findAll();
    }

    @Cacheable(value = "showsByMovie", key = "#movieId")
    public List<Show> getShowsByMovie(String movieId) {
        return showRepository.findByMovieId(movieId);
    }

    public Show getShowById(Long id) {
        return showRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Show not found with id: " + id));
    }

    /**
     * Get all seats and their statuses for a specific show.
     */
    @Cacheable(value = "showSeats", key = "#showId")
    public List<ShowSeat> getSeatsForShow(Long showId) {
        return showSeatRepository.findByShowId(showId);
    }
}
