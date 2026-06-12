# CineVerse — API Contracts

> **Version:** 1.0 · **Base URL:** `http://localhost:8080/api` (via Gateway)
> **Auth:** JWT Bearer token in `Authorization` header unless marked 🔓 (public).

---

## Table of Contents

1. [Authentication API](#1-authentication-api)
2. [Movies API](#2-movies-api)
3. [Reviews API](#3-reviews-api)
4. [Common Models](#4-common-models)
5. [Error Response Format](#5-error-response-format)

---

## 1. Authentication API

**Base Path:** `/api/auth`
**Service:** Auth Service (port 8081)

---

### 1.1 Register User 🔓

`POST /api/auth/register`

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecureP@ss123",
  "fullName": "John Doe"
}
```

**Success Response — `201 Created`:**

```json
{
  "success": true,
  "data": {
    "id": "usr_a1b2c3d4",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "createdAt": "2026-06-11T08:00:00Z"
  },
  "message": "Registration successful"
}
```

**Error Response — `409 Conflict`:**

```json
{
  "success": false,
  "error": {
    "code": "USER_EXISTS",
    "message": "A user with this email already exists"
  }
}
```

---

### 1.2 Login 🔓

`POST /api/auth/login`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecureP@ss123"
}
```

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "usr_a1b2c3d4",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "USER",
      "avatar": null
    }
  }
}
```

**Error Response — `401 Unauthorized`:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### 1.3 Refresh Token 🔓

`POST /api/auth/refresh`

**Request Body:**

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "bmV3IHJlZnJlc2ggdG9r...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

---

### 1.4 Get Profile 🔒

`GET /api/auth/profile`

**Headers:** `Authorization: Bearer <accessToken>`

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "usr_a1b2c3d4",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "avatar": "https://cdn.cineverse.io/avatars/usr_a1b2c3d4.jpg",
    "createdAt": "2026-06-11T08:00:00Z",
    "reviewCount": 12,
    "watchlistCount": 5
  }
}
```

---

### 1.5 Logout 🔒

`POST /api/auth/logout`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. Movies API

**Base Path:** `/api/movies`
**Service:** Movie Service (port 8082)

---

### 2.1 List Movies 🔓

`GET /api/movies`

**Query Parameters:**

| Parameter | Type   | Default | Description                              |
|-----------|--------|---------|------------------------------------------|
| `page`    | number | 1       | Page number (1-indexed)                  |
| `limit`   | number | 20      | Items per page (max: 100)                |
| `genre`   | string | —       | Filter by genre slug (e.g., `action`)    |
| `search`  | string | —       | Full-text search on title & description  |
| `sortBy`  | string | `releaseDate` | Sort field: `title`, `rating`, `releaseDate` |
| `order`   | string | `desc`  | Sort order: `asc` or `desc`              |
| `year`    | number | —       | Filter by release year                   |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "movies": [
      {
        "id": "mov_x7y8z9",
        "title": "Inception",
        "tagline": "Your mind is the scene of the crime",
        "posterUrl": "https://cdn.cineverse.io/posters/inception.jpg",
        "backdropUrl": "https://cdn.cineverse.io/backdrops/inception.jpg",
        "genres": ["Sci-Fi", "Action", "Thriller"],
        "releaseDate": "2010-07-16",
        "runtime": 148,
        "rating": 8.8,
        "reviewCount": 2340,
        "certification": "PG-13"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "totalItems": 293,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 2.2 Get Movie by ID 🔓

`GET /api/movies/:id`

**Path Parameters:** `id` — Movie ID (e.g., `mov_x7y8z9`)

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "mov_x7y8z9",
    "title": "Inception",
    "tagline": "Your mind is the scene of the crime",
    "overview": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    "posterUrl": "https://cdn.cineverse.io/posters/inception.jpg",
    "backdropUrl": "https://cdn.cineverse.io/backdrops/inception.jpg",
    "trailerUrl": "https://youtube.com/watch?v=YoHD9XEInc0",
    "genres": ["Sci-Fi", "Action", "Thriller"],
    "releaseDate": "2010-07-16",
    "runtime": 148,
    "rating": 8.8,
    "reviewCount": 2340,
    "certification": "PG-13",
    "budget": 160000000,
    "revenue": 836800000,
    "language": "en",
    "director": "Christopher Nolan",
    "cast": [
      {
        "name": "Leonardo DiCaprio",
        "character": "Dom Cobb",
        "photoUrl": "https://cdn.cineverse.io/cast/dicaprio.jpg"
      },
      {
        "name": "Joseph Gordon-Levitt",
        "character": "Arthur",
        "photoUrl": "https://cdn.cineverse.io/cast/jgl.jpg"
      }
    ],
    "showtimes": [
      {
        "id": "st_001",
        "date": "2026-06-15",
        "time": "19:30",
        "theater": "Screen 1",
        "availableSeats": 42,
        "totalSeats": 120,
        "price": 12.99
      }
    ]
  }
}
```

**Error Response — `404 Not Found`:**

```json
{
  "success": false,
  "error": {
    "code": "MOVIE_NOT_FOUND",
    "message": "No movie found with id: mov_invalid"
  }
}
```

---

### 2.3 Book Tickets 🔒

`POST /api/movies/:id/book`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**

```json
{
  "showtimeId": "st_001",
  "seats": ["A1", "A2"],
  "paymentMethod": "card"
}
```

**Success Response — `201 Created`:**

```json
{
  "success": true,
  "data": {
    "bookingId": "bk_abc123",
    "movieTitle": "Inception",
    "showtime": "2026-06-15T19:30:00",
    "theater": "Screen 1",
    "seats": ["A1", "A2"],
    "totalAmount": 25.98,
    "status": "CONFIRMED",
    "qrCode": "https://cdn.cineverse.io/tickets/bk_abc123.png",
    "createdAt": "2026-06-11T12:00:00Z"
  },
  "message": "Booking confirmed"
}
```

---

## 3. Reviews API

**Base Path:** `/api/reviews`
**Service:** Review Service (port 8083)

---

### 3.1 Get Reviews for a Movie 🔓

`GET /api/reviews?movieId=mov_x7y8z9`

**Query Parameters:**

| Parameter | Type   | Default  | Description                    |
|-----------|--------|----------|--------------------------------|
| `movieId` | string | required | Movie ID to get reviews for    |
| `page`    | number | 1        | Page number                    |
| `limit`   | number | 10       | Items per page                 |
| `sortBy`  | string | `createdAt` | `createdAt`, `rating`, `helpful` |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "rev_m1n2o3",
        "movieId": "mov_x7y8z9",
        "user": {
          "id": "usr_a1b2c3d4",
          "username": "john_doe",
          "avatar": "https://cdn.cineverse.io/avatars/usr_a1b2c3d4.jpg"
        },
        "rating": 9,
        "title": "A Masterpiece of Modern Cinema",
        "content": "Nolan outdoes himself with this mind-bending thriller...",
        "containsSpoilers": false,
        "helpfulCount": 45,
        "createdAt": "2026-06-10T14:30:00Z",
        "updatedAt": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 234,
      "totalItems": 2340,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    },
    "aggregation": {
      "averageRating": 8.8,
      "totalReviews": 2340,
      "distribution": {
        "10": 520,
        "9": 680,
        "8": 450,
        "7": 310,
        "6": 150,
        "5": 90,
        "4": 60,
        "3": 40,
        "2": 25,
        "1": 15
      }
    }
  }
}
```

---

### 3.2 Create Review 🔒

`POST /api/reviews`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**

```json
{
  "movieId": "mov_x7y8z9",
  "rating": 9,
  "title": "A Masterpiece of Modern Cinema",
  "content": "Nolan outdoes himself with this mind-bending thriller that challenges the audience to question the nature of reality.",
  "containsSpoilers": false
}
```

**Success Response — `201 Created`:**

```json
{
  "success": true,
  "data": {
    "id": "rev_m1n2o3",
    "movieId": "mov_x7y8z9",
    "user": {
      "id": "usr_a1b2c3d4",
      "username": "john_doe"
    },
    "rating": 9,
    "title": "A Masterpiece of Modern Cinema",
    "content": "Nolan outdoes himself with this mind-bending thriller that challenges the audience to question the nature of reality.",
    "containsSpoilers": false,
    "helpfulCount": 0,
    "createdAt": "2026-06-11T12:00:00Z"
  },
  "message": "Review published successfully"
}
```

**Error Response — `409 Conflict`:**

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_REVIEW",
    "message": "You have already reviewed this movie"
  }
}
```

---

### 3.3 Update Review 🔒

`PUT /api/reviews/:id`

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**

```json
{
  "rating": 10,
  "title": "Even Better on Second Watch",
  "content": "Updated review after rewatching — the layered storytelling is even more impressive.",
  "containsSpoilers": false
}
```

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "rev_m1n2o3",
    "rating": 10,
    "title": "Even Better on Second Watch",
    "content": "Updated review after rewatching — the layered storytelling is even more impressive.",
    "updatedAt": "2026-06-11T15:00:00Z"
  },
  "message": "Review updated successfully"
}
```

---

### 3.4 Delete Review 🔒

`DELETE /api/reviews/:id`

**Headers:** `Authorization: Bearer <accessToken>`

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

### 3.5 Mark Review as Helpful 🔒

`POST /api/reviews/:id/helpful`

**Headers:** `Authorization: Bearer <accessToken>`

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "helpfulCount": 46
  }
}
```

---

## 4. Common Models

### User Object (embedded)

```json
{
  "id": "usr_a1b2c3d4",
  "username": "john_doe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "role": "USER | ADMIN | MODERATOR",
  "avatar": "string | null",
  "createdAt": "ISO-8601 datetime"
}
```

### Pagination Object

```json
{
  "currentPage": 1,
  "totalPages": 15,
  "totalItems": 293,
  "itemsPerPage": 20,
  "hasNext": true,
  "hasPrev": false
}
```

---

## 5. Error Response Format

All error responses follow a consistent envelope:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": {}
  }
}
```

### Standard Error Codes

| HTTP Status | Code                  | Description                       |
|-------------|-----------------------|-----------------------------------|
| `400`       | `VALIDATION_ERROR`    | Invalid request body or params    |
| `401`       | `UNAUTHORIZED`        | Missing or invalid JWT            |
| `403`       | `FORBIDDEN`           | Insufficient permissions          |
| `404`       | `NOT_FOUND`           | Resource does not exist           |
| `409`       | `CONFLICT`            | Duplicate resource                |
| `422`       | `UNPROCESSABLE`       | Semantic validation failure       |
| `429`       | `RATE_LIMITED`        | Too many requests                 |
| `500`       | `INTERNAL_ERROR`      | Unexpected server error           |

### Validation Error Example — `400`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "email": "Must be a valid email address",
      "password": "Must be at least 8 characters with 1 uppercase, 1 number, and 1 special character"
    }
  }
}
```
