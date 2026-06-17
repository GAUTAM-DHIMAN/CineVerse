package com.cineverse.booking.service;

import com.cineverse.booking.config.RabbitConfig;
import com.cineverse.booking.model.Booking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Publishes booking events to RabbitMQ for downstream consumers
 * (e.g., notification service, analytics).
 */
@Service
public class BookingEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(BookingEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public BookingEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Publish a BOOKING_CONFIRMED event.
     * Downstream services can consume this to send emails, SMS, etc.
     */
    public void publishBookingConfirmed(Booking booking) {
        Map<String, Object> event = Map.of(
                "eventType", "BOOKING_CONFIRMED",
                "bookingId", booking.getId(),
                "userId", booking.getUserId(),
                "showId", booking.getShowId(),
                "totalPrice", booking.getTotalPrice(),
                "seatCount", booking.getShowSeatIds().size(),
                "confirmedAt", booking.getConfirmedAt().toString()
        );

        try {
            rabbitTemplate.convertAndSend(
                    RabbitConfig.BOOKING_EXCHANGE,
                    RabbitConfig.BOOKING_ROUTING_KEY,
                    event
            );
            log.info("Published BOOKING_CONFIRMED event for booking {}", booking.getId());
        } catch (Exception e) {
            // Don't fail the booking if event publishing fails
            log.error("Failed to publish booking event for booking {}: {}",
                    booking.getId(), e.getMessage());
        }
    }
}
