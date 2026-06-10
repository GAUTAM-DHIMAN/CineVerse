package com.cineverse.movie.repository;

import com.cineverse.movie.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface MovieRepository extends JpaRepository<Movie, Long> {
    @Query("select m from Movie m where lower(m.title) like lower(concat('%',:q,'%')) or lower(m.genre) like lower(concat('%',:q,'%'))")
    List<Movie> search(String q);
}
