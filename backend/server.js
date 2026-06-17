// CineVerse Backend — Consolidated Express.js + SQLite Server
// Replaces all 4 Spring Boot microservices + API Gateway
// Run: npm start → http://localhost:5000

const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db/database');
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const reviewRoutes = require('./routes/reviews');
const theatreRoutes = require('./routes/theatres');
const showRoutes = require('./routes/shows');
const bookingRoutes = require('./routes/bookings');
const uploadRoutes = require('./routes/upload');
const { startSeatLockScheduler } = require('./services/seatLockScheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Request Logger ─────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── Routes ─────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/movies', movieRoutes);
app.use('/reviews', reviewRoutes);
app.use('/theatres', theatreRoutes);
app.use('/shows', showRoutes);
app.use('/booking', bookingRoutes);
app.use('/upload', uploadRoutes);

// ── Health Check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'success', message: 'CineVerse backend is running' });
});

// ── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

// ── Start Server ───────────────────────────────────────────
db.initialize();
startSeatLockScheduler();

app.listen(PORT, () => {
  console.log(`\n🎬 CineVerse Backend running at http://localhost:${PORT}`);
  console.log(`   Auth:     POST /auth/register, POST /auth/login`);
  console.log(`   Movies:   GET  /movies, GET /movies/:id`);
  console.log(`   Reviews:  GET  /reviews/:movieId, POST /reviews`);
  console.log(`   Theatres: GET  /theatres, POST /theatres`);
  console.log(`   Shows:    GET  /shows, POST /shows`);
  console.log(`   Booking:  POST /booking, POST /booking/:id/confirm`);
  console.log(`   Upload:   POST /upload\n`);
});
