package com.cineverse.booking.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * DTO for initiating a booking — select seats for a show.
 */
public class BookingRequest {

    @NotNull(message = "Show ID is required")
    private Long showId;

    @NotNull(message = "Seat IDs are required")
    private List<Long> seatIds;

    public Long getShowId() { return showId; }
    public void setShowId(Long showId) { this.showId = showId; }

    public List<Long> getSeatIds() { return seatIds; }
    public void setSeatIds(List<Long> seatIds) { this.seatIds = seatIds; }
}
