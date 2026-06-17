package com.cineverse.movie.exception;

/**
 * Thrown when a movie is not found by the given ID.
 */
public class MovieNotFoundException extends RuntimeException {

    public MovieNotFoundException(String id) {
        super("Movie not found with id: " + id);
    }
}
