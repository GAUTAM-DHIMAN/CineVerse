// Review routes

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /reviews — get all reviews (recent reviews across all movies)
router.get('/', (req, res) => {
  const db = getDb();
  const reviews = db.prepare(`
    SELECT r.*, m.title as movie_title 
    FROM reviews r 
    JOIN movies m ON r.movie_id = m.id 
    ORDER BY r.created_at DESC 
    LIMIT 20
  `).all();

  res.json({
    status: 'success',
    data: {
      reviews: reviews.map(formatReview),
    },
  });
});

// GET /reviews/:movieId — get reviews for a movie
router.get('/:movieId', (req, res) => {
  const db = getDb();
  const reviews = db.prepare('SELECT * FROM reviews WHERE movie_id = ? ORDER BY created_at DESC').all(req.params.movieId);

  res.json({
    status: 'success',
    data: {
      reviews: reviews.map(formatReview),
      pagination: { currentPage: 1, totalPages: 1, totalItems: reviews.length, itemsPerPage: 20, hasNext: false, hasPrev: false },
    },
  });
});

// POST /reviews — add a review
router.post('/', optionalAuth, (req, res) => {
  const { movieId, rating, title, content, containsSpoilers } = req.body;
  const db = getDb();

  const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(movieId);
  if (!movie) {
    return res.status(404).json({ status: 'error', message: 'Movie not found' });
  }

  const id = `rev_${uuidv4().slice(0, 8)}`;
  const userId = req.user?.id || null;
  const username = req.user?.email?.split('@')[0] || 'anonymous';

  db.prepare(`
    INSERT INTO reviews (id, movie_id, user_id, username, rating, title, content, contains_spoilers)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, movieId, userId, username, rating, title, content, containsSpoilers ? 1 : 0);

  // Update movie average rating
  const stats = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE movie_id = ?').get(movieId);
  db.prepare('UPDATE movies SET rating = ?, review_count = ? WHERE id = ?')
    .run(Math.round(stats.avg * 10) / 10, stats.cnt, movieId);

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  res.status(201).json({ status: 'success', message: 'Review published successfully', data: formatReview(review) });
});

function formatReview(row) {
  return {
    id: row.id,
    movieId: row.movie_id,
    movieTitle: row.movie_title || null,
    user: { id: row.user_id ? `usr_${row.user_id}` : null, username: row.username, avatar: null },
    rating: row.rating,
    title: row.title,
    content: row.content,
    containsSpoilers: !!row.contains_spoilers,
    helpfulCount: row.helpful_count || 0,
    createdAt: row.created_at,
  };
}

module.exports = router;
