// Seat Lock Scheduler — expires locked seats/bookings past 5-minute TTL
// Runs every 30 seconds using setInterval

const { getDb } = require('../db/database');

const LOCK_TTL_MINUTES = 5;

function startSeatLockScheduler() {
  setInterval(() => {
    try {
      const db = getDb();
      const cutoff = new Date(Date.now() - LOCK_TTL_MINUTES * 60000).toISOString();

      // Expire locked seats
      const expiredSeats = db.prepare(
        "UPDATE show_seats SET status = 'AVAILABLE', locked_at = NULL, locked_by = NULL WHERE status = 'LOCKED' AND locked_at < ?"
      ).run(cutoff);

      // Expire locked bookings
      const expiredBookings = db.prepare(
        "UPDATE bookings SET status = 'EXPIRED' WHERE status = 'LOCKED' AND locked_at < ?"
      ).run(cutoff);

      if (expiredSeats.changes > 0 || expiredBookings.changes > 0) {
        console.log(`🔓 Expired ${expiredSeats.changes} seats and ${expiredBookings.changes} bookings past TTL`);
      }
    } catch (err) {
      console.error('Scheduler error:', err.message);
    }
  }, 30000); // every 30 seconds

  console.log('⏱️  Seat lock scheduler started (30s interval)');
}

module.exports = { startSeatLockScheduler };
