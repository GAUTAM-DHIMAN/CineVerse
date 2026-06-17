package com.cineverse.booking.model;

/**
 * Booking states (FSM): INITIATED → LOCKED → CONFIRMED / CANCELLED / EXPIRED
 */
public enum BookingStatus {
    INITIATED,
    LOCKED,
    CONFIRMED,
    CANCELLED,
    EXPIRED
}
