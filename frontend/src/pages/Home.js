// src/pages/Home.js
// Hero landing page with featured movies carousel

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMovies } from '../services/movieService';
import MovieCard from '../components/MovieCard';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await getMovies({ limit: 8 });
      if (result.success) {
        setFeatured(result.data.movies.slice(0, 3));
        setTrending(result.data.movies);
      }
      setLoading(false);
    }
    load();
  }, []);

  const hero = featured[0];

  return (
    <div className="home-page" id="home-page">
      {/* Hero Section */}
      <section
        className="hero"
        id="hero-section"
        style={{
          backgroundImage: hero
            ? `linear-gradient(to bottom, rgba(10,10,30,0.3), rgba(10,10,30,0.95)), url(${hero.backdropUrl})`
            : undefined,
        }}
      >
        <div className="hero-content">
          <span className="hero-badge">🔥 Now Trending</span>
          <h1 className="hero-title">{hero?.title || 'Welcome to CineVerse'}</h1>
          <p className="hero-tagline">{hero?.tagline || 'Discover. Watch. Review.'}</p>
          <p className="hero-overview">{hero?.overview || 'Your ultimate destination for movies, reviews, and bookings.'}</p>
          <div className="hero-actions">
            <Link to={hero ? `/movies/${hero.id}` : '/movies'} className="btn btn-primary btn-lg" id="hero-cta">
              {hero ? 'View Details' : 'Browse Movies'}
            </Link>
            <Link to="/movies" className="btn btn-outline btn-lg" id="hero-browse">
              Explore All
            </Link>
          </div>
          {hero && (
            <div className="hero-meta">
              <span className="hero-rating">★ {hero.rating}</span>
              <span className="hero-dot">·</span>
              <span>{hero.genres?.join(', ')}</span>
              <span className="hero-dot">·</span>
              <span>{new Date(hero.releaseDate).getFullYear()}</span>
            </div>
          )}
        </div>
      </section>

      {/* Trending Section */}
      <section className="section" id="trending-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-icon">🎬</span>
            Trending Now
          </h2>
          <Link to="/movies" className="section-link">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="loading-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-poster shimmer" />
                <div className="skeleton-text shimmer" />
                <div className="skeleton-text short shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div className="movie-grid">
            {trending.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* Stats Banner */}
      <section className="stats-banner" id="stats-section">
        <div className="stat-item">
          <span className="stat-number">10K+</span>
          <span className="stat-label">Movies</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">50K+</span>
          <span className="stat-label">Reviews</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">100K+</span>
          <span className="stat-label">Users</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">4.9</span>
          <span className="stat-label">App Rating</span>
        </div>
      </section>
    </div>
  );
}
