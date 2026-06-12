// src/pages/Register.js
// Registration page with form validation

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const result = await register(form);

    if (result.success) {
      navigate('/login', { state: { registered: true } });
    } else {
      setError(result.error.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page" id="register-page">
      <div className="auth-backdrop" />
      <div className="auth-card glass" id="register-card">
        <div className="auth-header">
          <span className="auth-icon">🎬</span>
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join the CineVerse community</p>
        </div>

        {error && (
          <div className="alert alert-error" id="register-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" id="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-fullname">Full Name</label>
              <input
                id="reg-fullname"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-username">Username</label>
              <input
                id="reg-username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="john_doe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-full ${loading ? 'loading' : ''}`}
            disabled={loading}
            id="register-submit"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link" id="link-to-login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
