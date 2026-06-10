package com.cineverse.review.repository;

import com.cineverse.review.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByMovieId(Long movieId);
}
