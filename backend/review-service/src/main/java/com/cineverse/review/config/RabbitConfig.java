package com.cineverse.review.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.backoff.ExponentialBackOffPolicy;
import org.springframework.retry.policy.SimpleRetryPolicy;
import org.springframework.retry.support.RetryTemplate;

/**
 * RabbitMQ configuration for consuming review and booking events.
 * Includes retry mechanism with exponential backoff.
 */
@Configuration
public class RabbitConfig {

    // Review notification queue
    @Bean
    public DirectExchange reviewExchange() {
        return new DirectExchange("review-exchange");
    }

    @Bean
    public Queue reviewQueue() {
        return new Queue("review-notification");
    }

    @Bean
    public Binding reviewBinding(Queue reviewQueue, DirectExchange reviewExchange) {
        return BindingBuilder.bind(reviewQueue).to(reviewExchange).with("review.notification");
    }

    // Booking notification queue (consumed from booking-service)
    @Bean
    public DirectExchange bookingExchange() {
        return new DirectExchange("booking-exchange");
    }

    @Bean
    public Queue bookingQueue() {
        return QueueBuilder.durable("booking-notification")
                .withArgument("x-dead-letter-exchange", "booking-dlx-exchange")
                .withArgument("x-dead-letter-routing-key", "booking.dead")
                .build();
    }

    @Bean
    public Binding bookingBinding(Queue bookingQueue, DirectExchange bookingExchange) {
        return BindingBuilder.bind(bookingQueue).to(bookingExchange).with("booking.confirmed");
    }

    // Dead Letter Queue
    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange("booking-dlx-exchange");
    }

    @Bean
    public Queue dlqQueue() {
        return QueueBuilder.durable("booking-dlq").build();
    }

    @Bean
    public Binding dlqBinding(Queue dlqQueue, DirectExchange dlxExchange) {
        return BindingBuilder.bind(dlqQueue).to(dlxExchange).with("booking.dead");
    }

    // JSON message converter
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    // Retry template with exponential backoff
    @Bean
    public RetryTemplate retryTemplate() {
        RetryTemplate template = new RetryTemplate();

        ExponentialBackOffPolicy backOff = new ExponentialBackOffPolicy();
        backOff.setInitialInterval(1000);    // 1 second
        backOff.setMultiplier(2.0);          // double each retry
        backOff.setMaxInterval(10000);       // max 10 seconds
        template.setBackOffPolicy(backOff);

        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(3);       // retry 3 times max
        template.setRetryPolicy(retryPolicy);

        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter());
        factory.setDefaultRequeueRejected(false);
        factory.setPrefetchCount(1);
        return factory;
    }
}
