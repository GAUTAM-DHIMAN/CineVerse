// src/components/Navbar.js
// Premium glassmorphism navigation bar with auth-aware state

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand" id="navbar-brand">
          <span className="brand-icon">🎬</span>
          <span className="brand-text">CineVerse</span>
        </Link>

        {/* Desktop Links */}
        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            id="nav-home"
            onClick={() => setMobileOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/movies"
            className={`nav-link ${isActive('/movies') ? 'active' : ''}`}
            id="nav-movies"
            onClick={() => setMobileOpen(false)}
          >
            Movies
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/watchlist"
                className={`nav-link ${isActive('/watchlist') ? 'active' : ''}`}
                id="nav-watchlist"
                onClick={() => setMobileOpen(false)}
              >
                Watchlist
              </Link>
              <Link
                to="/profile"
                className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                id="nav-profile"
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>
            </>
          )}

          {/* Auth actions (mobile) */}
          <div className="navbar-auth mobile-only">
            {isAuthenticated ? (
              <button className="btn btn-ghost" onClick={handleLogout} id="nav-logout-mobile">
                Logout
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary" id="nav-login-mobile"
                onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Auth actions (desktop) */}
        <div className="navbar-auth desktop-only">
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-greeting">Hi, {user?.fullName?.split(' ')[0] || 'User'}</span>
              <button className="btn btn-ghost" onClick={handleLogout} id="nav-logout">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost" id="nav-login">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" id="nav-register">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`hamburger ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          id="hamburger-btn"
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
