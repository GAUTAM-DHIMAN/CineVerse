import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllReviews } from '../services/movieService';
import { formatDate, getAvatarColor } from '../utils/helpers';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      const res = await getAllReviews();
      if (res.success) {
        setReviews(res.data.reviews || []);
      }
      setLoading(false);
    }
    loadReviews();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen" id="reviews-loading">
        <div className="spinner" />
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="catalog-page" id="reviews-page">
      <div className="page-header">
        <h1>Community Reviews</h1>
        <p className="page-subtitle">What the community is saying</p>
      </div>

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✍️</span>
            <h3>No reviews yet</h3>
            <p>Community reviews will show up here.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-card" id={`review-${review.id}`}>
              <div className="review-header">
                <div
                  className="review-avatar"
                  style={{ backgroundColor: getAvatarColor(review.user.username || 'Anonymous') }}
                >
                  {review.user.username ? review.user.username[0].toUpperCase() : 'A'}
                </div>
                <div className="review-meta">
                  <span className="review-username">{review.user.username || 'Anonymous'}</span>
                  <span className="review-movie-link">
                    reviewed{' '}
                    <Link to={`/movies/${review.movieId}`} className="inline-link">
                      {review.movieTitle || 'Unknown Movie'}
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
          ))
        )}
      </div>
    </div>
  );
}
