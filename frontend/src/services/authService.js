// src/services/authService.js
// Mock authentication service — simulates JWT flow with localStorage

import { MOCK_USERS } from './mockData';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

const FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfYTFiMmMzZDQiLCJleHAiOjk5OTk5OTk5OTl9.mock';
const FAKE_REFRESH = 'mock_refresh_token_cineverse';

/**
 * Simulate login — checks against MOCK_USERS.
 */
export async function login(email, password) {
  await delay(700);

  const user = MOCK_USERS[email];

  if (!user || user.password !== password) {
    return {
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    };
  }

  const { password: _, ...safeUser } = user;

  return {
    success: true,
    data: {
      accessToken: FAKE_JWT,
      refreshToken: FAKE_REFRESH,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: safeUser,
    },
  };
}

/**
 * Simulate registration — always succeeds for new emails.
 */
export async function register({ username, email, password, fullName }) {
  await delay(700);

  if (MOCK_USERS[email]) {
    return {
      success: false,
      error: { code: 'USER_EXISTS', message: 'A user with this email already exists' },
    };
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    username,
    email,
    fullName,
    role: 'USER',
    avatar: null,
    createdAt: new Date().toISOString(),
    reviewCount: 0,
    watchlistCount: 0,
  };

  return {
    success: true,
    data: newUser,
    message: 'Registration successful',
  };
}

/**
 * Simulate profile fetch.
 */
export async function getProfile() {
  await delay(300);

  const stored = localStorage.getItem('cv_user');
  if (!stored) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    };
  }

  return { success: true, data: JSON.parse(stored) };
}
