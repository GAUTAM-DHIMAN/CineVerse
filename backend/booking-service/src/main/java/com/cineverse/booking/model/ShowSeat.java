package com.cineverse.booking.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * ShowSeat — per-show seat status (AVAILABLE / LOCKED / BOOKED).
 * Created when a show is scheduled. Uses optimistic locking (@Version)
 * to prevent double-booking.
 */
@Entity
@Table(name = "show_seats", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"show_id", "seat_id"})
})
public class ShowSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "show_id", nullable = false)
    private Long showId;

    @Column(name = "seat_id", nullable = false)
    private Long seatId;

    private String seatNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatType seatType;

    private Double price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatStatus status = SeatStatus.AVAILABLE;

    private LocalDateTime lockedAt;

    private String lockedBy; // userId who locked the seat

    @Version
    private Long version; // Optimistic locking

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getShowId() { return showId; }
    public void setShowId(Long showId) { this.showId = showId; }

    public Long getSeatId() { return seatId; }
    public void setSeatId(Long seatId) { this.seatId = seatId; }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public SeatType getSeatType() { return seatType; }
    public void setSeatType(SeatType seatType) { this.seatType = seatType; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public SeatStatus getStatus() { return status; }
    public void setStatus(SeatStatus status) { this.status = status; }

    public LocalDateTime getLockedAt() { return lockedAt; }
    public void setLockedAt(LocalDateTime lockedAt) { this.lockedAt = lockedAt; }

    public String getLockedBy() { return lockedBy; }
    public void setLockedBy(String lockedBy) { this.lockedBy = lockedBy; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
