package com.cineverse.review.listener;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class ReviewListener {
    @RabbitListener(queues = "review-notification")
    public void handle(String message){
        System.out.println("[notification] review created: " + message);
    }
}
