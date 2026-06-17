// src/services/bookingService.js
// API layer for booking — calls Spring Boot Booking Service via Gateway

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const API = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('cv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Theatre APIs ─────────────────────────────────────────────

export async function getTheatres() {
  try {
    const res = await API.get('/theatres');
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: { message: err.response?.data?.message || 'Failed to fetch theatres' } };
  }
}

export async function getTheatreById(id) {
  try {
    const res = await API.get(`/theatres/${id}`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: { message: err.response?.data?.message || 'Theatre not found' } };
  }
}

// ─── Show APIs ────────────────────────────────────────────────

export async function getShowsByMovie(movieId) {
  try {
    const res = await API.get(`/shows/movie/${movieId}`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: true, data: [] };
  }
}

export async function getShowById(showId) {
  try {
    const res = await API.get(`/shows/${showId}`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: { message: err.response?.data?.message || 'Show not found' } };
  }
}

// ─── Seat APIs ────────────────────────────────────────────────

export async function getSeatsByShow(showId) {
  try {
    const res = await API.get(`/seats/show/${showId}`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: true, data: [] };
  }
}

// ─── Booking APIs ─────────────────────────────────────────────

export async function initiateBooking(showId, seatIds) {
  try {
    const res = await API.post('/booking', { showId, seatIds });
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: { message: err.response?.data?.message || 'Booking failed' } };
  }
}

export async function confirmBooking(bookingId) {
  try {
    const res = await API.post(`/booking/${bookingId}/confirm`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: { message: err.response?.data?.message || 'Confirmation failed' } };
  }
}

export async function cancelBooking(bookingId) {
  try {
    const res = await API.post(`/booking/${bookingId}/cancel`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: { message: err.response?.data?.message || 'Cancellation failed' } };
  }
}

export async function getMyBookings() {
  try {
    const res = await API.get('/booking/my');
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: true, data: [] };
  }
}

export async function getBookingById(id) {
  try {
    const res = await API.get(`/booking/${id}`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: { message: err.response?.data?.message || 'Booking not found' } };
  }
}
