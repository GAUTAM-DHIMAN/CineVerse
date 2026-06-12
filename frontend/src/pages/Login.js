// src/pages/Login.js
// Premium login page with glassmorphism card, form validation, and mock auth

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('john@example.com');
  const [password, setPassword] = useState('Pass@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-page" id="login-page">
      <div className="auth-backdrop" />
      <div className="auth-card glass" id="login-card">
        <div className="auth-header">
          <span className="auth-icon">🎬</span>
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue to CineVerse</p>
        </div>

        {error && (
          <div className="alert alert-error" id="login-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" id="login-form">
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-full ${loading ? 'loading' : ''}`}
            disabled={loading}
            id="login-submit"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link" id="link-to-register">
              Create one
            </Link>
          </p>
        </div>

        <div className="auth-hint">
          <p><strong>Demo Credentials:</strong></p>
          <code>john@example.com / Pass@123</code>
        </div>
      </div>
    </div>
  );
}
