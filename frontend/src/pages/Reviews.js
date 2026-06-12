// src/pages/Reviews.js
// Reviews hub page — shows all recent reviews across movies

import React from 'react';
import { Link } from 'react-router-dom';
import { MOCK_REVIEWS, MOCK_MOVIES } from '../services/mockData';
import { formatDate, getAvatarColor } from '../utils/helpers';

export default function Reviews() {
  const getMovieTitle = (movieId) => {
    const movie = MOCK_MOVIES.find((m) => m.id === movieId);
    return movie?.title || 'Unknown Movie';
  };

  return (
    <div className="catalog-page" id="reviews-page">
      <div className="page-header">
        <h1>Community Reviews</h1>
        <p className="page-subtitle">What the community is saying</p>
      </div>

      <div className="reviews-list">
        {MOCK_REVIEWS.map((review) => (
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
                <span className="review-movie-link">
                  reviewed{' '}
                  <Link to={`/movies/${review.movieId}`} className="inline-link">
                    {getMovieTitle(review.movieId)}
                  </Link>
                </span>
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
    </div>
  );
}
