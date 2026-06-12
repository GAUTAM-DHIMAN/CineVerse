// src/pages/Watchlist.js
// Protected watchlist page with mock data

import React from 'react';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import { MOCK_MOVIES } from '../services/mockData';

export default function Watchlist() {
  const { user } = useAuth();

  // Simulated watchlist — first 3 movies
  const watchlist = MOCK_MOVIES.slice(0, 3);

  return (
    <div className="catalog-page" id="watchlist-page">
      <div className="page-header">
        <h1>My Watchlist</h1>
        <p className="page-subtitle">
          {user?.fullName}'s saved movies ({watchlist.length})
        </p>
      </div>

      {watchlist.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>Your watchlist is empty</h3>
          <p>Browse the catalog and add movies you want to watch later.</p>
        </div>
      ) : (
        <div className="movie-grid" id="watchlist-grid">
          {watchlist.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
