// Database initialization — SQLite via better-sqlite3
// Creates all tables and seeds initial data

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'cineverse.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initialize() {
  const conn = getDb();

  // ── Users table ──────────────────────────────────────
  conn.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'USER' CHECK(role IN ('USER','THEATRE_OWNER','ADMIN')),
      reset_token TEXT,
      reset_token_expiry TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // ── Movies table ─────────────────────────────────────
  conn.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tagline TEXT,
      overview TEXT,
      poster_url TEXT,
      backdrop_url TEXT,
      genres TEXT,
      release_date TEXT,
      runtime INTEGER,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      certification TEXT,
      director TEXT,
      cast_json TEXT,
      language TEXT DEFAULT 'English',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // ── Reviews table ────────────────────────────────────
  conn.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      movie_id TEXT NOT NULL,
      user_id INTEGER,
      username TEXT,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 10),
      title TEXT,
      content TEXT,
      contains_spoilers INTEGER DEFAULT 0,
      helpful_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (movie_id) REFERENCES movies(id)
    )
  `);

  // ── Theatres table ───────────────────────────────────
  conn.exec(`
    CREATE TABLE IF NOT EXISTS theatres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // ── Screens table ────────────────────────────────────
  conn.exec(`
    CREATE TABLE IF NOT EXISTS screens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      theatre_id INTEGER NOT NULL,
      FOREIGN KEY (theatre_id) REFERENCES theatres(id)
    )
  `);

  // ── Seats table ──────────────────────────────────────
  conn.exec(`
    CREATE TABLE IF NOT EXISTS seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seat_number TEXT NOT NULL,
      type TEXT DEFAULT 'REGULAR' CHECK(type IN ('REGULAR','PREMIUM','RECLINER')),
      price REAL NOT NULL,
      screen_id INTEGER NOT NULL,
      FOREIGN KEY (screen_id) REFERENCES screens(id)
    )
  `);

  // ── Shows table ──────────────────────────────────────
  conn.exec(`
    CREATE TABLE IF NOT EXISTS shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id TEXT NOT NULL,
      screen_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      price REAL,
      FOREIGN KEY (screen_id) REFERENCES screens(id)
    )
  `);

  // ── Show Seats table ─────────────────────────────────
  conn.exec(`
    CREATE TABLE IF NOT EXISTS show_seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      show_id INTEGER NOT NULL,
      seat_id INTEGER NOT NULL,
      seat_number TEXT,
      seat_type TEXT,
      price REAL,
      status TEXT DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE','LOCKED','BOOKED')),
      locked_at TEXT,
      locked_by TEXT,
      FOREIGN KEY (show_id) REFERENCES shows(id),
      FOREIGN KEY (seat_id) REFERENCES seats(id),
      UNIQUE(show_id, seat_id)
    )
  `);

  // ── Bookings table ───────────────────────────────────
  conn.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      show_id INTEGER NOT NULL,
      show_seat_ids TEXT,
      status TEXT DEFAULT 'INITIATED' CHECK(status IN ('INITIATED','LOCKED','CONFIRMED','CANCELLED','EXPIRED')),
      total_price REAL,
      locked_at TEXT,
      confirmed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (show_id) REFERENCES shows(id)
    )
  `);

  // ── Seed Data ────────────────────────────────────────
  seedData(conn);

  console.log('✅ Database initialized');
}

function seedData(conn) {
  // Check if already seeded
  const userCount = conn.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  // Seed demo user
  const hashedPassword = bcrypt.hashSync('Pass@123', 10);
  conn.prepare(`
    INSERT INTO users (name, username, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('John Doe', 'john_doe', 'john@example.com', hashedPassword, 'USER');

  // Seed admin user
  conn.prepare(`
    INSERT INTO users (name, username, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('Admin User', 'admin', 'admin@cineverse.com', bcrypt.hashSync('Admin@123', 10), 'ADMIN');

  // Seed movies
  const movies = [
    { id: 'mov_001', title: 'Inception', tagline: 'Your mind is the scene of the crime', overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.', posterUrl: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg', genres: ['Sci-Fi','Action','Thriller'], releaseDate: '2010-07-16', runtime: 148, rating: 8.8, reviewCount: 2340, certification: 'PG-13', director: 'Christopher Nolan', cast: [{ name: 'Leonardo DiCaprio', character: 'Dom Cobb' },{ name: 'Joseph Gordon-Levitt', character: 'Arthur' },{ name: 'Elliot Page', character: 'Ariadne' }] },
    { id: 'mov_002', title: 'The Dark Knight', tagline: 'Why so serious?', overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911BTUgMe1nNaD3.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5ez.jpg', genres: ['Action','Crime','Drama'], releaseDate: '2008-07-18', runtime: 152, rating: 9.0, reviewCount: 3100, certification: 'PG-13', director: 'Christopher Nolan', cast: [{ name: 'Christian Bale', character: 'Bruce Wayne / Batman' },{ name: 'Heath Ledger', character: 'The Joker' },{ name: 'Aaron Eckhart', character: 'Harvey Dent' }] },
    { id: 'mov_003', title: 'Interstellar', tagline: 'Mankind was born on Earth. It was never meant to die here.', overview: "Earth's future has been riddled by disasters, famines, and droughts. There is only one way to ensure mankind's survival: Interstellar travel.", posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK1DVfjko.jpg', genres: ['Sci-Fi','Adventure','Drama'], releaseDate: '2014-11-07', runtime: 169, rating: 8.7, reviewCount: 1890, certification: 'PG-13', director: 'Christopher Nolan', cast: [{ name: 'Matthew McConaughey', character: 'Cooper' },{ name: 'Anne Hathaway', character: 'Brand' },{ name: 'Jessica Chastain', character: 'Murph' }] },
    { id: 'mov_004', title: 'Parasite', tagline: 'Act like you own the place.', overview: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg', genres: ['Thriller','Comedy','Drama'], releaseDate: '2019-05-30', runtime: 132, rating: 8.5, reviewCount: 1560, certification: 'R', director: 'Bong Joon-ho', cast: [{ name: 'Song Kang-ho', character: 'Ki-taek' },{ name: 'Lee Sun-kyun', character: 'Park Dong-ik' },{ name: 'Cho Yeo-jeong', character: 'Yeon-gyo' }] },
    { id: 'mov_005', title: 'Dune: Part Two', tagline: 'Long live the fighters.', overview: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.', posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg', genres: ['Sci-Fi','Adventure'], releaseDate: '2024-03-01', runtime: 166, rating: 8.6, reviewCount: 980, certification: 'PG-13', director: 'Denis Villeneuve', cast: [{ name: 'Timothée Chalamet', character: 'Paul Atreides' },{ name: 'Zendaya', character: 'Chani' },{ name: 'Austin Butler', character: 'Feyd-Rautha' }] },
    { id: 'mov_006', title: 'Spider-Man: Across the Spider-Verse', tagline: "It's how you wear the mask that matters.", overview: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.', posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg', genres: ['Animation','Action','Adventure'], releaseDate: '2023-06-02', runtime: 140, rating: 8.7, reviewCount: 1420, certification: 'PG', director: 'Joaquim Dos Santos', cast: [{ name: 'Shameik Moore', character: 'Miles Morales' },{ name: 'Hailee Steinfeld', character: 'Gwen Stacy' },{ name: 'Oscar Isaac', character: "Miguel O'Hara" }] },
    { id: 'mov_007', title: 'Oppenheimer', tagline: 'The world forever changes.', overview: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/nb3xI8XI3w4pMVZ38VijceceOo6.jpg', genres: ['Drama','History','Thriller'], releaseDate: '2023-07-21', runtime: 180, rating: 8.4, reviewCount: 2100, certification: 'R', director: 'Christopher Nolan', cast: [{ name: 'Cillian Murphy', character: 'J. Robert Oppenheimer' },{ name: 'Emily Blunt', character: 'Kitty Oppenheimer' },{ name: 'Robert Downey Jr.', character: 'Lewis Strauss' }] },
    { id: 'mov_008', title: 'Everything Everywhere All at Once', tagline: 'The universe is so much bigger than you realize.', overview: 'A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.', posterUrl: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/feSiISwgEpVzR1v3zv2n2AU4ANJ.jpg', genres: ['Action','Adventure','Sci-Fi'], releaseDate: '2022-03-25', runtime: 139, rating: 8.0, reviewCount: 1750, certification: 'R', director: 'Daniel Kwan', cast: [{ name: 'Michelle Yeoh', character: 'Evelyn Wang' },{ name: 'Ke Huy Quan', character: 'Waymond Wang' },{ name: 'Jamie Lee Curtis', character: 'Deirdre Beaubeirdre' }] },
  ];

  const insertMovie = conn.prepare(`
    INSERT INTO movies (id, title, tagline, overview, poster_url, backdrop_url, genres, release_date, runtime, rating, review_count, certification, director, cast_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of movies) {
    insertMovie.run(m.id, m.title, m.tagline, m.overview, m.posterUrl, m.backdropUrl, JSON.stringify(m.genres), m.releaseDate, m.runtime, m.rating, m.reviewCount, m.certification, m.director, JSON.stringify(m.cast));
  }

  // Seed reviews
  const reviews = [
    { id: 'rev_001', movieId: 'mov_001', userId: 1, username: 'john_doe', rating: 9, title: 'A Masterpiece of Modern Cinema', content: 'Nolan outdoes himself with this mind-bending thriller that challenges the audience to question the nature of reality. The visual effects are groundbreaking and the story is endlessly rewatchable.', helpfulCount: 45 },
    { id: 'rev_002', movieId: 'mov_001', userId: null, username: 'cinema_fan', rating: 8, title: 'Brilliant but demands attention', content: 'Not a movie you can watch casually. You need to pay attention to every detail. The layered dream sequences are genius but can be confusing on first watch.', helpfulCount: 23 },
    { id: 'rev_003', movieId: 'mov_002', userId: null, username: 'dark_knight_rises', rating: 10, title: 'The definitive superhero film', content: "Heath Ledger's performance as the Joker is one of the greatest in cinema history. This film transcends the superhero genre entirely.", helpfulCount: 89 },
  ];

  const insertReview = conn.prepare(`
    INSERT INTO reviews (id, movie_id, user_id, username, rating, title, content, helpful_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const r of reviews) {
    insertReview.run(r.id, r.movieId, r.userId, r.username, r.rating, r.title, r.content, r.helpfulCount);
  }

  // Seed a theatre with screens and seats
  conn.prepare(`INSERT INTO theatres (name, address, city) VALUES (?, ?, ?)`).run('CineVerse IMAX', '123 Movie St', 'Mumbai');
  conn.prepare(`INSERT INTO screens (name, theatre_id) VALUES (?, ?)`).run('Screen 1 - IMAX', 1);

  // Generate seats (5 rows x 10 seats = 50 seats)
  const insertSeat = conn.prepare(`INSERT INTO seats (seat_number, type, price, screen_id) VALUES (?, ?, ?, ?)`);
  for (let r = 0; r < 5; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    for (let s = 1; s <= 10; s++) {
      const type = r < 2 ? 'REGULAR' : r < 4 ? 'PREMIUM' : 'RECLINER';
      const price = type === 'REGULAR' ? 200 : type === 'PREMIUM' ? 350 : 500;
      insertSeat.run(`${rowLabel}${s}`, type, price, 1);
    }
  }

  console.log('🌱 Seed data loaded');
}

module.exports = { getDb, initialize };
