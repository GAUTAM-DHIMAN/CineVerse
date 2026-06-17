// src/services/authService.js
// API authentication service — calls Express backend

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
 * Login — calls POST /auth/login
 * Backend returns: { status, message, data: { accessToken, refreshToken, tokenType, expiresIn, user } }
 */
export async function login(email, password) {
  try {
    const res = await API.post('/auth/login', { email, password });
    const data = res.data.data;
    return {
      success: true,
      data: {
        accessToken: data.accessToken,
        user: data.user,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: err.response?.data?.message || 'Login failed' },
    };
  }
}

/**
 * Register — calls POST /api/auth/register
 */
export async function register({ username, email, password, fullName, role }) {
  try {
    const res = await API.post('/auth/register', {
      name: fullName || username,
      email,
      password,
      role: role || 'USER',
    });
    return { success: true, data: res.data.data, message: 'Registration successful' };
  } catch (err) {
    return {
      success: false,
      error: { code: 'REGISTER_FAILED', message: err.response?.data?.message || 'Registration failed' },
    };
  }
}

/**
 * Get profile — calls GET /api/auth/profile
 */
export async function getProfile() {
  try {
    const res = await API.get('/auth/profile');
    return { success: true, data: res.data.data };
  } catch (err) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: err.response?.data?.message || 'Not authenticated' },
    };
  }
}

/**
 * Forgot Password — calls POST /api/auth/forgot-password
 */
export async function forgotPassword(email) {
  try {
    const res = await API.post('/auth/forgot-password', { email });
    return { success: true, data: res.data.data };
  } catch (err) {
    return {
      success: false,
      error: { message: err.response?.data?.message || 'Request failed' },
    };
  }
}

/**
 * Reset Password — calls POST /api/auth/reset-password
 */
export async function resetPassword(token, newPassword) {
  try {
    const res = await API.post('/auth/reset-password', { token, newPassword });
    return { success: true, message: res.data.message };
  } catch (err) {
    return {
      success: false,
      error: { message: err.response?.data?.message || 'Reset failed' },
    };
  }
}
