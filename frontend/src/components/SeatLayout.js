// src/components/SeatLayout.js
// Interactive 2D seat grid with real-time selection

import React from 'react';

const SEAT_COLORS = {
  AVAILABLE: '#2d3748',
  SELECTED: '#6c63ff',
  LOCKED: '#e53e3e',
  BOOKED: '#718096',
  PREMIUM: '#d69e2e',
  RECLINER: '#38b2ac',
};

export default function SeatLayout({ seats = [], selectedSeats = [], onSeatClick }) {
  // Group seats by row (first character of seatNumber)
  const rows = {};
  seats.forEach((seat) => {
    const row = seat.seatNumber?.charAt(0) || 'A';
    if (!rows[row]) rows[row] = [];
    rows[row].push(seat);
  });

  // Sort each row by seat number
  Object.keys(rows).forEach((row) => {
    rows[row].sort((a, b) => {
      const numA = parseInt(a.seatNumber?.substring(1) || '0', 10);
      const numB = parseInt(b.seatNumber?.substring(1) || '0', 10);
      return numA - numB;
    });
  });

  const getSeatStyle = (seat) => {
    const isSelected = selectedSeats.includes(seat.id);
    const isAvailable = seat.status === 'AVAILABLE';
    const isBooked = seat.status === 'BOOKED';
    const isLocked = seat.status === 'LOCKED';

    let bg = SEAT_COLORS.AVAILABLE;
    if (isSelected) bg = SEAT_COLORS.SELECTED;
    else if (isBooked) bg = SEAT_COLORS.BOOKED;
    else if (isLocked) bg = SEAT_COLORS.LOCKED;
    else if (seat.seatType === 'PREMIUM') bg = SEAT_COLORS.PREMIUM;
    else if (seat.seatType === 'RECLINER') bg = SEAT_COLORS.RECLINER;

    return {
      width: seat.seatType === 'RECLINER' ? '48px' : '36px',
      height: seat.seatType === 'RECLINER' ? '42px' : '36px',
      backgroundColor: bg,
      color: '#fff',
      border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: seat.seatType === 'RECLINER' ? '8px' : '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isAvailable ? 'pointer' : 'not-allowed',
      opacity: isBooked || isLocked ? 0.4 : 1,
      fontSize: '11px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      margin: '2px',
    };
  };

  return (
    <div className="seat-layout" id="seat-layout">
      {/* Screen indicator */}
      <div style={{
        textAlign: 'center',
        margin: '0 0 30px',
        position: 'relative',
      }}>
        <div style={{
          width: '60%',
          height: '4px',
          background: 'linear-gradient(90deg, transparent, #6c63ff, transparent)',
          margin: '0 auto 8px',
          borderRadius: '2px',
        }} />
        <span style={{ fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '3px' }}>
          Screen
        </span>
      </div>

      {/* Seat grid */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        {Object.entries(rows).sort().map(([rowLabel, rowSeats]) => (
          <div key={rowLabel} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <span style={{
              width: '24px',
              fontSize: '12px',
              color: '#a0aec0',
              fontWeight: '600',
              textAlign: 'center',
            }}>
              {rowLabel}
            </span>
            {rowSeats.map((seat) => (
              <button
                key={seat.id}
                id={`seat-${seat.seatNumber}`}
                style={getSeatStyle(seat)}
                disabled={seat.status !== 'AVAILABLE'}
                onClick={() => onSeatClick && onSeatClick(seat)}
                title={`${seat.seatNumber} — ${seat.seatType} — ₹${seat.price}`}
              >
                {seat.seatNumber?.substring(1)}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '24px',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Available', color: SEAT_COLORS.AVAILABLE },
          { label: 'Selected', color: SEAT_COLORS.SELECTED },
          { label: 'Booked', color: SEAT_COLORS.BOOKED },
          { label: 'Locked', color: SEAT_COLORS.LOCKED },
          { label: 'Premium', color: SEAT_COLORS.PREMIUM },
          { label: 'Recliner', color: SEAT_COLORS.RECLINER },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '14px', height: '14px', backgroundColor: color,
              borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)',
            }} />
            <span style={{ fontSize: '12px', color: '#a0aec0' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
