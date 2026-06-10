package com.cineverse.movie.controller;

import com.cineverse.movie.model.Movie;
import com.cineverse.movie.repository.MovieRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
public class MovieController {
    private final MovieRepository repo;

    public MovieController(MovieRepository repo){this.repo=repo;}

    @GetMapping
    public List<Movie> list(){return repo.findAll();}

    @GetMapping("/{id}")
    public ResponseEntity<Movie> get(@PathVariable Long id){
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Movie create(@RequestBody Movie m){return repo.save(m);}

    @PutMapping("/{id}")
    public ResponseEntity<Movie> update(@PathVariable Long id,@RequestBody Movie m){
        return repo.findById(id).map(existing->{
            m.setId(existing.getId());
            return ResponseEntity.ok(repo.save(m));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id){ repo.deleteById(id); return ResponseEntity.noContent().build(); }

    @GetMapping("/search")
    public List<Movie> search(@RequestParam String q){ return repo.search(q); }
}
