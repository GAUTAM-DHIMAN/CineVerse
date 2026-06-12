// src/utils/helpers.js
// Shared utility functions

/**
 * Format a runtime in minutes to "Xh Ym" string.
 */
export function formatRuntime(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/**
 * Format an ISO date string to a locale-friendly display.
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a number with commas (e.g., 2340 → "2,340").
 */
export function formatNumber(n) {
  if (n == null) return '0';
  return n.toLocaleString('en-US');
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(text, maxLen = 120) {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}

/**
 * Get a star rating display (e.g., 8.5 → "★★★★☆").
 */
export function getStarRating(rating, outOf = 10) {
  const stars = Math.round((rating / outOf) * 5);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

/**
 * Generate a random placeholder color for avatars.
 */
export function getAvatarColor(username) {
  const colors = [
    '#6C5CE7', '#00B894', '#FD79A8', '#0984E3',
    '#E17055', '#00CEC9', '#A29BFE', '#FDCB6E',
  ];
  let hash = 0;
  for (const ch of username) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
