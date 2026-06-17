// src/pages/BookingPage.js
// Booking flow: Select Show → Select Seats → Confirm

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getShowsByMovie, getSeatsByShow, initiateBooking, confirmBooking } from '../services/bookingService';
import { getMovieById } from '../services/movieService';
import SeatLayout from '../components/SeatLayout';

export default function BookingPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [booking, setBooking] = useState(null);
  const [step, setStep] = useState('select-show'); // select-show | select-seats | confirm | done
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/booking/${movieId}` } });
      return;
    }
    loadData();
  }, [movieId, isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    const [movieRes, showsRes] = await Promise.all([
      getMovieById(movieId),
      getShowsByMovie(movieId),
    ]);
    if (movieRes.success) setMovie(movieRes.data);
    if (showsRes.success) setShows(Array.isArray(showsRes.data) ? showsRes.data : []);
    setLoading(false);
  };

  const handleShowSelect = useCallback(async (show) => {
    setSelectedShow(show);
    setSelectedSeats([]);
    setError('');
    setLoading(true);
    const res = await getSeatsByShow(show.id);
    if (res.success) setSeats(Array.isArray(res.data) ? res.data : []);
    setStep('select-seats');
    setLoading(false);
  }, []);

  const handleSeatClick = useCallback((seat) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      }
      return [...prev, seat.id];
    });
  }, []);

  const handleInitiateBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }
    setLoading(true);
    setError('');
    const res = await initiateBooking(selectedShow.id, selectedSeats);
    if (res.success) {
      setBooking(res.data);
      setStep('confirm');
    } else {
      setError(res.error?.message || 'Booking failed');
    }
    setLoading(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    const res = await confirmBooking(booking.id);
    if (res.success) {
      setBooking(res.data);
      setStep('done');
    } else {
      setError(res.error?.message || 'Confirmation failed');
    }
    setLoading(false);
  };

  const totalPrice = selectedSeats.reduce((sum, seatId) => {
    const seat = seats.find((s) => s.id === seatId);
    return sum + (seat?.price || 0);
  }, 0);

  if (loading && !movie) {
    return (
      <div className="page-loading" id="booking-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="booking-page" id="booking-page" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Movie Header */}
      {movie && (
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>
            Book Tickets — {movie.title}
          </h1>
          <p style={{ color: '#a0aec0', fontSize: '14px' }}>
            {movie.genre} · {movie.duration ? `${movie.duration} min` : ''} · ★ {movie.rating}
          </p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(229,62,62,0.15)',
          border: '1px solid rgba(229,62,62,0.3)',
          borderRadius: '8px',
          color: '#fc8181',
          marginBottom: '16px',
          fontSize: '14px',
        }} id="booking-error">
          {error}
        </div>
      )}

      {/* Step 1: Select Show */}
      {step === 'select-show' && (
        <div id="step-select-show">
          <h2 style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '16px' }}>Select a Show</h2>
          {shows.length === 0 ? (
            <p style={{ color: '#a0aec0' }}>No shows available for this movie.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {shows.map((show) => (
                <button
                  key={show.id}
                  id={`show-${show.id}`}
                  onClick={() => handleShowSelect(show)}
                  style={{
                    padding: '16px',
                    background: 'rgba(108,99,255,0.1)',
                    border: '1px solid rgba(108,99,255,0.3)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>
                    {new Date(show.startTime).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#6c63ff', marginTop: '4px' }}>
                    {new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {show.price && (
                    <div style={{ fontSize: '13px', color: '#a0aec0', marginTop: '4px' }}>
                      From ₹{show.price}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Seats */}
      {step === 'select-seats' && (
        <div id="step-select-seats">
          <h2 style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '16px' }}>
            Select Your Seats
          </h2>
          <SeatLayout seats={seats} selectedSeats={selectedSeats} onSeatClick={handleSeatClick} />

          {/* Selection Summary */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(108,99,255,0.1)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <span style={{ color: '#a0aec0', fontSize: '14px' }}>
                {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
              </span>
              <span style={{ color: '#6c63ff', fontWeight: '700', fontSize: '20px', marginLeft: '16px' }}>
                ₹{totalPrice.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setStep('select-show'); setSelectedSeats([]); }}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#a0aec0',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                id="btn-lock-seats"
                onClick={handleInitiateBooking}
                disabled={selectedSeats.length === 0 || loading}
                style={{
                  padding: '10px 24px',
                  background: selectedSeats.length > 0 ? '#6c63ff' : '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: selectedSeats.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? 'Locking...' : 'Lock Seats'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && booking && (
        <div id="step-confirm" style={{
          padding: '32px',
          background: 'rgba(108,99,255,0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(108,99,255,0.2)',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#6c63ff', fontSize: '22px', marginBottom: '16px' }}>
            Seats Locked! ⏱️
          </h2>
          <p style={{ color: '#a0aec0', marginBottom: '24px' }}>
            Your seats are locked for 5 minutes. Please confirm to complete the booking.
          </p>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>
            Total: ₹{booking.totalPrice?.toFixed(2)}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#a0aec0',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              id="btn-confirm-booking"
              onClick={handleConfirm}
              disabled={loading}
              style={{
                padding: '12px 32px',
                background: '#48bb78',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Processing...' : '✓ Confirm & Pay'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && booking && (
        <div id="step-done" style={{
          padding: '48px 32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ color: '#48bb78', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            Booking Confirmed!
          </h2>
          <p style={{ color: '#a0aec0', marginBottom: '24px' }}>
            Booking ID: <strong style={{ color: '#e2e8f0' }}>#{booking.id}</strong>
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 24px',
              background: '#6c63ff',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
