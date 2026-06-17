// Show routes — scheduling, overlap validation, seat availability

const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /shows — list all (optionally filter by movieId)
router.get('/', (req, res) => {
  const db = getDb();
  const { movieId } = req.query;

  let shows;
  if (movieId) {
    shows = db.prepare('SELECT * FROM shows WHERE movie_id = ?').all(movieId);
  } else {
    shows = db.prepare('SELECT * FROM shows').all();
  }

  res.json({ status: 'success', message: 'Shows retrieved', data: shows });
});

// POST /shows — schedule a new show
router.post('/', (req, res) => {
  const { movieId, screenId, startTime, endTime, price } = req.body;
  const db = getDb();

  // Validate screen
  const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(screenId);
  if (!screen) return res.status(400).json({ status: 'error', message: 'Screen not found' });

  // Check overlaps
  const overlaps = db.prepare(
    'SELECT * FROM shows WHERE screen_id = ? AND start_time < ? AND end_time > ?'
  ).all(screenId, endTime, startTime);

  if (overlaps.length > 0) {
    return res.status(400).json({ status: 'error', message: `Show overlaps with existing show (ID: ${overlaps[0].id})` });
  }

  const result = db.prepare(
    'INSERT INTO shows (movie_id, screen_id, start_time, end_time, price) VALUES (?, ?, ?, ?, ?)'
  ).run(movieId, screenId, startTime, endTime, price);

  const showId = result.lastInsertRowid;

  // Initialize show_seats for all seats in the screen
  const seats = db.prepare('SELECT * FROM seats WHERE screen_id = ?').all(screenId);
  const insertShowSeat = db.prepare(
    'INSERT INTO show_seats (show_id, seat_id, seat_number, seat_type, price, status) VALUES (?, ?, ?, ?, ?, ?)'
  );

  for (const seat of seats) {
    insertShowSeat.run(showId, seat.id, seat.seat_number, seat.type, seat.price, 'AVAILABLE');
  }

  const show = db.prepare('SELECT * FROM shows WHERE id = ?').get(showId);
  res.status(201).json({ status: 'success', message: 'Show scheduled successfully', data: show });
});

// GET /shows/seats/:showId — get seat map for a show  (also available as /seats/:showId)
router.get('/seats/:showId', (req, res) => {
  const db = getDb();
  const seats = db.prepare('SELECT * FROM show_seats WHERE show_id = ?').all(req.params.showId);
  res.json({ status: 'success', message: 'Seats retrieved', data: seats });
});

module.exports = router;
