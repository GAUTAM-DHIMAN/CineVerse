package com.cineverse.review.controller;

import com.cineverse.review.model.Review;
import com.cineverse.review.repository.ReviewRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewRepository repo;
    private final RabbitTemplate rabbit;

    public ReviewController(ReviewRepository repo, RabbitTemplate rabbit){this.repo=repo;this.rabbit=rabbit;}

    @PostMapping
    public Review create(@RequestBody Review r){
        r.setCreatedAt(OffsetDateTime.now());
        Review saved = repo.save(r);
        rabbit.convertAndSend("review-exchange","review.notification", saved.getId());
        return saved;
    }

    @GetMapping("/movie/{movieId}")
    public List<Review> byMovie(@PathVariable Long movieId){ return repo.findByMovieId(movieId); }

    @PutMapping("/{id}")
    public ResponseEntity<Review> update(@PathVariable String id,@RequestBody Review r){
        return repo.findById(id).map(existing->{
            r.setId(existing.getId());
            r.setCreatedAt(existing.getCreatedAt());
            return ResponseEntity.ok(repo.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id){ repo.deleteById(id); return ResponseEntity.noContent().build(); }
}
