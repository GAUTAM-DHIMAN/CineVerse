// src/components/Footer.js
// Minimal, elegant footer

import React from 'react';

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-icon">🎬</span>
          <span>CineVerse</span>
        </div>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </div>
        <p className="footer-copy">© 2026 CineVerse. All rights reserved.</p>
      </div>
    </footer>
  );
}
