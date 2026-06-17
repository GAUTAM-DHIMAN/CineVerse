// src/pages/AdminDashboard.js
// Admin panel for ADMIN and THEATRE_OWNER roles

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTheatres } from '../services/bookingService';
import { getMovies } from '../services/movieService';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [theatres, setTheatres] = useState([]);
  const [movieCount, setMovieCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [theatreRes, movieRes] = await Promise.all([
      getTheatres(),
      getMovies({ limit: 1 }),
    ]);
    if (theatreRes.success) setTheatres(Array.isArray(theatreRes.data) ? theatreRes.data : []);
    if (movieRes.success) setMovieCount(movieRes.data?.totalItems || 0);
    setLoading(false);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isOwner = user?.role === 'THEATRE_OWNER';

  return (
    <div className="admin-page" id="admin-dashboard" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>
          {isAdmin ? '🛡️ Admin Panel' : '🎭 Theatre Owner Panel'}
        </h1>
        <p style={{ color: '#a0aec0', fontSize: '14px' }}>
          Manage {isAdmin ? 'the entire platform' : 'your theatres and shows'}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {isAdmin && (
          <StatCard icon="🎬" label="Total Movies" value={movieCount} />
        )}
        <StatCard icon="🏛️" label="Theatres" value={theatres.length} />
        <StatCard
          icon="📺"
          label="Total Screens"
          value={theatres.reduce((sum, t) => sum + (t.screens?.length || 0), 0)}
        />
      </div>

      {/* Theatre List */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' }}>
          Theatres
        </h2>
        {loading ? (
          <p style={{ color: '#a0aec0' }}>Loading...</p>
        ) : theatres.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            background: 'rgba(108,99,255,0.05)',
            borderRadius: '12px',
          }}>
            <p style={{ color: '#a0aec0' }}>No theatres found. Create one to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {theatres.map((theatre) => (
              <div key={theatre.id} style={{
                padding: '20px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ color: '#e2e8f0', fontWeight: '600', marginBottom: '4px' }}>{theatre.name}</h3>
                <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '8px' }}>
                  {theatre.city} · {theatre.address}
                </p>
                <div style={{
                  fontSize: '12px',
                  color: '#6c63ff',
                  fontWeight: '600',
                }}>
                  {theatre.screens?.length || 0} screen(s)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={{
      padding: '20px',
      background: 'rgba(108,99,255,0.08)',
      borderRadius: '12px',
      border: '1px solid rgba(108,99,255,0.15)',
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#a0aec0' }}>{label}</div>
    </div>
  );
}
