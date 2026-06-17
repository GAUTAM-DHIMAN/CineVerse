// Theatre routes — CRUD for theatres, screens, seats

const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /theatres
router.get('/', (req, res) => {
  const db = getDb();
  const theatres = db.prepare('SELECT * FROM theatres').all();

  const result = theatres.map(t => {
    const screens = db.prepare('SELECT * FROM screens WHERE theatre_id = ?').all(t.id);
    return { ...t, screens: screens.map(s => ({ ...s, seats: db.prepare('SELECT * FROM seats WHERE screen_id = ?').all(s.id) })) };
  });

  res.json({ status: 'success', message: 'Theatres retrieved', data: result });
});

// GET /theatres/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const theatre = db.prepare('SELECT * FROM theatres WHERE id = ?').get(req.params.id);
  if (!theatre) return res.status(404).json({ status: 'error', message: 'Theatre not found' });

  const screens = db.prepare('SELECT * FROM screens WHERE theatre_id = ?').all(theatre.id);
  theatre.screens = screens;

  res.json({ status: 'success', message: 'Theatre retrieved', data: theatre });
});

// POST /theatres
router.post('/', (req, res) => {
  const { name, address, city } = req.body;
  const db = getDb();
  const result = db.prepare('INSERT INTO theatres (name, address, city) VALUES (?, ?, ?)').run(name, address, city);
  const theatre = db.prepare('SELECT * FROM theatres WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ status: 'success', message: 'Theatre created', data: theatre });
});

// POST /theatres/:id/screens
router.post('/:id/screens', (req, res) => {
  const { name } = req.body;
  const db = getDb();
  const theatre = db.prepare('SELECT * FROM theatres WHERE id = ?').get(req.params.id);
  if (!theatre) return res.status(404).json({ status: 'error', message: 'Theatre not found' });

  const result = db.prepare('INSERT INTO screens (name, theatre_id) VALUES (?, ?)').run(name, req.params.id);
  const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ status: 'success', message: 'Screen added', data: screen });
});

// POST /theatres/screens/:screenId/seats — add seat grid
router.post('/screens/:screenId/seats', (req, res) => {
  const { rows = 5, seatsPerRow = 10, seatType = 'REGULAR', price = 200 } = req.body;
  const db = getDb();

  const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(req.params.screenId);
  if (!screen) return res.status(404).json({ status: 'error', message: 'Screen not found' });

  const insertSeat = db.prepare('INSERT INTO seats (seat_number, type, price, screen_id) VALUES (?, ?, ?, ?)');
  const seats = [];

  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    for (let s = 1; s <= seatsPerRow; s++) {
      const result = insertSeat.run(`${rowLabel}${s}`, seatType, price, req.params.screenId);
      seats.push({ id: result.lastInsertRowid, seatNumber: `${rowLabel}${s}`, type: seatType, price });
    }
  }

  res.status(201).json({ status: 'success', message: 'Seats added', data: seats });
});

// GET /theatres/:id/screens
router.get('/:id/screens', (req, res) => {
  const db = getDb();
  const screens = db.prepare('SELECT * FROM screens WHERE theatre_id = ?').all(req.params.id);
  res.json({ status: 'success', message: 'Screens retrieved', data: screens });
});

module.exports = router;
