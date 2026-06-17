package com.cineverse.booking.service;

import com.cineverse.booking.model.*;
import com.cineverse.booking.repository.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for Theatre, Screen, and Seat management.
 */
@Service
public class TheatreService {

    private final TheatreRepository theatreRepository;
    private final ScreenRepository screenRepository;
    private final SeatRepository seatRepository;

    public TheatreService(TheatreRepository theatreRepository,
                          ScreenRepository screenRepository,
                          SeatRepository seatRepository) {
        this.theatreRepository = theatreRepository;
        this.screenRepository = screenRepository;
        this.seatRepository = seatRepository;
    }

    @Cacheable(value = "theatres")
    public List<Theatre> getAllTheatres() {
        return theatreRepository.findAll();
    }

    @Cacheable(value = "theatres", key = "#id")
    public Theatre getTheatreById(Long id) {
        return theatreRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Theatre not found with id: " + id));
    }

    @Transactional
    @CacheEvict(value = "theatres", allEntries = true)
    public Theatre createTheatre(Theatre theatre) {
        return theatreRepository.save(theatre);
    }

    @Transactional
    @CacheEvict(value = "theatres", allEntries = true)
    public Screen addScreen(Long theatreId, Screen screen) {
        Theatre theatre = getTheatreById(theatreId);
        screen.setTheatre(theatre);
        return screenRepository.save(screen);
    }

    /**
     * Add seats to a screen in a 2D grid layout.
     * @param screenId the screen to add seats to
     * @param rows number of rows (A, B, C...)
     * @param seatsPerRow number of seats per row (1, 2, 3...)
     * @param seatType type of all seats
     * @param price price per seat
     */
    @Transactional
    public List<Seat> addSeatsGrid(Long screenId, int rows, int seatsPerRow,
                                    SeatType seatType, Double price) {
        Screen screen = screenRepository.findById(screenId)
                .orElseThrow(() -> new IllegalArgumentException("Screen not found with id: " + screenId));

        for (int r = 0; r < rows; r++) {
            char rowLabel = (char) ('A' + r);
            for (int s = 1; s <= seatsPerRow; s++) {
                Seat seat = new Seat();
                seat.setSeatNumber(rowLabel + String.valueOf(s));
                seat.setType(seatType);
                seat.setPrice(price);
                seat.setScreen(screen);
                screen.getSeats().add(seat);
            }
        }

        screenRepository.save(screen);
        return screen.getSeats();
    }

    public List<Screen> getScreensByTheatre(Long theatreId) {
        return screenRepository.findByTheatreId(theatreId);
    }

    public List<Seat> getSeatsByScreen(Long screenId) {
        return seatRepository.findByScreenId(screenId);
    }
}
