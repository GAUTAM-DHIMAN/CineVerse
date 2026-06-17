package com.cineverse.booking.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

/**
 * Seat entity — belongs to a Screen.
 * Represents a physical seat (A1, A2, B1, etc.) with type and base price.
 */
@Entity
@Table(name = "seats")
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String seatNumber; // e.g., A1, A2, B1, C4

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatType type = SeatType.REGULAR;

    @Column(nullable = false)
    private Double price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screen_id", nullable = false)
    @JsonIgnore
    private Screen screen;

    // --- Getters & Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public SeatType getType() { return type; }
    public void setType(SeatType type) { this.type = type; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Screen getScreen() { return screen; }
    public void setScreen(Screen screen) { this.screen = screen; }
}
