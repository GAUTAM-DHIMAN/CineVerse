// src/components/MovieCard.js
// Reusable, premium movie card with hover effects and micro-animations

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRuntime, getStarRating, truncate } from '../utils/helpers';

export default function MovieCard({ movie }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fallbackPoster = `https://placehold.co/300x450/1a1a2e/e94560?text=${encodeURIComponent(movie.title)}`;

  return (
    <Link to={`/movies/${movie.id}`} className="movie-card" id={`movie-card-${movie.id}`}>
      {/* Poster */}
      <div className="movie-card-poster">
        <img
          src={imageError ? fallbackPoster : movie.posterUrl}
          alt={movie.title}
          className={`poster-img ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />

        {/* Rating Badge */}
        <div className="card-rating-badge">
          <span className="rating-star">★</span>
          <span className="rating-value">{movie.rating}</span>
        </div>

        {/* Hover Overlay */}
        <div className="card-overlay">
          <p className="card-overview">{truncate(movie.overview, 150)}</p>
          <span className="card-cta">View Details →</span>
        </div>
      </div>

      {/* Info */}
      <div className="movie-card-info">
        <h3 className="card-title">{movie.title}</h3>
        <div className="card-meta">
          <span className="card-year">{new Date(movie.releaseDate).getFullYear()}</span>
          <span className="card-dot">·</span>
          <span className="card-runtime">{formatRuntime(movie.runtime)}</span>
        </div>
        <div className="card-genres">
          {movie.genres.slice(0, 2).map((g) => (
            <span key={g} className="genre-tag">{g}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
