// Booking routes — FSM: initiate (lock) → confirm → cancel

const express = require('express');
const { getDb } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
const LOCK_TTL_MINUTES = 5;

// POST /booking — initiate booking (lock seats)
router.post('/', optionalAuth, (req, res) => {
  const { showId, seatIds } = req.body;
  const userId = req.user?.email || 'anonymous';
  const db = getDb();

  if (!showId || !seatIds || !seatIds.length) {
    return res.status(400).json({ status: 'error', message: 'showId and seatIds are required' });
  }

  // Validate show
  const show = db.prepare('SELECT * FROM shows WHERE id = ?').get(showId);
  if (!show) return res.status(400).json({ status: 'error', message: 'Show not found' });

  // Fetch & validate seats
  const placeholders = seatIds.map(() => '?').join(',');
  const seats = db.prepare(`SELECT * FROM show_seats WHERE id IN (${placeholders}) AND show_id = ?`).all(...seatIds, showId);

  if (seats.length !== seatIds.length) {
    return res.status(400).json({ status: 'error', message: 'One or more seats not found for this show' });
  }

  let totalPrice = 0;
  for (const seat of seats) {
    if (seat.status !== 'AVAILABLE') {
      return res.status(400).json({ status: 'error', message: `Seat ${seat.seat_number} is not available (${seat.status})` });
    }
    totalPrice += seat.price;
  }

  // Lock seats
  const now = new Date().toISOString();
  const lockStmt = db.prepare('UPDATE show_seats SET status = ?, locked_at = ?, locked_by = ? WHERE id = ?');
  for (const seat of seats) {
    lockStmt.run('LOCKED', now, userId, seat.id);
  }

  // Create booking
  const result = db.prepare(`
    INSERT INTO bookings (user_id, show_id, show_seat_ids, status, total_price, locked_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, showId, JSON.stringify(seatIds), 'LOCKED', totalPrice, now);

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);
  booking.showSeatIds = JSON.parse(booking.show_seat_ids);

  res.status(201).json({
    status: 'success',
    message: 'Seats locked successfully. Confirm within 5 minutes.',
    data: formatBooking(booking),
  });
});

// POST /booking/:id/confirm
router.post('/:id/confirm', (req, res) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

  if (!booking) return res.status(404).json({ status: 'error', message: 'Booking not found' });
  if (booking.status !== 'LOCKED') {
    return res.status(400).json({ status: 'error', message: `Cannot confirm — current status: ${booking.status}` });
  }

  // Check TTL
  const lockedAt = new Date(booking.locked_at);
  if (Date.now() - lockedAt.getTime() > LOCK_TTL_MINUTES * 60000) {
    // Expire
    const seatIds = JSON.parse(booking.show_seat_ids);
    const releaseStmt = db.prepare('UPDATE show_seats SET status = ?, locked_at = NULL, locked_by = NULL WHERE id = ?');
    for (const id of seatIds) releaseStmt.run('AVAILABLE', id);
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('EXPIRED', booking.id);
    return res.status(400).json({ status: 'error', message: 'Booking lock expired. Please rebook.' });
  }

  // Confirm seats
  const seatIds = JSON.parse(booking.show_seat_ids);
  const confirmStmt = db.prepare('UPDATE show_seats SET status = ?, locked_at = NULL WHERE id = ?');
  for (const id of seatIds) confirmStmt.run('BOOKED', id);

  const now = new Date().toISOString();
  db.prepare('UPDATE bookings SET status = ?, confirmed_at = ? WHERE id = ?').run('CONFIRMED', now, booking.id);

  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id);
  res.json({ status: 'success', message: 'Booking confirmed', data: formatBooking(updated) });
});

// POST /booking/:id/cancel
router.post('/:id/cancel', (req, res) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

  if (!booking) return res.status(404).json({ status: 'error', message: 'Booking not found' });
  if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
    return res.status(400).json({ status: 'error', message: `Booking is already ${booking.status}` });
  }

  // Release seats
  const seatIds = JSON.parse(booking.show_seat_ids);
  const releaseStmt = db.prepare('UPDATE show_seats SET status = ?, locked_at = NULL, locked_by = NULL WHERE id = ?');
  for (const id of seatIds) releaseStmt.run('AVAILABLE', id);

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('CANCELLED', booking.id);

  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id);
  res.json({ status: 'success', message: 'Booking cancelled', data: formatBooking(updated) });
});

// GET /booking/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ status: 'error', message: 'Booking not found' });
  res.json({ status: 'success', message: 'Booking retrieved', data: formatBooking(booking) });
});

// GET /booking/user/:userId
router.get('/user/:userId', (req, res) => {
  const db = getDb();
  const bookings = db.prepare('SELECT * FROM bookings WHERE user_id = ?').all(req.params.userId);
  res.json({ status: 'success', message: 'User bookings retrieved', data: bookings.map(formatBooking) });
});

function formatBooking(row) {
  return {
    id: row.id,
    userId: row.user_id,
    showId: row.show_id,
    showSeatIds: JSON.parse(row.show_seat_ids || '[]'),
    status: row.status,
    totalPrice: row.total_price,
    lockedAt: row.locked_at,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  };
}

module.exports = router;
