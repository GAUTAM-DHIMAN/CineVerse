# 🎬 CineVerse — Movie Discovery & Booking Platform

> Full-stack microservices application for movie discovery, reviews, theatre management, and seat booking with real-time availability.

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────────────────────────────────────────────┐
│              │     │              API Gateway (:8080)                      │
│   React.js   │────▶│  Spring Cloud Gateway + JWT Validation Filter        │
│   Frontend   │     │                                                      │
│   (:3000)    │     └──────┬──────────┬──────────┬──────────┬─────────────┘
└──────────────┘            │          │          │          │
                    ┌───────▼──┐ ┌─────▼────┐ ┌──▼──────┐ ┌▼──────────┐
                    │   Auth   │ │  Movie   │ │ Review  │ │  Booking  │
                    │ Service  │ │ Service  │ │ Service │ │  Service  │
                    │ (:8081)  │ │ (:8082)  │ │ (:8083) │ │  (:8084)  │
                    └────┬─────┘ └────┬─────┘ └──┬──────┘ └┬────┬────┘
                         │            │           │         │    │
                    ┌────▼────┐  ┌────▼────┐      │    ┌───▼┐ ┌─▼──────┐
                    │PostgreSQL│  │ MongoDB │      │    │Redis│ │RabbitMQ│
                    │  (:5432) │  │ (:27017)│      │    │:6379│ │ :5672  │
                    └─────────┘  └─────────┘      │    └────┘ └────────┘
                                                  │
                                             ┌────▼────┐
                                             │ MongoDB │
                                             │ (shared)│
                                             └─────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js 18, React Router 6, Axios, Webpack |
| **API Gateway** | Spring Cloud Gateway (WebFlux) |
| **Auth Service** | Spring Boot 3, Spring Security, JWT (JJWT), BCrypt |
| **Movie Service** | Spring Boot 3, Spring Data MongoDB |
| **Booking Service** | Spring Boot 3, Spring Data JPA, PostgreSQL |
| **Review Service** | Spring Boot 3, Spring Data MongoDB, RabbitMQ |
| **Caching & Locking** | Redis (distributed seat locking with TTL) |
| **Messaging** | RabbitMQ (event-driven booking notifications) |
| **Databases** | PostgreSQL 14 (auth, booking), MongoDB 6 (movies, reviews) |
| **Containerization** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |

## ✨ Features

### Authentication & Authorization
- JWT-based stateless authentication
- Role-Based Access Control (RBAC): `USER`, `THEATRE_OWNER`, `ADMIN`
- Password hashing with BCrypt
- Forgot/Reset password flow

### Movie Catalog
- Full CRUD with MongoDB
- Search by title, genre, and rating with pagination
- Embedded reviews with automatic rating aggregation
- Poster upload support

### Booking System
- **Booking FSM**: `INITIATED → LOCKED → CONFIRMED / CANCELLED / EXPIRED`
- **Redis distributed seat locking** with 5-minute TTL (SET NX EX)
- **Optimistic locking** via `@Version` for database-level concurrency control
- Interactive 2D seat grid (REGULAR / PREMIUM / RECLINER)
- Payment simulation step

### Event-Driven Architecture
- RabbitMQ booking event publishing
- Dead Letter Queue for failed messages
- Retry mechanism with exponential backoff
- Idempotency checks for event consumers

### Infrastructure
- Docker Compose with health checks
- CI pipeline (GitHub Actions) — build & test all services
- CD pipeline — Docker image build & push to GHCR

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Java 17+ (for local development)
- Node.js 18+ (for frontend)
- Maven 3.9+

### 1. Clone & Start with Docker

```bash
git clone https://github.com/your-repo/CineVerse.git
cd CineVerse/docker
docker-compose up --build
```

This starts all services:
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Auth Service | http://localhost:8081 |
| Movie Service | http://localhost:8082 |
| Review Service | http://localhost:8083 |
| Booking Service | http://localhost:8084 |
| RabbitMQ Management | http://localhost:15672 |

### 2. Local Development (without Docker)

```bash
# Start infrastructure
docker-compose -f docker/docker-compose.yml up postgres mongo redis rabbitmq

# Start services (in separate terminals)
cd backend/auth-service    && ./mvnw spring-boot:run
cd backend/movie-service   && ./mvnw spring-boot:run
cd backend/booking-service && ./mvnw spring-boot:run
cd backend/review-service  && ./mvnw spring-boot:run
cd gateway                 && ./mvnw spring-boot:run

# Start frontend
cd frontend && npm install && npm start
```

---

## 📡 API Endpoints

### Auth Service (`/api/auth/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login (returns JWT) | Public |
| GET | `/profile` | Get user profile | JWT |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password` | Reset password | Public |

### Movie Service (`/api/movies/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | List all movies (paginated) | Public |
| GET | `/{id}` | Get movie details | Public |
| POST | `/` | Create movie | Admin |
| PUT | `/{id}` | Update movie | Admin |
| DELETE | `/{id}` | Delete movie | Admin |
| GET | `/search` | Search movies | Public |
| POST | `/{id}/reviews` | Add review | JWT |
| GET | `/{id}/reviews` | Get reviews | Public |

### Booking Service (`/api/booking/`, `/api/theatres/`, `/api/shows/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/booking` | Initiate booking | JWT |
| POST | `/booking/{id}/confirm` | Confirm booking | JWT |
| POST | `/booking/{id}/cancel` | Cancel booking | JWT |
| GET | `/booking/my` | My bookings | JWT |
| GET | `/theatres` | List theatres | Public |
| POST | `/theatres` | Create theatre | Owner/Admin |
| GET | `/shows/movie/{movieId}` | Shows for movie | Public |
| GET | `/seats/show/{showId}` | Seats for show | Public |

---

## 🧪 Testing

```bash
# Run all backend tests
cd backend/auth-service    && ./mvnw test
cd backend/movie-service   && ./mvnw test
cd backend/booking-service && ./mvnw test
cd backend/review-service  && ./mvnw test
```

---

## 📁 Project Structure

```
CineVerse/
├── frontend/               # React.js SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── context/        # React Context (Auth)
│   │   └── routes/         # Protected routing
│   └── Dockerfile
├── backend/
│   ├── auth-service/       # Spring Boot — Authentication & RBAC
│   ├── movie-service/      # Spring Boot — Movie CRUD (MongoDB)
│   ├── booking-service/    # Spring Boot — Booking + Redis + RabbitMQ
│   └── review-service/     # Spring Boot — Reviews + RabbitMQ consumer
├── gateway/                # Spring Cloud Gateway
├── docker/
│   ├── docker-compose.yml  # Full stack orchestration
│   └── init-db.sql         # PostgreSQL initialization
├── .github/workflows/
│   ├── ci.yml              # CI pipeline
│   └── cd.yml              # CD pipeline
└── docs/                   # Architecture & API docs
```

---

## 📄 License

This project is for educational purposes.
