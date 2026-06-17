package com.cineverse.booking.controller;

import com.cineverse.booking.dto.ApiResponse;
import com.cineverse.booking.dto.BookingRequest;
import com.cineverse.booking.model.Booking;
import com.cineverse.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the booking workflow.
 * Supports: initiate (lock seats) → confirm → cancel.
 */
@RestController
@RequestMapping("/booking")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * POST /booking — Initiate a booking (select & lock seats).
     * The userId is extracted from the X-User-Email header (set by gateway).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Booking>> initiateBooking(
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @Valid @RequestBody BookingRequest request) {
        // Fall back to a placeholder if header not present (direct access without gateway)
        String userId = (userEmail != null) ? userEmail : "anonymous";

        Booking booking = bookingService.initiateBooking(userId, request.getShowId(), request.getSeatIds());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Seats locked successfully. Confirm within 5 minutes.", booking));
    }

    /**
     * POST /booking/{id}/confirm — Confirm a locked booking.
     */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<Booking>> confirmBooking(@PathVariable Long id) {
        Booking booking = bookingService.confirmBooking(id);
        return ResponseEntity.ok(ApiResponse.success("Booking confirmed", booking));
    }

    /**
     * POST /booking/{id}/cancel — Cancel a booking.
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Booking>> cancelBooking(@PathVariable Long id) {
        Booking booking = bookingService.cancelBooking(id);
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled", booking));
    }

    /**
     * GET /booking/{id} — Get booking details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Booking>> getBooking(@PathVariable Long id) {
        Booking booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(ApiResponse.success("Booking retrieved", booking));
    }

    /**
     * GET /booking/user/{userId} — Get all bookings for a user.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Booking>>> getUserBookings(@PathVariable String userId) {
        List<Booking> bookings = bookingService.getBookingsByUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User bookings retrieved", bookings));
    }
}
