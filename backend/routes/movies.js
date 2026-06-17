// Movie routes — CRUD, search, pagination

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /movies — list all with pagination, search, genre filter
router.get('/', (req, res) => {
  const { search, genre, page = 1, limit = 20, rating } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = [];
  let params = [];

  if (search) {
    where.push("(title LIKE ? OR overview LIKE ? OR director LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (genre) {
    where.push("genres LIKE ?");
    params.push(`%${genre}%`);
  }
  if (rating) {
    where.push("rating >= ?");
    params.push(parseFloat(rating));
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const totalItems = db.prepare(`SELECT COUNT(*) as count FROM movies ${whereClause}`).get(...params).count;
  const movies = db.prepare(`SELECT * FROM movies ${whereClause} ORDER BY rating DESC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

  const totalPages = Math.ceil(totalItems / parseInt(limit));

  res.json({
    status: 'success',
    data: {
      movies: movies.map(formatMovie),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    },
  });
});

// GET /movies/search — alias for filtered list
router.get('/search', (req, res) => {
  req.query.search = req.query.title || req.query.search;
  // Forward to the main GET handler
  const { search, genre, rating, page = 1, limit = 20 } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = [];
  let params = [];

  if (search) {
    where.push("(title LIKE ? OR overview LIKE ? OR director LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (genre) {
    where.push("genres LIKE ?");
    params.push(`%${genre}%`);
  }
  if (rating) {
    where.push("rating >= ?");
    params.push(parseFloat(rating));
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const totalItems = db.prepare(`SELECT COUNT(*) as count FROM movies ${whereClause}`).get(...params).count;
  const movies = db.prepare(`SELECT * FROM movies ${whereClause} ORDER BY rating DESC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

  res.json({
    status: 'success',
    message: 'Search results',
    data: {
      movies: movies.map(formatMovie),
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(totalItems / parseInt(limit)), totalItems },
    },
  });
});

// GET /movies/:id — get movie by ID
router.get('/:id', (req, res) => {
  const db = getDb();
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);

  if (!movie) {
    return res.status(404).json({ status: 'error', message: `Movie not found with id: ${req.params.id}` });
  }

  res.json({ status: 'success', data: formatMovie(movie) });
});

// POST /movies — create a new movie
router.post('/', (req, res) => {
  const { title, tagline, overview, posterUrl, backdropUrl, genres, releaseDate, runtime, rating, certification, director, cast } = req.body;
  const db = getDb();
  const id = `mov_${uuidv4().slice(0, 8)}`;

  db.prepare(`
    INSERT INTO movies (id, title, tagline, overview, poster_url, backdrop_url, genres, release_date, runtime, rating, certification, director, cast_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, tagline, overview, posterUrl, backdropUrl, JSON.stringify(genres || []), releaseDate, runtime, rating || 0, certification, director, JSON.stringify(cast || []));

  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
  res.status(201).json({ status: 'success', message: 'Movie created', data: formatMovie(movie) });
});

// PUT /movies/:id — update a movie
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ status: 'error', message: 'Movie not found' });
  }

  const { title, tagline, overview, posterUrl, backdropUrl, genres, releaseDate, runtime, rating, certification, director, cast } = req.body;

  db.prepare(`
    UPDATE movies SET title=?, tagline=?, overview=?, poster_url=?, backdrop_url=?, genres=?, release_date=?, runtime=?, rating=?, certification=?, director=?, cast_json=?
    WHERE id=?
  `).run(
    title || existing.title, tagline || existing.tagline, overview || existing.overview,
    posterUrl || existing.poster_url, backdropUrl || existing.backdrop_url,
    JSON.stringify(genres || JSON.parse(existing.genres || '[]')),
    releaseDate || existing.release_date, runtime || existing.runtime, rating ?? existing.rating,
    certification || existing.certification, director || existing.director,
    JSON.stringify(cast || JSON.parse(existing.cast_json || '[]')),
    req.params.id
  );

  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
  res.json({ status: 'success', message: 'Movie updated', data: formatMovie(movie) });
});

// DELETE /movies/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM movies WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ status: 'error', message: 'Movie not found' });
  }
  res.json({ status: 'success', message: 'Movie deleted' });
});

function formatMovie(row) {
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline,
    overview: row.overview,
    posterUrl: row.poster_url,
    backdropUrl: row.backdrop_url,
    genres: JSON.parse(row.genres || '[]'),
    releaseDate: row.release_date,
    runtime: row.runtime,
    rating: row.rating,
    reviewCount: row.review_count || 0,
    certification: row.certification,
    director: row.director,
    cast: JSON.parse(row.cast_json || '[]'),
    language: row.language || 'English',
  };
}

module.exports = router;
