package com.cineverse.booking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * WebClient configuration for inter-service HTTP calls.
 */
@Configuration
public class WebClientConfig {

    @Value("${services.movie-service.url:http://movie-service:8082}")
    private String movieServiceUrl;

    /**
     * WebClient bean pre-configured with the Movie Service base URL.
     */
    @Bean
    public WebClient movieServiceWebClient() {
        return WebClient.builder()
                .baseUrl(movieServiceUrl)
                .build();
    }
}
