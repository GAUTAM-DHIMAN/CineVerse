package com.cineverse.booking.controller;

import com.cineverse.booking.dto.ApiResponse;
import com.cineverse.booking.model.Show;
import com.cineverse.booking.model.ShowSeat;
import com.cineverse.booking.service.ShowService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Show scheduling and seat availability.
 */
@RestController
public class ShowController {

    private final ShowService showService;

    public ShowController(ShowService showService) {
        this.showService = showService;
    }

    /**
     * GET /shows — Get all shows (optionally filter by movieId).
     */
    @GetMapping("/shows")
    public ResponseEntity<ApiResponse<List<Show>>> getShows(
            @RequestParam(required = false) String movieId) {
        List<Show> shows;
        if (movieId != null) {
            shows = showService.getShowsByMovie(movieId);
        } else {
            shows = showService.getAllShows();
        }
        return ResponseEntity.ok(ApiResponse.success("Shows retrieved", shows));
    }

    /**
     * POST /shows — Schedule a new show.
     */
    @PostMapping("/shows")
    public ResponseEntity<ApiResponse<Show>> createShow(@RequestBody Show show) {
        Show created = showService.createShow(show);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Show scheduled successfully", created));
    }

    /**
     * GET /seats/{showId} — Get all seats and their status for a show.
     */
    @GetMapping("/seats/{showId}")
    public ResponseEntity<ApiResponse<List<ShowSeat>>> getSeats(@PathVariable Long showId) {
        List<ShowSeat> seats = showService.getSeatsForShow(showId);
        return ResponseEntity.ok(ApiResponse.success("Seats retrieved", seats));
    }
}
