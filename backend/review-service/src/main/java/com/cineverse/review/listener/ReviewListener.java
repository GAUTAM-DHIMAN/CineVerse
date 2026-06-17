package com.cineverse.review.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Consumes events from RabbitMQ queues (review and booking notifications).
 * Includes retry mechanism and idempotency checks.
 */
@Component
public class ReviewListener {

    private static final Logger log = LoggerFactory.getLogger(ReviewListener.class);

    // Idempotency: track processed event IDs to prevent duplicate processing
    private final Set<String> processedEvents = ConcurrentHashMap.newKeySet();

    private final RetryTemplate retryTemplate;

    public ReviewListener(RetryTemplate retryTemplate) {
        this.retryTemplate = retryTemplate;
    }

    /**
     * Handle review notification events.
     */
    @RabbitListener(queues = "review-notification")
    public void handleReviewNotification(String message) {
        log.info("[NOTIFICATION] Review created: {}", message);
        // In production: send email/push notification to movie followers
    }

    /**
     * Handle booking confirmed events with retry and idempotency.
     */
    @RabbitListener(queues = "booking-notification")
    public void handleBookingConfirmed(Map<String, Object> event) {
        String bookingId = String.valueOf(event.get("bookingId"));

        // Idempotency check — skip if already processed
        if (processedEvents.contains(bookingId)) {
            log.info("[IDEMPOTENT] Booking {} already processed, skipping", bookingId);
            return;
        }

        retryTemplate.execute(context -> {
            int attempt = context.getRetryCount() + 1;
            log.info("[NOTIFICATION] Processing booking confirmed event (attempt {}): bookingId={}, userId={}, amount={}",
                    attempt,
                    event.get("bookingId"),
                    event.get("userId"),
                    event.get("totalPrice"));

            // In production: send confirmation email, SMS, push notification
            processBookingNotification(event);

            // Mark as processed for idempotency
            processedEvents.add(bookingId);
            return null;
        });
    }

    /**
     * Process the booking notification (placeholder for real notification logic).
     */
    private void processBookingNotification(Map<String, Object> event) {
        // Simulate notification sending
        log.info("[EMAIL] Booking confirmation sent to user {} for {} seats, total: ${}",
                event.get("userId"),
                event.get("seatCount"),
                event.get("totalPrice"));
    }
}
