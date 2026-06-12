// src/pages/MovieDetails.js
// Rich movie detail page with backdrop hero, cast, and reviews

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMovieById, getReviewsByMovie } from '../services/movieService';
import { formatRuntime, formatDate, getStarRating, getAvatarColor } from '../utils/helpers';

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [movieRes, reviewRes] = await Promise.all([
        getMovieById(id),
        getReviewsByMovie(id),
      ]);

      if (movieRes.success) {
        setMovie(movieRes.data);
      } else {
        setError(movieRes.error.message);
      }

      if (reviewRes.success) {
        setReviews(reviewRes.data.reviews);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-screen" id="movie-detail-loading">
        <div className="spinner" />
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="error-page" id="movie-not-found">
        <span className="error-icon">😕</span>
        <h2>Movie Not Found</h2>
        <p>{error || 'The movie you are looking for does not exist.'}</p>
        <Link to="/movies" className="btn btn-primary">Back to Catalog</Link>
      </div>
    );
  }

  return (
    <div className="detail-page" id="movie-detail-page">
      {/* Backdrop Hero */}
      <section
        className="detail-hero"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10,10,30,0.2) 0%, rgba(10,10,30,0.98) 85%), url(${movie.backdropUrl})`,
        }}
      >
        <div className="detail-hero-content">
          <div className="detail-poster">
            <img src={movie.posterUrl} alt={movie.title} />
          </div>
          <div className="detail-info">
            <h1 className="detail-title">{movie.title}</h1>
            {movie.tagline && <p className="detail-tagline">"{movie.tagline}"</p>}

            <div className="detail-meta">
              <span className="detail-rating">
                <span className="rating-star">★</span> {movie.rating}/10
              </span>
              <span className="meta-separator">|</span>
              <span>{formatRuntime(movie.runtime)}</span>
              <span className="meta-separator">|</span>
              <span>{formatDate(movie.releaseDate)}</span>
              <span className="meta-separator">|</span>
              <span className="detail-cert">{movie.certification}</span>
            </div>

            <div className="detail-genres">
              {movie.genres.map((g) => (
                <span key={g} className="genre-tag">{g}</span>
              ))}
            </div>

            <p className="detail-overview">{movie.overview}</p>

            <div className="detail-crew">
              <span className="crew-label">Director</span>
              <span className="crew-name">{movie.director}</span>
            </div>

            <div className="detail-actions">
              <button className="btn btn-primary btn-lg" id="book-tickets-btn">
                🎟️ Book Tickets
              </button>
              <button className="btn btn-outline btn-lg" id="add-watchlist-btn">
                ♡ Add to Watchlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cast Section */}
      {movie.cast && movie.cast.length > 0 && (
        <section className="section" id="cast-section">
          <h2 className="section-title">
            <span className="section-icon">🎭</span>
            Cast
          </h2>
          <div className="cast-grid">
            {movie.cast.map((actor, i) => (
              <div key={i} className="cast-card">
                <div
                  className="cast-avatar"
                  style={{ backgroundColor: getAvatarColor(actor.name) }}
                >
                  {actor.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="cast-info">
                  <p className="cast-name">{actor.name}</p>
                  <p className="cast-character">{actor.character}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="section" id="reviews-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-icon">💬</span>
            Reviews ({reviews.length})
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✍️</span>
            <h3>No reviews yet</h3>
            <p>Be the first to review this movie!</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card" id={`review-${review.id}`}>
                <div className="review-header">
                  <div
                    className="review-avatar"
                    style={{ backgroundColor: getAvatarColor(review.user.username) }}
                  >
                    {review.user.username[0].toUpperCase()}
                  </div>
                  <div className="review-meta">
                    <span className="review-username">{review.user.username}</span>
                    <span className="review-date">{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="review-rating">
                    <span className="rating-star">★</span> {review.rating}/10
                  </div>
                </div>
                <h4 className="review-title">{review.title}</h4>
                <p className="review-content">{review.content}</p>
                <div className="review-footer">
                  <button className="btn-helpful">👍 Helpful ({review.helpfulCount})</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
