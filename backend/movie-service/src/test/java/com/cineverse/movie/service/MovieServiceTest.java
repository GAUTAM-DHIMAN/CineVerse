package com.cineverse.movie.service;

import com.cineverse.movie.exception.MovieNotFoundException;
import com.cineverse.movie.model.Movie;
import com.cineverse.movie.model.Review;
import com.cineverse.movie.repository.MovieRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MovieService — CRUD, search, reviews, and rating aggregation.
 */
@ExtendWith(MockitoExtension.class)
class MovieServiceTest {

    @Mock
    private MovieRepository movieRepository;

    @InjectMocks
    private MovieService movieService;

    private Movie testMovie;

    @BeforeEach
    void setUp() {
        testMovie = new Movie();
        testMovie.setId("movie-123");
        testMovie.setTitle("Inception");
        testMovie.setGenre("Sci-Fi");
        testMovie.setRating(8.8);
        testMovie.setLanguage("English");
        testMovie.setDuration(148);
        testMovie.setReviews(new ArrayList<>());
    }

    @Test
    void createMovie_shouldSaveAndReturn() {
        when(movieRepository.save(testMovie)).thenReturn(testMovie);

        Movie created = movieService.createMovie(testMovie);

        assertNotNull(created);
        assertEquals("Inception", created.getTitle());
        verify(movieRepository).save(testMovie);
    }

    @Test
    void getMovieById_withExistingId_shouldReturnMovie() {
        when(movieRepository.findById("movie-123")).thenReturn(Optional.of(testMovie));

        Movie found = movieService.getMovieById("movie-123");

        assertEquals("Inception", found.getTitle());
    }

    @Test
    void getMovieById_withNonExistentId_shouldThrow() {
        when(movieRepository.findById("no-movie")).thenReturn(Optional.empty());

        assertThrows(MovieNotFoundException.class, () -> movieService.getMovieById("no-movie"));
    }

    @Test
    void getAllMovies_shouldReturnPaginatedResults() {
        Page<Movie> page = new PageImpl<>(List.of(testMovie));
        when(movieRepository.findAll(any(PageRequest.class))).thenReturn(page);

        Page<Movie> result = movieService.getAllMovies(0, 20);

        assertEquals(1, result.getTotalElements());
        assertEquals("Inception", result.getContent().get(0).getTitle());
    }

    @Test
    void deleteMovie_withExistingId_shouldDelete() {
        when(movieRepository.existsById("movie-123")).thenReturn(true);

        movieService.deleteMovie("movie-123");

        verify(movieRepository).deleteById("movie-123");
    }

    @Test
    void deleteMovie_withNonExistentId_shouldThrow() {
        when(movieRepository.existsById("no-movie")).thenReturn(false);

        assertThrows(MovieNotFoundException.class, () -> movieService.deleteMovie("no-movie"));
    }

    @Test
    void addReview_shouldRecalculateAverageRating() {
        when(movieRepository.findById("movie-123")).thenReturn(Optional.of(testMovie));
        when(movieRepository.save(any(Movie.class))).thenAnswer(inv -> inv.getArgument(0));

        Review review1 = new Review();
        review1.setRating(8);
        review1.setReviewText("Great movie!");
        review1.setUserId("user1");

        Movie result = movieService.addReview("movie-123", review1);

        assertEquals(1, result.getReviews().size());
        assertEquals(8.0, result.getRating());

        // Add second review
        Review review2 = new Review();
        review2.setRating(10);
        review2.setReviewText("Masterpiece!");
        review2.setUserId("user2");

        result = movieService.addReview("movie-123", review2);

        assertEquals(2, result.getReviews().size());
        assertEquals(9.0, result.getRating()); // (8 + 10) / 2 = 9.0
    }

    @Test
    void getReviews_shouldReturnMovieReviews() {
        Review review = new Review();
        review.setRating(9);
        review.setReviewText("Amazing!");
        testMovie.setReviews(List.of(review));

        when(movieRepository.findById("movie-123")).thenReturn(Optional.of(testMovie));

        List<Review> reviews = movieService.getReviews("movie-123");

        assertEquals(1, reviews.size());
        assertEquals(9, reviews.get(0).getRating());
    }

    @Test
    void updateMovie_shouldPartiallyUpdate() {
        when(movieRepository.findById("movie-123")).thenReturn(Optional.of(testMovie));
        when(movieRepository.save(any(Movie.class))).thenAnswer(inv -> inv.getArgument(0));

        Movie update = new Movie();
        update.setTitle("Inception 2");
        update.setRating(9.5);

        Movie result = movieService.updateMovie("movie-123", update);

        assertEquals("Inception 2", result.getTitle());
        assertEquals(9.5, result.getRating());
        assertEquals("Sci-Fi", result.getGenre()); // unchanged
    }
}
