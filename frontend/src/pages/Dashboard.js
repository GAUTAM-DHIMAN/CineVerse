// src/pages/Dashboard.js
// User dashboard — booking history and account overview

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/bookingService';

const STATUS_COLORS = {
  CONFIRMED: '#48bb78',
  LOCKED: '#ecc94b',
  CANCELLED: '#e53e3e',
  EXPIRED: '#718096',
  INITIATED: '#6c63ff',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const res = await getMyBookings();
    if (res.success) {
      setBookings(Array.isArray(res.data) ? res.data : []);
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-page" id="dashboard-page" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
          Welcome back, {user?.name || 'User'} 👋
        </h1>
        <p style={{ color: '#a0aec0', fontSize: '14px' }}>
          Role: <span style={{ color: '#6c63ff', fontWeight: '600' }}>{user?.role || 'USER'}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {[
          { label: 'Total Bookings', value: bookings.length, icon: '🎫' },
          { label: 'Confirmed', value: bookings.filter(b => b.status === 'CONFIRMED').length, icon: '✅' },
          { label: 'Cancelled', value: bookings.filter(b => b.status === 'CANCELLED').length, icon: '❌' },
          { label: 'Total Spent', value: `₹${bookings.filter(b => b.status === 'CONFIRMED').reduce((s, b) => s + (b.totalPrice || 0), 0).toFixed(0)}`, icon: '💰' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{
            padding: '20px',
            background: 'rgba(108,99,255,0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(108,99,255,0.15)',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>{value}</div>
            <div style={{ fontSize: '13px', color: '#a0aec0' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Booking History */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' }}>
          Booking History
        </h2>

        {loading ? (
          <p style={{ color: '#a0aec0' }}>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            background: 'rgba(108,99,255,0.05)',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
            <p style={{ color: '#a0aec0', marginBottom: '16px' }}>No bookings yet</p>
            <Link to="/movies" style={{
              padding: '10px 20px',
              background: '#6c63ff',
              borderRadius: '8px',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: '600',
            }}>
              Browse Movies
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bookings.map((booking) => (
              <div key={booking.id} style={{
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '15px' }}>
                    Booking #{booking.id}
                  </div>
                  <div style={{ fontSize: '13px', color: '#a0aec0', marginTop: '4px' }}>
                    Show #{booking.showId} · {booking.showSeatIds?.length || 0} seat(s) · ₹{booking.totalPrice?.toFixed(2)}
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#fff',
                  background: STATUS_COLORS[booking.status] || '#718096',
                }}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
