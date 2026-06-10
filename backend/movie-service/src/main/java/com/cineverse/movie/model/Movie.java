package com.cineverse.movie.model;

import jakarta.persistence.*;

@Entity
@Table(name="movies")
public class Movie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(length=2000)
    private String description;
    private String genre;
    private Integer releaseYear;
    private Double rating;
    private String posterUrl;

    // getters/setters
    public Long getId(){return id;} public void setId(Long i){this.id=i;}
    public String getTitle(){return title;} public void setTitle(String t){this.title=t;}
    public String getDescription(){return description;} public void setDescription(String d){this.description=d;}
    public String getGenre(){return genre;} public void setGenre(String g){this.genre=g;}
    public Integer getReleaseYear(){return releaseYear;} public void setReleaseYear(Integer y){this.releaseYear=y;}
    public Double getRating(){return rating;} public void setRating(Double r){this.rating=r;}
    public String getPosterUrl(){return posterUrl;} public void setPosterUrl(String p){this.posterUrl=p;}
}
