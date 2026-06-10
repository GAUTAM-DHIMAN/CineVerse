package com.cineverse.review.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.OffsetDateTime;

@Document(collection = "reviews")
public class Review {
    @Id
    private String id;
    private Long movieId;
    private Long userId;
    private String review;
    private Integer rating;
    private OffsetDateTime createdAt;

    // getters/setters
    public String getId(){return id;} public void setId(String i){this.id=i;}
    public Long getMovieId(){return movieId;} public void setMovieId(Long m){this.movieId=m;}
    public Long getUserId(){return userId;} public void setUserId(Long u){this.userId=u;}
    public String getReview(){return review;} public void setReview(String r){this.review=r;}
    public Integer getRating(){return rating;} public void setRating(Integer r){this.rating=r;}
    public OffsetDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(OffsetDateTime t){this.createdAt=t;}
}
