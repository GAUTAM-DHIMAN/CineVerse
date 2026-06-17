package com.cineverse.booking.controller;

import com.cineverse.booking.dto.ApiResponse;
import com.cineverse.booking.model.*;
import com.cineverse.booking.service.TheatreService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for Theatre, Screen, and Seat management.
 */
@RestController
@RequestMapping("/theatres")
public class TheatreController {

    private final TheatreService theatreService;

    public TheatreController(TheatreService theatreService) {
        this.theatreService = theatreService;
    }

    /**
     * GET /theatres — Get all theatres.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Theatre>>> getAllTheatres() {
        List<Theatre> theatres = theatreService.getAllTheatres();
        return ResponseEntity.ok(ApiResponse.success("Theatres retrieved", theatres));
    }

    /**
     * GET /theatres/{id} — Get a theatre by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Theatre>> getTheatre(@PathVariable Long id) {
        Theatre theatre = theatreService.getTheatreById(id);
        return ResponseEntity.ok(ApiResponse.success("Theatre retrieved", theatre));
    }

    /**
     * POST /theatres — Create a new theatre.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Theatre>> createTheatre(@RequestBody Theatre theatre) {
        Theatre created = theatreService.createTheatre(theatre);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Theatre created", created));
    }

    /**
     * POST /theatres/{id}/screens — Add a screen to a theatre.
     */
    @PostMapping("/{id}/screens")
    public ResponseEntity<ApiResponse<Screen>> addScreen(@PathVariable Long id, @RequestBody Screen screen) {
        Screen created = theatreService.addScreen(id, screen);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Screen added", created));
    }

    /**
     * POST /theatres/screens/{screenId}/seats — Add seats in a 2D grid to a screen.
     * Body: { "rows": 5, "seatsPerRow": 10, "seatType": "REGULAR", "price": 200.0 }
     */
    @PostMapping("/screens/{screenId}/seats")
    public ResponseEntity<ApiResponse<List<Seat>>> addSeats(
            @PathVariable Long screenId,
            @RequestBody Map<String, Object> body) {
        int rows = (int) body.get("rows");
        int seatsPerRow = (int) body.get("seatsPerRow");
        SeatType seatType = SeatType.valueOf((String) body.getOrDefault("seatType", "REGULAR"));
        Double price = Double.valueOf(body.getOrDefault("price", 200.0).toString());

        List<Seat> seats = theatreService.addSeatsGrid(screenId, rows, seatsPerRow, seatType, price);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Seats added", seats));
    }

    /**
     * GET /theatres/{id}/screens — Get all screens for a theatre.
     */
    @GetMapping("/{id}/screens")
    public ResponseEntity<ApiResponse<List<Screen>>> getScreens(@PathVariable Long id) {
        List<Screen> screens = theatreService.getScreensByTheatre(id);
        return ResponseEntity.ok(ApiResponse.success("Screens retrieved", screens));
    }
}
