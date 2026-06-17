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

  // ── Users ──────────────────────────────────────────────
  const hashedPassword = bcrypt.hashSync('Pass@123', 10);
  conn.prepare(`INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)`).run('John Doe', 'john_doe', 'john@example.com', hashedPassword, 'USER');
  conn.prepare(`INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)`).run('Admin User', 'admin', 'admin@cineverse.com', bcrypt.hashSync('Admin@123', 10), 'ADMIN');
  conn.prepare(`INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)`).run('Theatre Owner', 'theatre_owner', 'owner@cineverse.com', bcrypt.hashSync('Owner@123', 10), 'THEATRE_OWNER');

  // ── Movies (25 real movies) ────────────────────────────
  const movies = [
    { id: 'mov_001', title: 'Inception', tagline: 'Your mind is the scene of the crime', overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.', posterUrl: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg', genres: ['Sci-Fi','Action','Thriller'], releaseDate: '2010-07-16', runtime: 148, rating: 8.8, reviewCount: 2340, certification: 'PG-13', director: 'Christopher Nolan', cast: [{ name: 'Leonardo DiCaprio', character: 'Dom Cobb' },{ name: 'Joseph Gordon-Levitt', character: 'Arthur' },{ name: 'Elliot Page', character: 'Ariadne' }] },
    { id: 'mov_002', title: 'The Dark Knight', tagline: 'Why so serious?', overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911BTUgMe1nNaD3.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5ez.jpg', genres: ['Action','Crime','Drama'], releaseDate: '2008-07-18', runtime: 152, rating: 9.0, reviewCount: 3100, certification: 'PG-13', director: 'Christopher Nolan', cast: [{ name: 'Christian Bale', character: 'Bruce Wayne / Batman' },{ name: 'Heath Ledger', character: 'The Joker' },{ name: 'Aaron Eckhart', character: 'Harvey Dent' }] },
    { id: 'mov_003', title: 'Interstellar', tagline: 'Mankind was born on Earth. It was never meant to die here.', overview: "Earth's future has been riddled by disasters, famines, and droughts. There is only one way to ensure mankind's survival: Interstellar travel.", posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK1DVfjko.jpg', genres: ['Sci-Fi','Adventure','Drama'], releaseDate: '2014-11-07', runtime: 169, rating: 8.7, reviewCount: 1890, certification: 'PG-13', director: 'Christopher Nolan', cast: [{ name: 'Matthew McConaughey', character: 'Cooper' },{ name: 'Anne Hathaway', character: 'Brand' },{ name: 'Jessica Chastain', character: 'Murph' }] },
    { id: 'mov_004', title: 'Parasite', tagline: 'Act like you own the place.', overview: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg', genres: ['Thriller','Comedy','Drama'], releaseDate: '2019-05-30', runtime: 132, rating: 8.5, reviewCount: 1560, certification: 'R', director: 'Bong Joon-ho', cast: [{ name: 'Song Kang-ho', character: 'Ki-taek' },{ name: 'Lee Sun-kyun', character: 'Park Dong-ik' },{ name: 'Cho Yeo-jeong', character: 'Yeon-gyo' }] },
    { id: 'mov_005', title: 'Dune: Part Two', tagline: 'Long live the fighters.', overview: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.', posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg', genres: ['Sci-Fi','Adventure'], releaseDate: '2024-03-01', runtime: 166, rating: 8.6, reviewCount: 980, certification: 'PG-13', director: 'Denis Villeneuve', cast: [{ name: 'Timothée Chalamet', character: 'Paul Atreides' },{ name: 'Zendaya', character: 'Chani' },{ name: 'Austin Butler', character: 'Feyd-Rautha' }] },
    { id: 'mov_006', title: 'Spider-Man: Across the Spider-Verse', tagline: "It's how you wear the mask that matters.", overview: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.', posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg', genres: ['Animation','Action','Adventure'], releaseDate: '2023-06-02', runtime: 140, rating: 8.7, reviewCount: 1420, certification: 'PG', director: 'Joaquim Dos Santos', cast: [{ name: 'Shameik Moore', character: 'Miles Morales' },{ name: 'Hailee Steinfeld', character: 'Gwen Stacy' },{ name: 'Oscar Isaac', character: "Miguel O'Hara" }] },
    { id: 'mov_007', title: 'Oppenheimer', tagline: 'The world forever changes.', overview: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/nb3xI8XI3w4pMVZ38VijceceOo6.jpg', genres: ['Drama','History','Thriller'], releaseDate: '2023-07-21', runtime: 180, rating: 8.4, reviewCount: 2100, certification: 'R', director: 'Christopher Nolan', cast: [{ name: 'Cillian Murphy', character: 'J. Robert Oppenheimer' },{ name: 'Emily Blunt', character: 'Kitty Oppenheimer' },{ name: 'Robert Downey Jr.', character: 'Lewis Strauss' }] },
    { id: 'mov_008', title: 'Everything Everywhere All at Once', tagline: 'The universe is so much bigger than you realize.', overview: 'A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.', posterUrl: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/feSiISwgEpVzR1v3zv2n2AU4ANJ.jpg', genres: ['Action','Adventure','Sci-Fi'], releaseDate: '2022-03-25', runtime: 139, rating: 8.0, reviewCount: 1750, certification: 'R', director: 'Daniel Kwan', cast: [{ name: 'Michelle Yeoh', character: 'Evelyn Wang' },{ name: 'Ke Huy Quan', character: 'Waymond Wang' },{ name: 'Jamie Lee Curtis', character: 'Deirdre Beaubeirdre' }] },
    // ── NEW MOVIES ───────────────────────────────────────
    { id: 'mov_009', title: 'The Shawshank Redemption', tagline: 'Fear can hold you prisoner. Hope can set you free.', overview: 'Over the course of several years, two convicts form a friendship, seeking consolation and eventual redemption through basic compassion.', posterUrl: 'https://image.tmdb.org/t/p/w500/9cjIGRiQolukBsKGCxkbAm8kEYv.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg', genres: ['Drama','Crime'], releaseDate: '1994-09-23', runtime: 142, rating: 9.3, reviewCount: 4200, certification: 'R', director: 'Frank Darabont', cast: [{ name: 'Tim Robbins', character: 'Andy Dufresne' },{ name: 'Morgan Freeman', character: 'Red' },{ name: 'Bob Gunton', character: 'Warden Norton' }] },
    { id: 'mov_010', title: 'The Godfather', tagline: "An offer you can't refuse.", overview: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son.', posterUrl: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg', genres: ['Crime','Drama'], releaseDate: '1972-03-24', runtime: 175, rating: 9.2, reviewCount: 3800, certification: 'R', director: 'Francis Ford Coppola', cast: [{ name: 'Marlon Brando', character: 'Don Vito Corleone' },{ name: 'Al Pacino', character: 'Michael Corleone' },{ name: 'James Caan', character: 'Sonny Corleone' }] },
    { id: 'mov_011', title: 'Pulp Fiction', tagline: 'Just because you are a character doesn\'t mean you have character.', overview: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', posterUrl: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg', genres: ['Thriller','Crime','Drama'], releaseDate: '1994-10-14', runtime: 154, rating: 8.9, reviewCount: 3500, certification: 'R', director: 'Quentin Tarantino', cast: [{ name: 'John Travolta', character: 'Vincent Vega' },{ name: 'Uma Thurman', character: 'Mia Wallace' },{ name: 'Samuel L. Jackson', character: 'Jules Winnfield' }] },
    { id: 'mov_012', title: 'Fight Club', tagline: 'Mischief. Mayhem. Soap.', overview: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.', posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/hZkgoQYus5dXo3H8T7CYV25UmID.jpg', genres: ['Drama','Thriller'], releaseDate: '1999-10-15', runtime: 139, rating: 8.8, reviewCount: 2900, certification: 'R', director: 'David Fincher', cast: [{ name: 'Brad Pitt', character: 'Tyler Durden' },{ name: 'Edward Norton', character: 'The Narrator' },{ name: 'Helena Bonham Carter', character: 'Marla Singer' }] },
    { id: 'mov_013', title: 'Forrest Gump', tagline: 'Life is like a box of chocolates.', overview: 'The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.', posterUrl: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/ghgfzbEV7kbpbi1O3siOsc9jlNn.jpg', genres: ['Drama','Romance','Comedy'], releaseDate: '1994-07-06', runtime: 142, rating: 8.8, reviewCount: 3200, certification: 'PG-13', director: 'Robert Zemeckis', cast: [{ name: 'Tom Hanks', character: 'Forrest Gump' },{ name: 'Robin Wright', character: 'Jenny Curran' },{ name: 'Gary Sinise', character: 'Lt. Dan Taylor' }] },
    { id: 'mov_014', title: 'The Matrix', tagline: 'Welcome to the Real World.', overview: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth — the life he knows is the elaborate deception of an evil cyber-intelligence.', posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg', genres: ['Action','Sci-Fi'], releaseDate: '1999-03-31', runtime: 136, rating: 8.7, reviewCount: 3600, certification: 'R', director: 'The Wachowskis', cast: [{ name: 'Keanu Reeves', character: 'Neo' },{ name: 'Laurence Fishburne', character: 'Morpheus' },{ name: 'Carrie-Anne Moss', character: 'Trinity' }] },
    { id: 'mov_015', title: 'Goodfellas', tagline: 'As far back as I can remember, I always wanted to be a gangster.', overview: 'The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners Jimmy Conway and Tommy DeVito.', posterUrl: 'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJDx4OD9cU0jfe2A.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/sw7mordbZxgITU5cHR4vbGSKzAM.jpg', genres: ['Crime','Drama','Biography'], releaseDate: '1990-09-19', runtime: 146, rating: 8.7, reviewCount: 2200, certification: 'R', director: 'Martin Scorsese', cast: [{ name: 'Robert De Niro', character: 'Jimmy Conway' },{ name: 'Ray Liotta', character: 'Henry Hill' },{ name: 'Joe Pesci', character: 'Tommy DeVito' }] },
    { id: 'mov_016', title: 'Whiplash', tagline: 'The road to greatness can take you to the edge.', overview: 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student\'s potential.', posterUrl: 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedos.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/6bbZ6XyvgfjhQwbplnUh1LSj1ky.jpg', genres: ['Drama','Music'], releaseDate: '2014-10-10', runtime: 106, rating: 8.5, reviewCount: 1800, certification: 'R', director: 'Damien Chazelle', cast: [{ name: 'Miles Teller', character: 'Andrew Neiman' },{ name: 'J.K. Simmons', character: 'Terence Fletcher' },{ name: 'Melissa Benoist', character: 'Nicole' }] },
    { id: 'mov_017', title: 'The Grand Budapest Hotel', tagline: 'A perfect holiday without the perfect concierge is hardly a holiday at all.', overview: 'A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy in the hotel\'s glorious years under an exceptional concierge.', posterUrl: 'https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/nX5XotM9yprCKarRH4fzOq1VM1J.jpg', genres: ['Comedy','Drama','Adventure'], releaseDate: '2014-03-28', runtime: 99, rating: 8.1, reviewCount: 1350, certification: 'R', director: 'Wes Anderson', cast: [{ name: 'Ralph Fiennes', character: 'M. Gustave' },{ name: 'Tony Revolori', character: 'Zero Moustafa' },{ name: 'Saoirse Ronan', character: 'Agatha' }] },
    { id: 'mov_018', title: 'Mad Max: Fury Road', tagline: 'What a lovely day!', overview: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max.', posterUrl: 'https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/phszHPFVhPHhMZgo0fWTKBDQsJA.jpg', genres: ['Action','Adventure','Sci-Fi'], releaseDate: '2015-05-15', runtime: 120, rating: 8.1, reviewCount: 2400, certification: 'R', director: 'George Miller', cast: [{ name: 'Tom Hardy', character: 'Max Rockatansky' },{ name: 'Charlize Theron', character: 'Imperator Furiosa' },{ name: 'Nicholas Hoult', character: 'Nux' }] },
    { id: 'mov_019', title: 'Joker', tagline: 'Put on a happy face.', overview: 'During the 1980s, a failed stand-up comedian is driven insane and turns to a life of crime and chaos in Gotham City while becoming an infamous psychopathic criminal figure.', posterUrl: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg', genres: ['Crime','Thriller','Drama'], releaseDate: '2019-10-04', runtime: 122, rating: 8.4, reviewCount: 2600, certification: 'R', director: 'Todd Phillips', cast: [{ name: 'Joaquin Phoenix', character: 'Arthur Fleck / Joker' },{ name: 'Robert De Niro', character: 'Murray Franklin' },{ name: 'Zazie Beetz', character: 'Sophie Dumond' }] },
    { id: 'mov_020', title: 'Avengers: Endgame', tagline: 'Avenge the fallen.', overview: 'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos\' actions and restore balance.', posterUrl: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg', genres: ['Action','Adventure','Sci-Fi'], releaseDate: '2019-04-26', runtime: 181, rating: 8.4, reviewCount: 4500, certification: 'PG-13', director: 'Anthony Russo', cast: [{ name: 'Robert Downey Jr.', character: 'Tony Stark / Iron Man' },{ name: 'Chris Evans', character: 'Steve Rogers / Captain America' },{ name: 'Scarlett Johansson', character: 'Natasha Romanoff / Black Widow' }] },
    { id: 'mov_021', title: 'La La Land', tagline: 'Here\'s to the fools who dream.', overview: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.', posterUrl: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKRhcorjYRVGhQ.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/nadTlnTE6DjKPISe31VYbPPJt2t.jpg', genres: ['Comedy','Drama','Romance','Music'], releaseDate: '2016-12-09', runtime: 128, rating: 8.0, reviewCount: 2100, certification: 'PG-13', director: 'Damien Chazelle', cast: [{ name: 'Ryan Gosling', character: 'Sebastian Wilder' },{ name: 'Emma Stone', character: 'Mia Dolan' },{ name: 'John Legend', character: 'Keith' }] },
    { id: 'mov_022', title: 'The Social Network', tagline: 'You don\'t get to 500 million friends without making a few enemies.', overview: 'As Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook, he is sued by the twins who claimed he stole their idea, and by the co-founder who was later squeezed out of the business.', posterUrl: 'https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTp8eRhcootgD.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/cEiG1GFFLMdDkhAFuQSEelMOHpn.jpg', genres: ['Drama','Biography'], releaseDate: '2010-10-01', runtime: 120, rating: 7.8, reviewCount: 1600, certification: 'PG-13', director: 'David Fincher', cast: [{ name: 'Jesse Eisenberg', character: 'Mark Zuckerberg' },{ name: 'Andrew Garfield', character: 'Eduardo Saverin' },{ name: 'Justin Timberlake', character: 'Sean Parker' }] },
    { id: 'mov_023', title: 'Get Out', tagline: 'Just because you\'re invited, doesn\'t mean you\'re welcome.', overview: 'A young African-American visits his white girlfriend\'s parents for the weekend, where his simmering uneasiness about their reception of him eventually reaches a boiling point.', posterUrl: 'https://image.tmdb.org/t/p/w500/tFXcEccSQMf3zy7uCiqVpSNYbyJ.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/5bFyjFjoUGCLSNWBNkz7apZBMh6.jpg', genres: ['Horror','Thriller','Mystery'], releaseDate: '2017-02-24', runtime: 104, rating: 7.7, reviewCount: 1900, certification: 'R', director: 'Jordan Peele', cast: [{ name: 'Daniel Kaluuya', character: 'Chris Washington' },{ name: 'Allison Williams', character: 'Rose Armitage' },{ name: 'Catherine Keener', character: 'Missy Armitage' }] },
    { id: 'mov_024', title: 'John Wick: Chapter 4', tagline: 'No way back, one way out.', overview: 'John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe.', posterUrl: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7LsyLGOO2EP.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/7I6VUdPj6tQECNHdviJkn1VGVKo.jpg', genres: ['Action','Thriller','Crime'], releaseDate: '2023-03-24', runtime: 169, rating: 7.7, reviewCount: 1100, certification: 'R', director: 'Chad Stahelski', cast: [{ name: 'Keanu Reeves', character: 'John Wick' },{ name: 'Donnie Yen', character: 'Caine' },{ name: 'Bill Skarsgård', character: 'Marquis de Gramont' }] },
    { id: 'mov_025', title: 'The Batman', tagline: 'Unmask the truth.', overview: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption and question his family\'s involvement.', posterUrl: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg', backdropUrl: 'https://image.tmdb.org/t/p/original/b0PlSFdDwbyFAJlMeKf85V0Vcjz.jpg', genres: ['Crime','Mystery','Thriller'], releaseDate: '2022-03-04', runtime: 176, rating: 7.8, reviewCount: 2300, certification: 'PG-13', director: 'Matt Reeves', cast: [{ name: 'Robert Pattinson', character: 'Bruce Wayne / The Batman' },{ name: 'Zoë Kravitz', character: 'Selina Kyle / Catwoman' },{ name: 'Paul Dano', character: 'Edward Nashton / The Riddler' }] },
  ];

  const insertMovie = conn.prepare(`
    INSERT INTO movies (id, title, tagline, overview, poster_url, backdrop_url, genres, release_date, runtime, rating, review_count, certification, director, cast_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of movies) {
    insertMovie.run(m.id, m.title, m.tagline, m.overview, m.posterUrl, m.backdropUrl, JSON.stringify(m.genres), m.releaseDate, m.runtime, m.rating, m.reviewCount, m.certification, m.director, JSON.stringify(m.cast));
  }

  // ── Reviews (diverse, across many movies) ──────────────
  const reviews = [
    { id: 'rev_001', movieId: 'mov_001', userId: 1, username: 'john_doe', rating: 9, title: 'A Masterpiece of Modern Cinema', content: 'Nolan outdoes himself with this mind-bending thriller that challenges the audience to question the nature of reality. The visual effects are groundbreaking and the story is endlessly rewatchable.', helpfulCount: 45 },
    { id: 'rev_002', movieId: 'mov_001', userId: null, username: 'cinema_fan', rating: 8, title: 'Brilliant but demands attention', content: 'Not a movie you can watch casually. You need to pay attention to every detail. The layered dream sequences are genius but can be confusing on first watch.', helpfulCount: 23 },
    { id: 'rev_003', movieId: 'mov_002', userId: null, username: 'dark_knight_rises', rating: 10, title: 'The definitive superhero film', content: "Heath Ledger's performance as the Joker is one of the greatest in cinema history. This film transcends the superhero genre entirely.", helpfulCount: 89 },
    { id: 'rev_004', movieId: 'mov_003', userId: 1, username: 'john_doe', rating: 10, title: 'A love letter to science and humanity', content: 'Interstellar is not just a sci-fi movie — it is an emotional journey that explores love, sacrifice, and the resilience of the human spirit. Hans Zimmer\'s score is transcendent.', helpfulCount: 67 },
    { id: 'rev_005', movieId: 'mov_004', userId: null, username: 'film_buff_92', rating: 9, title: 'Bong Joon-ho is a genius', content: 'Parasite seamlessly blends genres — comedy, thriller, horror, and social commentary — into one perfect film. The twist is jaw-dropping.', helpfulCount: 54 },
    { id: 'rev_006', movieId: 'mov_005', userId: null, username: 'dune_walker', rating: 9, title: 'Better than Part One in every way', content: 'Villeneuve delivers an epic that rivals Lord of the Rings. The sandworm ride sequence is the most exhilarating thing I\'ve seen in a theater.', helpfulCount: 38 },
    { id: 'rev_007', movieId: 'mov_007', userId: null, username: 'history_nerd', rating: 8, title: 'Dense but rewarding', content: 'Oppenheimer demands your full attention for three hours. Cillian Murphy\'s performance is career-defining. The Trinity test sequence is pure cinema.', helpfulCount: 41 },
    { id: 'rev_008', movieId: 'mov_009', userId: null, username: 'classic_cinema', rating: 10, title: 'The greatest film ever made', content: 'Shawshank is proof that great storytelling never ages. Tim Robbins and Morgan Freeman have incredible chemistry. The ending is perfect.', helpfulCount: 102 },
    { id: 'rev_009', movieId: 'mov_010', userId: null, username: 'mob_movies_fan', rating: 10, title: 'The gold standard of gangster films', content: 'Brando and Pacino deliver performances that have defined cinema for over fifty years. Every scene is meticulously crafted.', helpfulCount: 78 },
    { id: 'rev_010', movieId: 'mov_011', userId: null, username: 'tarantino_fan', rating: 9, title: 'Dialogue that sings', content: 'Tarantino redefined cinema with Pulp Fiction. The non-linear storytelling, the sharp dialogue, and the eclectic soundtrack make this endlessly rewatchable.', helpfulCount: 56 },
    { id: 'rev_011', movieId: 'mov_012', userId: 1, username: 'john_doe', rating: 8, title: 'You do not talk about Fight Club', content: 'Fincher and Pitt at their absolute best. The twist still holds up even when you know it\'s coming. A scathing commentary on consumerism.', helpfulCount: 44 },
    { id: 'rev_012', movieId: 'mov_014', userId: null, username: 'neo_follower', rating: 9, title: 'Revolutionized action cinema', content: 'The Matrix changed everything. The bullet-time effect, the philosophical undertones, and Keanu Reeves\' iconic performance make this a must-watch.', helpfulCount: 63 },
    { id: 'rev_013', movieId: 'mov_016', userId: null, username: 'jazz_drummer', rating: 10, title: 'Absolutely terrifying and brilliant', content: 'J.K. Simmons is genuinely terrifying as Fletcher. The final drumming sequence is the most intense thing I\'ve ever seen. A masterpiece about the cost of perfection.', helpfulCount: 71 },
    { id: 'rev_014', movieId: 'mov_019', userId: null, username: 'gotham_citizen', rating: 9, title: 'Joaquin Phoenix IS the Joker', content: 'A haunting character study that stays with you long after the credits roll. Phoenix deserved every award he got. Dark, unsettling, and brilliant.', helpfulCount: 52 },
    { id: 'rev_015', movieId: 'mov_020', userId: null, username: 'marvel_universe', rating: 9, title: 'The perfect finale', content: 'Endgame delivers on over a decade of storytelling. "I am Iron Man" is the most emotional moment in superhero cinema. I cried three separate times.', helpfulCount: 95 },
    { id: 'rev_016', movieId: 'mov_021', userId: null, username: 'musical_lover', rating: 8, title: 'A beautiful ode to dreamers', content: 'La La Land is visually stunning with incredible musical numbers. The bittersweet ending is what elevates it from great to unforgettable.', helpfulCount: 37 },
    { id: 'rev_017', movieId: 'mov_018', userId: null, username: 'action_junkie', rating: 9, title: 'Pure adrenaline from start to finish', content: 'Fury Road is a two-hour car chase that never gets boring. Charlize Theron steals the show. The practical effects are insane.', helpfulCount: 48 },
    { id: 'rev_018', movieId: 'mov_024', userId: null, username: 'wick_fan', rating: 8, title: 'The staircase fight alone is worth it', content: 'John Wick 4 raises the bar for action cinema. The Paris sequences are breathtaking. Donnie Yen is a phenomenal addition to the franchise.', helpfulCount: 33 },
    { id: 'rev_019', movieId: 'mov_025', userId: null, username: 'bat_signal', rating: 8, title: 'A grounded and gritty Batman', content: 'Pattinson brings a raw intensity to Batman. The detective noir approach is refreshing. The Batmobile chase is absolutely epic.', helpfulCount: 29 },
    { id: 'rev_020', movieId: 'mov_013', userId: null, username: 'classic_cinema', rating: 9, title: 'Tom Hanks at his finest', content: 'Forrest Gump is the kind of movie that makes you laugh, cry, and think. Hanks disappears into the role completely. "Life is like a box of chocolates" is eternal.', helpfulCount: 61 },
  ];

  const insertReview = conn.prepare(`
    INSERT INTO reviews (id, movie_id, user_id, username, rating, title, content, helpful_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const r of reviews) {
    insertReview.run(r.id, r.movieId, r.userId, r.username, r.rating, r.title, r.content, r.helpfulCount);
  }

  // ── Theatres ──────────────────────────────────────────
  const theatres = [
    { name: 'CineVerse IMAX', address: '123 Movie Boulevard, Andheri West', city: 'Mumbai' },
    { name: 'CineVerse Multiplex', address: '456 Cinema Road, Connaught Place', city: 'Delhi' },
    { name: 'CineVerse Premium', address: '789 Film Street, Koramangala', city: 'Bangalore' },
  ];

  const insertTheatre = conn.prepare(`INSERT INTO theatres (name, address, city) VALUES (?, ?, ?)`);
  for (const t of theatres) {
    insertTheatre.run(t.name, t.address, t.city);
  }

  // ── Screens ───────────────────────────────────────────
  const screensData = [
    { name: 'Screen 1 - IMAX', theatreId: 1 },
    { name: 'Screen 2 - Dolby Atmos', theatreId: 1 },
    { name: 'Screen 3 - 4DX', theatreId: 1 },
    { name: 'Screen 1 - IMAX', theatreId: 2 },
    { name: 'Screen 2 - Standard', theatreId: 2 },
    { name: 'Screen 1 - Premium', theatreId: 3 },
    { name: 'Screen 2 - Dolby Atmos', theatreId: 3 },
  ];

  const insertScreen = conn.prepare(`INSERT INTO screens (name, theatre_id) VALUES (?, ?)`);
  for (const s of screensData) {
    insertScreen.run(s.name, s.theatreId);
  }

  // ── Seats for each screen ─────────────────────────────
  const insertSeat = conn.prepare(`INSERT INTO seats (seat_number, type, price, screen_id) VALUES (?, ?, ?, ?)`);
  const screenCount = screensData.length;
  for (let scr = 1; scr <= screenCount; scr++) {
    const rowCount = scr <= 3 ? 6 : 5; // IMAX theatres get 6 rows
    const colCount = 10;
    for (let r = 0; r < rowCount; r++) {
      const rowLabel = String.fromCharCode(65 + r);
      for (let s = 1; s <= colCount; s++) {
        const type = r < 2 ? 'REGULAR' : r < 4 ? 'PREMIUM' : 'RECLINER';
        const price = type === 'REGULAR' ? 200 : type === 'PREMIUM' ? 350 : 500;
        insertSeat.run(`${rowLabel}${s}`, type, price, scr);
      }
    }
  }

  // ── Shows (upcoming dates, multiple movies per theatre) ─
  const insertShow = conn.prepare(`INSERT INTO shows (movie_id, screen_id, start_time, end_time, price) VALUES (?, ?, ?, ?, ?)`);

  // Generate shows for the next 7 days
  const now = new Date();
  const showTimes = ['09:00','12:30','16:00','19:30','22:30'];
  const movieIds = movies.map(m => m.id);
  const runtimes = {};
  movies.forEach(m => { runtimes[m.id] = m.runtime; });

  let movieIdx = 0;
  for (let day = 0; day < 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    for (let scr = 1; scr <= screenCount; scr++) {
      // Pick 3-4 show times per screen per day
      const timesForScreen = showTimes.slice(0, scr <= 3 ? 4 : 3);
      for (const time of timesForScreen) {
        const mid = movieIds[movieIdx % movieIds.length];
        const runtime = runtimes[mid] || 120;
        const startDt = `${dateStr}T${time}:00`;
        // Calculate end time
        const startDate = new Date(`${dateStr}T${time}:00`);
        startDate.setMinutes(startDate.getMinutes() + runtime);
        const endH = String(startDate.getHours()).padStart(2, '0');
        const endM = String(startDate.getMinutes()).padStart(2, '0');
        const endDt = `${dateStr}T${endH}:${endM}:00`;
        const price = scr <= 3 ? 300 : 250;

        insertShow.run(mid, scr, startDt, endDt, price);
        movieIdx++;
      }
    }
  }

  // ── Generate show_seats for all shows ─────────────────
  const allShows = conn.prepare('SELECT id, screen_id FROM shows').all();
  const insertShowSeat = conn.prepare(`INSERT INTO show_seats (show_id, seat_id, seat_number, seat_type, price, status) VALUES (?, ?, ?, ?, ?, 'AVAILABLE')`);

  for (const show of allShows) {
    const seats = conn.prepare('SELECT * FROM seats WHERE screen_id = ?').all(show.screen_id);
    for (const seat of seats) {
      insertShowSeat.run(show.id, seat.id, seat.seat_number, seat.type, seat.price);
    }
  }

  console.log('🌱 Seed data loaded — 25 movies, 20 reviews, 3 theatres, 7 screens, shows for 7 days');
}

module.exports = { getDb, initialize };
