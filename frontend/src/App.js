import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import Reviews from './pages/Reviews';

export default function App(){
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/movies">Movies</Link> | <Link to="/login">Login</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/movies" element={<Movies/>} />
        <Route path="/movies/:id" element={<MovieDetails/>} />
        <Route path="/watchlist" element={<Watchlist/>} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/reviews" element={<Reviews/>} />
      </Routes>
    </div>
  )
}
