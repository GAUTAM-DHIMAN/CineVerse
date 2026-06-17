package com.cineverse.movie.controller;

import com.cineverse.movie.dto.ApiResponse;
import com.cineverse.movie.model.Movie;
import com.cineverse.movie.model.Review;
import com.cineverse.movie.service.MovieService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * REST controller for Movie CRUD, search, reviews, and poster upload.
 * All responses use the standardized ApiResponse format.
 */
@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    /**
     * POST /api/movies — Create a new movie.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Movie>> createMovie(@RequestBody Movie movie) {
        Movie created = movieService.createMovie(movie);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Movie created successfully", created));
    }

    /**
     * GET /api/movies — Get all movies with pagination and sorting.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Movie> moviePage = movieService.getAllMovies(page, size);
        Map<String, Object> data = Map.of(
                "movies", moviePage.getContent(),
                "currentPage", moviePage.getNumber(),
                "totalItems", moviePage.getTotalElements(),
                "totalPages", moviePage.getTotalPages()
        );
        return ResponseEntity.ok(ApiResponse.success("Movies retrieved", data));
    }

    /**
     * GET /api/movies/{id} — Get a movie by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Movie>> getMovie(@PathVariable String id) {
        Movie movie = movieService.getMovieById(id);
        return ResponseEntity.ok(ApiResponse.success("Movie retrieved", movie));
    }

    /**
     * PUT /api/movies/{id} — Update an existing movie.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Movie>> updateMovie(@PathVariable String id,
                                                           @RequestBody Movie movie) {
        Movie updated = movieService.updateMovie(id, movie);
        return ResponseEntity.ok(ApiResponse.success("Movie updated", updated));
    }

    /**
     * DELETE /api/movies/{id} — Delete a movie by ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMovie(@PathVariable String id) {
        movieService.deleteMovie(id);
        return ResponseEntity.ok(ApiResponse.success("Movie deleted"));
    }

    /**
     * GET /api/movies/search — Search movies by title, genre, and/or rating.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchMovies(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Double rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Movie> moviePage = movieService.searchMovies(title, genre, rating, page, size);
        Map<String, Object> data = Map.of(
                "movies", moviePage.getContent(),
                "currentPage", moviePage.getNumber(),
                "totalItems", moviePage.getTotalElements(),
                "totalPages", moviePage.getTotalPages()
        );
        return ResponseEntity.ok(ApiResponse.success("Search results", data));
    }

    /**
     * POST /api/movies/{id}/reviews — Add a review to a movie.
     */
    @PostMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse<Movie>> addReview(@PathVariable String id,
                                                         @RequestBody Review review) {
        Movie movie = movieService.addReview(id, review);
        return ResponseEntity.ok(ApiResponse.success("Review added", movie));
    }

    /**
     * GET /api/movies/{id}/reviews — Get all reviews for a movie.
     */
    @GetMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse<List<Review>>> getReviews(@PathVariable String id) {
        List<Review> reviews = movieService.getReviews(id);
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved", reviews));
    }

    /**
     * POST /api/movies/poster — Upload a movie poster.
     */
    @PostMapping("/poster")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPoster(
            @RequestParam("file") MultipartFile file) throws IOException {
        String path = movieService.uploadPoster(file);
        return ResponseEntity.ok(ApiResponse.success("Poster uploaded",
                Map.of("posterUrl", path)));
    }
}
