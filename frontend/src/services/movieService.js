// src/services/movieService.js
// API layer for movies — calls Spring Boot Movie Service via Gateway

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const API = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('cv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fetch paginated list of movies.
 */
export async function getMovies({ genre, search, page = 0, limit = 20 } = {}) {
  try {
    const params = { page, size: limit };
    if (genre) params.genre = genre;
    if (search) params.search = search;

    const res = await API.get('/movies', { params });
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: { message: err.response?.data?.message || 'Failed to fetch movies' } };
  }
}

/**
 * Fetch a single movie by ID.
 */
export async function getMovieById(id) {
  try {
    const res = await API.get(`/movies/${id}`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return {
      success: false,
      error: { code: 'MOVIE_NOT_FOUND', message: err.response?.data?.message || `No movie found with id: ${id}` },
    };
  }
}

/**
 * Search movies by title, genre, or rating.
 */
export async function searchMovies(query) {
  try {
    const res = await API.get('/movies/search', { params: { title: query } });
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: { message: err.response?.data?.message || 'Search failed' } };
  }
}

/**
 * Fetch reviews for a movie.
 */
export async function getReviewsByMovie(movieId) {
  try {
    const res = await API.get(`/movies/${movieId}/reviews`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: true, data: [] };
  }
}

/**
 * Submit a new review for a movie.
 */
export async function createReview({ movieId, rating, title, content, containsSpoilers = false }) {
  try {
    const res = await API.post(`/movies/${movieId}/reviews`, {
      userName: 'Anonymous',
      rating,
      comment: content || title,
    });
    return { success: true, data: res.data.data, message: 'Review published successfully' };
  } catch (err) {
    return { success: false, error: { message: err.response?.data?.message || 'Failed to submit review' } };
  }
}
