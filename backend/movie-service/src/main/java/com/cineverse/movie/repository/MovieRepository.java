package com.cineverse.movie.repository;

import com.cineverse.movie.model.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

/**
 * Spring Data MongoDB repository for Movie documents.
 */
public interface MovieRepository extends MongoRepository<Movie, String> {

    /**
     * Full-text search across title and genre (case-insensitive regex).
     */
    @Query("{ '$or': [ " +
           "  { 'title': { '$regex': ?0, '$options': 'i' } }, " +
           "  { 'genre': { '$regex': ?0, '$options': 'i' } }, " +
           "  { 'genres': { '$regex': ?0, '$options': 'i' } } " +
           "] }")
    List<Movie> search(String query);

    /**
     * Search movies by optional title, genre, and minimum rating with pagination.
     */
    @Query("{ '$and': [ " +
           "  { 'title': { '$regex': ?0, '$options': 'i' } }, " +
           "  { 'genre': { '$regex': ?1, '$options': 'i' } }, " +
           "  { 'rating': { '$gte': ?2 } } " +
           "] }")
    Page<Movie> searchMovies(String title, String genre, Double rating, Pageable pageable);

    List<Movie> findByGenreIgnoreCase(String genre);

    Page<Movie> findAll(Pageable pageable);
}
