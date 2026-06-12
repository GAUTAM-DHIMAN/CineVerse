// src/pages/Movies.js
// Movie catalog page with search, genre filter, and grid layout

import React, { useEffect, useState } from 'react';
import { getMovies } from '../services/movieService';
import MovieCard from '../components/MovieCard';
import { MOCK_GENRES } from '../services/mockData';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeGenre, setActiveGenre] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchMovies = async (query = '', genre = '') => {
    setLoading(true);
    const result = await getMovies({ search: query, genre });
    if (result.success) {
      setMovies(result.data.movies);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  // Debounced search
  const handleSearch = (value) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        fetchMovies(value, activeGenre);
      }, 300)
    );
  };

  const handleGenreFilter = (genre) => {
    const newGenre = genre === activeGenre ? '' : genre;
    setActiveGenre(newGenre);
    fetchMovies(search, newGenre);
  };

  return (
    <div className="catalog-page" id="movies-page">
      {/* Page Header */}
      <div className="page-header">
        <h1>Movie Catalog</h1>
        <p className="page-subtitle">Discover your next favorite film</p>
      </div>

      {/* Search & Filters */}
      <div className="catalog-controls" id="catalog-controls">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            id="movie-search"
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search movies, directors..."
            className="search-input"
          />
          {search && (
            <button
              className="search-clear"
              onClick={() => { setSearch(''); fetchMovies('', activeGenre); }}
              id="search-clear"
            >
              ✕
            </button>
          )}
        </div>

        <div className="genre-filters" id="genre-filters">
          <button
            className={`genre-chip ${activeGenre === '' ? 'active' : ''}`}
            onClick={() => handleGenreFilter('')}
          >
            All
          </button>
          {MOCK_GENRES.map((g) => (
            <button
              key={g}
              className={`genre-chip ${activeGenre === g ? 'active' : ''}`}
              onClick={() => handleGenreFilter(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="movie-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-poster shimmer" />
              <div className="skeleton-text shimmer" />
              <div className="skeleton-text short shimmer" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="empty-state" id="no-results">
          <span className="empty-icon">🎥</span>
          <h3>No movies found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="movie-grid" id="movie-grid">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
