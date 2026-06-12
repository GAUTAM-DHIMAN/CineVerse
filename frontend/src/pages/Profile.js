// src/pages/Profile.js
// User profile page (protected)

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDate, getAvatarColor } from '../utils/helpers';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="profile-page" id="profile-page">
      <div className="profile-card glass">
        <div
          className="profile-avatar-large"
          style={{ backgroundColor: getAvatarColor(user.username || 'User') }}
        >
          {(user.fullName || 'U')[0].toUpperCase()}
        </div>

        <h1 className="profile-name">{user.fullName}</h1>
        <p className="profile-username">@{user.username}</p>

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="stat-number">{user.reviewCount || 0}</span>
            <span className="stat-label">Reviews</span>
          </div>
          <div className="profile-stat">
            <span className="stat-number">{user.watchlistCount || 0}</span>
            <span className="stat-label">Watchlist</span>
          </div>
          <div className="profile-stat">
            <span className="stat-number">
              {user.role === 'ADMIN' ? '👑' : '🎬'}
            </span>
            <span className="stat-label">{user.role}</span>
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-field">
            <span className="field-label">Email</span>
            <span className="field-value">{user.email}</span>
          </div>
          <div className="profile-field">
            <span className="field-label">Member Since</span>
            <span className="field-value">{formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
