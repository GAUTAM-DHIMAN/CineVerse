// Auth routes — register, login, logout, forgot-password, reset-password, profile

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /auth/register
router.post('/register', (req, res) => {
  const { name, username, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'Name, email, and password are required' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ status: 'error', message: 'A user with this email already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userRole = role || 'USER';

  const result = db.prepare(`
    INSERT INTO users (name, username, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, username || email.split('@')[0], email, hashedPassword, userRole);

  const user = db.prepare('SELECT id, name, username, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    status: 'success',
    message: 'Registration successful',
    data: formatUser(user),
  });
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
  }

  const token = generateToken(user);

  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      accessToken: token,
      refreshToken: `refresh_${uuidv4()}`,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: formatUser(user),
    },
  });
});

// GET /auth/logout
router.get('/logout', authenticateToken, (req, res) => {
  res.json({ status: 'success', message: 'Logged out successfully (stateless — discard token on client)' });
});

// POST /auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.status(404).json({ status: 'error', message: 'No user found with this email' });
  }

  const resetToken = uuidv4();
  const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?')
    .run(resetToken, expiry, user.id);

  res.json({
    status: 'success',
    message: 'Password reset token generated (in production, this would be emailed)',
    data: { resetToken },
  });
});

// POST /auth/reset-password
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);

  if (!user) {
    return res.status(400).json({ status: 'error', message: 'Invalid reset token' });
  }

  if (new Date(user.reset_token_expiry) < new Date()) {
    return res.status(400).json({ status: 'error', message: 'Reset token has expired' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?')
    .run(hashedPassword, user.id);

  res.json({ status: 'success', message: 'Password reset successfully' });
});

// GET /auth/profile
router.get('/profile', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, username, email, role, created_at FROM users WHERE id = ?').get(req.user.id);

  if (!user) {
    return res.status(404).json({ status: 'error', message: 'User not found' });
  }

  const reviewCount = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE user_id = ?').get(user.id).count;

  res.json({
    status: 'success',
    message: 'Profile retrieved',
    data: { ...formatUser(user), reviewCount, watchlistCount: 0 },
  });
});

function formatUser(row) {
  return {
    id: `usr_${row.id}`,
    username: row.username,
    email: row.email,
    fullName: row.name,
    role: row.role,
    avatar: null,
    createdAt: row.created_at,
  };
}

module.exports = router;
