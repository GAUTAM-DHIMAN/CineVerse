-- PostgreSQL initialization script for CineVerse
-- Creates the booking database if it doesn't exist

-- The default 'cineverse' database is created by POSTGRES_DB env var.
-- We need a separate database for the booking service.
SELECT 'CREATE DATABASE cineverse_bookings OWNER cineverse'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cineverse_bookings')\gexec
