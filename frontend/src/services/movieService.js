// src/services/movieService.js
// Simulated API layer — returns Promises with artificial delay
// Swap these for real Axios calls when backend is ready.

import { MOCK_MOVIES, MOCK_REVIEWS } from './mockData';

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch paginated list of movies with optional filters.
 */
export async function getMovies({ genre, search, page = 1, limit = 20 } = {}) {
  await delay();

  let filtered = [...MOCK_MOVIES];

  if (genre) {
    filtered = filtered.filter((m) =>
      m.genres.map((g) => g.toLowerCase()).includes(genre.toLowerCase())
    );
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.overview.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q)
    );
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  const movies = filtered.slice(start, start + limit);

  return {
    success: true,
    data: {
      movies,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  };
}

/**
 * Fetch a single movie by ID.
 */
export async function getMovieById(id) {
  await delay(400);

  const movie = MOCK_MOVIES.find((m) => m.id === id);

  if (!movie) {
    return {
      success: false,
      error: { code: 'MOVIE_NOT_FOUND', message: `No movie found with id: ${id}` },
    };
  }

  return { success: true, data: movie };
}

/**
 * Fetch reviews for a given movie.
 */
export async function getReviewsByMovie(movieId) {
  await delay(500);

  const reviews = MOCK_REVIEWS.filter((r) => r.movieId === movieId);

  return {
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: reviews.length,
        itemsPerPage: 10,
        hasNext: false,
        hasPrev: false,
      },
    },
  };
}

/**
 * Submit a new review (mock — just returns the submitted data).
 */
export async function createReview({ movieId, rating, title, content, containsSpoilers = false }) {
  await delay(800);

  return {
    success: true,
    data: {
      id: `rev_${Date.now()}`,
      movieId,
      user: { id: 'usr_a1b2c3d4', username: 'john_doe' },
      rating,
      title,
      content,
      containsSpoilers,
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
    },
    message: 'Review published successfully',
  };
}

/**
 * Search movies by query string.
 */
export async function searchMovies(query) {
  return getMovies({ search: query });
}
