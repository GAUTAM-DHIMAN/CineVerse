package com.cineverse.movie.service;

import com.cineverse.movie.exception.MovieNotFoundException;
import com.cineverse.movie.model.Movie;
import com.cineverse.movie.model.Review;
import com.cineverse.movie.repository.MovieRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service layer for Movie CRUD, search, reviews, and file upload.
 */
@Service
public class MovieService {

    private final MovieRepository movieRepository;
    private static final String UPLOAD_DIR = "uploads/posters/";

    public MovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    /**
     * Create a new movie.
     */
    public Movie createMovie(Movie movie) {
        return movieRepository.save(movie);
    }

    /**
     * Get all movies with pagination and sorting by rating descending.
     */
    public Page<Movie> getAllMovies(int page, int size) {
        return movieRepository.findAll(
                PageRequest.of(page, size, Sort.by("rating").descending()));
    }

    /**
     * Get a movie by ID.
     */
    public Movie getMovieById(String id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new MovieNotFoundException(id));
    }

    /**
     * Update an existing movie.
     */
    public Movie updateMovie(String id, Movie movie) {
        Movie existing = getMovieById(id);
        if (movie.getTitle() != null) existing.setTitle(movie.getTitle());
        if (movie.getGenre() != null) existing.setGenre(movie.getGenre());
        if (movie.getGenres() != null && !movie.getGenres().isEmpty()) existing.setGenres(movie.getGenres());
        if (movie.getRating() != null) existing.setRating(movie.getRating());
        if (movie.getLanguage() != null) existing.setLanguage(movie.getLanguage());
        if (movie.getDuration() != null) existing.setDuration(movie.getDuration());
        if (movie.getReleaseDate() != null) existing.setReleaseDate(movie.getReleaseDate());
        if (movie.getReleaseYear() != null) existing.setReleaseYear(movie.getReleaseYear());
        if (movie.getDescription() != null) existing.setDescription(movie.getDescription());
        if (movie.getOverview() != null) existing.setOverview(movie.getOverview());
        if (movie.getTagline() != null) existing.setTagline(movie.getTagline());
        if (movie.getBackdropUrl() != null) existing.setBackdropUrl(movie.getBackdropUrl());
        if (movie.getPosterUrl() != null) existing.setPosterUrl(movie.getPosterUrl());
        return movieRepository.save(existing);
    }

    /**
     * Delete a movie by ID.
     */
    public void deleteMovie(String id) {
        if (!movieRepository.existsById(id)) {
            throw new MovieNotFoundException(id);
        }
        movieRepository.deleteById(id);
    }

    /**
     * Search movies by title, genre, and/or minimum rating with pagination.
     */
    public Page<Movie> searchMovies(String title, String genre, Double rating, int page, int size) {
        return movieRepository.searchMovies(
                title != null ? title : "",
                genre != null ? genre : "",
                rating != null ? rating : 0.0,
                PageRequest.of(page, size, Sort.by("rating").descending()));
    }

    /**
     * Add a review to a movie and recalculate the average rating.
     */
    public Movie addReview(String movieId, Review review) {
        Movie movie = getMovieById(movieId);
        review.setCreatedAt(LocalDateTime.now());
        movie.getReviews().add(review);

        // Recalculate average rating
        double avgRating = movie.getReviews().stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        movie.setRating(Math.round(avgRating * 10.0) / 10.0);

        return movieRepository.save(movie);
    }

    /**
     * Get all reviews for a movie.
     */
    public List<Review> getReviews(String movieId) {
        Movie movie = getMovieById(movieId);
        return movie.getReviews();
    }

    /**
     * Handle poster file upload and return the file path.
     */
    public String uploadPoster(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);

        return filePath.toString();
    }
}
