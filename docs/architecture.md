# CineVerse — Architecture & Technology Stack

> **Version:** 1.0 · **Last Updated:** 2026-06-11 · **Status:** Day 01 Baseline

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              React SPA  (Vite / Webpack)                 │  │
│   │   Pages · Components · Context API · React Router v6     │  │
│   └──────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────┘
                               │  HTTPS / REST
┌──────────────────────────────▼──────────────────────────────────┐
│                     API GATEWAY LAYER                           │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │            Spring Cloud Gateway (gateway/)               │  │
│   │   Rate Limiting · JWT Validation · Route Definitions     │  │
│   │   CORS · Load Balancing · Circuit Breaker (Resilience4j) │  │
│   └─────┬──────────────┬──────────────────┬──────────────────┘  │
└─────────┼──────────────┼──────────────────┼─────────────────────┘
          │              │                  │
┌─────────▼──────┐ ┌────▼───────────┐ ┌────▼───────────┐
│  Auth Service  │ │ Movie Service  │ │ Review Service │
│  (Spring Boot) │ │ (Spring Boot)  │ │ (Spring Boot)  │
│  Port: 8081    │ │ Port: 8082     │ │ Port: 8083     │
└───────┬────────┘ └──┬─────────────┘ └──┬─────────────┘
        │             │                  │
┌───────▼────────┐ ┌──▼─────────────┐ ┌──▼─────────────┐
│  PostgreSQL    │ │  PostgreSQL    │ │   MongoDB      │
│  (users,auth)  │ │  (movies,      │ │  (reviews,     │
│                │ │   bookings)    │ │   ratings)     │
└────────────────┘ └────────────────┘ └────────────────┘

       ┌──────────────────────────────────────┐
       │        SHARED INFRASTRUCTURE         │
       │                                      │
       │   Redis ──── Session & Cache Layer   │
       │   RabbitMQ ─ Async Event Bus         │
       └──────────────────────────────────────┘
```

---

## 2. Technology Stack Justification

### 2.1 Frontend — React 18 + Vite

| Decision         | Rationale                                                                 |
|------------------|---------------------------------------------------------------------------|
| **React 18**     | Component-based architecture, massive ecosystem, concurrent rendering.    |
| **Vite**         | Sub-second HMR, native ESM dev server, 10-20x faster builds vs Webpack.  |
| **React Router v6** | Nested layouts, data loaders, declarative route guards.              |
| **Axios**        | Request/response interceptors for JWT token attachment and refresh.       |
| **Context API**  | Lightweight global state for auth; avoids Redux overhead at this scale.   |

### 2.2 Backend — Spring Boot 3.x (Java 17+)

| Decision              | Rationale                                                           |
|-----------------------|---------------------------------------------------------------------|
| **Spring Boot 3.x**   | Production-proven, auto-configuration, rich ecosystem.              |
| **Spring Security**   | JWT-based stateless auth, method-level security, OAuth2 ready.      |
| **Spring Data JPA**   | Hibernate under the hood, repository pattern, type-safe queries.    |
| **Spring Data MongoDB** | First-class Mongo support, reactive driver available.            |
| **Spring Cloud Gateway** | Non-blocking gateway, filters, rate limiting, circuit breaking. |

### 2.3 Databases — PostgreSQL + MongoDB (Polyglot Persistence)

| Store          | Used By          | Justification                                                                  |
|----------------|------------------|--------------------------------------------------------------------------------|
| **PostgreSQL** | Auth, Movies     | ACID transactions for user credentials and financial bookings. Strong schema enforcement, mature indexing (B-tree, GIN for full-text search), referential integrity via foreign keys. |
| **MongoDB**    | Reviews          | Schema flexibility for varied review structures (text, ratings, spoiler tags, reactions). Horizontal scalability for high-write review ingestion. Embedded documents avoid JOINs for nested comment threads. |

### 2.4 Caching — Redis

| Use Case               | Strategy                                   |
|------------------------|--------------------------------------------|
| Session/Token blacklist | `SET token:jti EX 3600` for logout revocation |
| Movie catalog cache    | Cache-aside with 5-min TTL                  |
| Rate limiting counters | Sliding window via sorted sets              |
| Popular movies ranking | Sorted sets with real-time score updates     |

### 2.5 Messaging — RabbitMQ

| Event                        | Producer       | Consumer        | Purpose                                |
|------------------------------|----------------|-----------------|----------------------------------------|
| `review.created`             | Review Service | Movie Service   | Recalculate aggregate rating           |
| `user.registered`            | Auth Service   | Notification    | Welcome email trigger                  |
| `booking.confirmed`          | Movie Service  | Review Service  | Unlock review eligibility              |

---

## 3. Microservices Breakdown

### 3.1 Auth Service (`backend/auth-service/`)

- **Responsibility:** User registration, login, JWT issuance, token refresh, password reset.
- **Database:** PostgreSQL — `users`, `roles`, `refresh_tokens` tables.
- **Key Dependencies:** Spring Security, jjwt, BCrypt.
- **Port:** `8081`

### 3.2 Movie Service (`backend/movie-service/`)

- **Responsibility:** Movie CRUD, search/filter, showtime management, seat booking.
- **Database:** PostgreSQL — `movies`, `genres`, `showtimes`, `bookings` tables.
- **Key Dependencies:** Spring Data JPA, Spring Cache (Redis).
- **Port:** `8082`

### 3.3 Review Service (`backend/review-service/`)

- **Responsibility:** Review CRUD, ratings aggregation, moderation flags, comment threads.
- **Database:** MongoDB — `reviews` collection with embedded ratings and replies.
- **Key Dependencies:** Spring Data MongoDB, Spring AMQP (RabbitMQ).
- **Port:** `8083`

### 3.4 API Gateway (`gateway/`)

- **Responsibility:** Single entry point, route to services, JWT validation filter, CORS, rate limiting.
- **Port:** `8080`
- **Route Table:**

| Route Pattern         | Target Service |
|-----------------------|----------------|
| `/api/auth/**`        | Auth Service   |
| `/api/movies/**`      | Movie Service  |
| `/api/reviews/**`     | Review Service |

---

## 4. Authentication Flow

```
┌────────┐         ┌─────────┐         ┌──────────────┐
│ Client │──POST──▶│ Gateway │──route──▶│ Auth Service │
│        │ /login  │         │         │              │
│        │         │         │         │  Validate    │
│        │         │         │◀─JWT────│  Credentials │
│        │◀─200────│         │         │  Issue JWT   │
└────────┘  +JWT   └─────────┘         └──────────────┘

  Subsequent requests:
┌────────┐         ┌─────────┐         ┌──────────────┐
│ Client │──GET───▶│ Gateway │         │              │
│  +JWT  │ /movies │  Verify │──route──▶│ Movie Service│
│        │         │  JWT    │         │              │
│        │◀─200────│ filter  │◀─data───│              │
└────────┘         └─────────┘         └──────────────┘
```

- **Access Token:** Short-lived (15 min), signed with HS256/RS256.
- **Refresh Token:** Long-lived (7 days), stored in `refresh_tokens` table, rotated on use.
- **Token Storage (Client):** `httpOnly` cookie (preferred) or `localStorage` with XSS mitigations.

---

## 5. Project Directory Structure

```
CineVerse/
├── frontend/                    # React SPA
│   ├── public/
│   └── src/
│       ├── components/          # Reusable UI components
│       ├── pages/               # Route-level page components
│       ├── routes/              # Route config & ProtectedRoute
│       ├── services/            # API layer & mock data
│       ├── context/             # React Context providers
│       ├── utils/               # Helpers, constants, formatters
│       ├── App.jsx
│       └── index.jsx
│
├── backend/
│   ├── auth-service/            # Spring Boot — Authentication
│   │   └── src/main/java/com/cineverse/auth/
│   ├── movie-service/           # Spring Boot — Movies & Bookings
│   │   └── src/main/java/com/cineverse/movie/
│   └── review-service/          # Spring Boot — Reviews & Ratings
│       └── src/main/java/com/cineverse/review/
│
├── gateway/                     # Spring Cloud Gateway
│   └── src/main/java/com/cineverse/gateway/
│
├── docker/                      # Docker Compose & Dockerfiles
│   └── docker-compose.yml
│
└── docs/                        # Architecture & API docs
    ├── ARCHITECTURE.md
    └── API_CONTRACTS.md
```

---

## 6. Infrastructure & DevOps

| Tool               | Purpose                                    |
|--------------------|--------------------------------------------|
| **Docker Compose** | Local multi-service orchestration           |
| **Nginx**          | Production reverse proxy, static file serving |
| **GitHub Actions** | CI/CD pipeline (lint, test, build, deploy)  |
| **SonarQube**      | Code quality & security scanning           |
| **Prometheus + Grafana** | Metrics, alerting, dashboards         |

---

## 7. Non-Functional Requirements

| Attribute       | Target                                          |
|-----------------|-------------------------------------------------|
| **Latency**     | < 200ms p95 for API responses                   |
| **Availability**| 99.9% uptime SLA                                |
| **Scalability** | Horizontal scaling per service via container orchestration |
| **Security**    | OWASP Top 10 mitigations, input validation, parameterized queries |
| **Observability** | Structured logging (JSON), distributed tracing (Micrometer + Zipkin) |
