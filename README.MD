# Twitter Clone — Full Stack Challenge

A functional Twitter/X clone built with **NestJS** (backend) and **Next.js** (frontend), featuring authentication, tweets, social interactions, user search, likes, follow relationships, responsive design, comprehensive testing, and Dockerized deployment.

> This project was developed as part of the **Managed Software Teams Technical Challenge**, emphasizing not only functionality, but also software engineering practices, testing strategy, architectural decisions, and effective use of AI-assisted development tools.

---

## Table of Contents

* [Project Overview](#project-overview)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Architecture Overview](#architecture-overview)
* [Prerequisites](#prerequisites)
* [Runbook (Setup & Operation)](#runbook-setup--operation)
* [Quick Start with Docker](#quick-start-with-docker)
* [Manual Setup](#manual-setup)
* [Environment Variables](#environment-variables)
* [Seed Data](#seed-data)
* [Example Credentials](#example-credentials)
* [Testing Strategy](#testing-strategy)
* [Running Tests](#running-tests)
* [API Reference](#api-reference)
* [Technical Decisions](#technical-decisions)
* [Trade-offs & Known Limitations](#trade-offs--known-limitations)
* [Docker Troubleshooting](#docker-troubleshooting)
* [AI Tooling](#ai-tooling)

---

# Project Overview

This application reproduces the core functionality of Twitter/X using a modern full-stack architecture.

The challenge focused on delivering production-quality software under time constraints while demonstrating:

* Clean architecture and maintainable code.
* Progressive Git history.
* Strong testing practices.
* Effective use of AI-assisted development.
* Pragmatic engineering decisions.

---

# Features

## Authentication

* User registration using email and password.
* Login and logout functionality.
* JWT-based authentication.
* Protected routes requiring valid sessions.
* Basic user profiles.
* Unique usernames.
* User biographies.
* Avatar placeholder support.

---

## Tweets

* Create tweets.
* Maximum tweet length of 280 characters.
* Delete own tweets.
* Personalized timeline.
* Cursor-based pagination.
* Mobile-friendly timeline experience.

---

## Social Features

* Follow users.
* Unfollow users.
* Like tweets.
* Unlike tweets.
* Real-time like counters (persisted).
* Followers listing.
* Following listing.
* Follow status visibility.

---

## Search

* Search users by:

  * username
  * display name

---

## Responsive Design

Mobile-first implementation supporting:

| Device  | Width      |
| ------- | ---------- |
| Mobile  | < 640px    |
| Tablet  | 640–1024px |
| Desktop | > 1024px   |

---

# Tech Stack

| Layer            | Technology               | Reason                                             |
| ---------------- | ------------------------ | -------------------------------------------------- |
| Backend          | NestJS 11                | Modular architecture and strong TypeScript support |
| ORM              | TypeORM                  | Mature ORM integrated with NestJS                  |
| Database         | PostgreSQL 14.3          | Relational integrity and transactional consistency |
| Frontend         | Next.js 16.2.7           | Modern App Router architecture                     |
| Styling          | TailwindCSS              | Rapid mobile-first UI development                  |
| State Management | TanStack Query           | Efficient server-state synchronization             |
| Authentication   | Passport + JWT           | Native NestJS integration                          |
| Backend Testing  | Jest + Supertest         | Standard NestJS testing ecosystem                  |
| Frontend Testing | Vitest + Testing Library | Fast component and integration testing             |
| Package Manager  | pnpm 10.24.0             | Efficient dependency management                    |
| Runtime          | Node.js 24.11            | Modern LTS runtime                                 |
| Containerization | Docker + Docker Compose  | Reproducible environments                          |

---

# Architecture Overview

```text
twitter-clone/
├── backend/
│   ├── auth/
│   ├── users/
│   ├── tweets/
│   ├── follows/
│   ├── likes/
│   ├── seed/
│   └── tests/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── contexts/
│   ├── lib/
│   └── tests/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# Prerequisites

| Tool           | Version |
| -------------- | ------- |
| Node.js        | 24.11   |
| pnpm           | 10.24.0 |
| Docker         | 25+     |
| Docker Compose | v2+     |

---

# Runbook (Setup & Operation)

This section contains the exact steps required to run the application.

No manual intervention should be required beyond these instructions.

---

# Quick Start with Docker

## 1. Clone repository

```bash
git clone https://github.com/YOUR_USERNAME/flock-twitter-clone.git

cd flock-twitter-clone
```

## 2. Copy environment variables

```bash
cp .env.example .env
```

## 3. Build containers

```bash
docker-compose build --no-cache
```

## 4. Start services

```bash
docker-compose up
```

Services:

| Service  | URL                                            |
| -------- | ---------------------------------------------- |
| Frontend | [http://localhost:3001](http://localhost:3001) |
| Backend  | [http://localhost:3000](http://localhost:3000) |

---

## 5. Run seed

Open a new terminal:

```bash
docker compose exec backend pnpm seed
```

---

# Manual Setup

## Backend

```bash
cd backend

pnpm install

pnpm start:dev
```

---

## Frontend

```bash
cd frontend

pnpm install

pnpm dev
```

---

# Environment Variables

Example `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=twitter_clone

JWT_SECRET=change_me
JWT_EXPIRES_IN=7d

NEXT_PUBLIC_API_URL=http://localhost:3000

BACKEND_PORT=3000
FRONTEND_PORT=3001
```

---

# Seed Data

The project includes realistic seed data containing:

* 10 users.
* Multiple tweets.
* Cross follows.
* Distributed likes.
* Timelines populated immediately after setup.

Execute:

```bash
docker compose exec backend pnpm seed
```

or

```bash
cd backend

pnpm seed
```

---

# Example Credentials

Use the following account immediately after running the seed:

```text
Email: john.doe@example.com
Password: Password1
```

---

# Testing Strategy

Testing was implemented throughout development rather than added at the end.

Backend coverage exceeds the minimum challenge requirements.

## Backend

Implemented across all modules:

### Unit Tests

Coverage includes:

* Services.
* Validation rules.
* Business logic.
* Edge cases.
* Authorization scenarios.

### Integration Tests

Coverage includes:

* Authentication endpoints.
* Tweets.
* Likes.
* Follows.
* Users.
* Timeline generation.

### Authentication Flow

Validated end-to-end.

---

## Frontend

Integration tests include:

* Login flow.
* Registration flow.
* Tweet creation.
* Follow interactions.
* Components.
* Hooks.
* Like functionality.

---

## Coverage

Backend coverage exceeds:

```text
80%
```

as required by the challenge.

---

# Running Tests

## Backend

```bash
docker compose exec backend pnpm test
```

---

## Frontend

```bash
docker compose exec frontend pnpm test
```

---

# API Reference

## Authentication

| Method | Endpoint           |
| ------ | ------------------ |
| POST   | /api/auth/register |
| POST   | /api/auth/login    |
| GET    | /api/auth/me       |

---

## Users

| Method | Endpoint                       |
| ------ | ------------------------------ |
| GET    | /api/users/search              |
| GET    | /api/users/:username           |
| PATCH  | /api/users/me                  |
| GET    | /api/users/:username/followers |
| GET    | /api/users/:username/following |

---

## Tweets

| Method | Endpoint             |
| ------ | -------------------- |
| POST   | /api/tweets          |
| DELETE | /api/tweets/:id      |
| GET    | /api/tweets/timeline |

---

## Social

| Method | Endpoint                    |
| ------ | --------------------------- |
| POST   | /api/users/:username/follow |
| DELETE | /api/users/:username/follow |
| POST   | /api/tweets/:id/like        |
| DELETE | /api/tweets/:id/like        |

---

# Technical Decisions

## Timeline Modeling

Timeline generation follows a **fan-out on read** strategy.

Tweets are retrieved by joining follows with tweets and including the authenticated user's own tweets.

Advantages:

* Simpler consistency.
* Easier implementation.
* Lower write amplification.

Trade-off:

* More expensive reads at large scale.

---

## Cursor Pagination

Cursor-based pagination was chosen instead of offsets.

Benefits:

* Prevents pagination drift.
* Handles concurrent inserts safely.
* Better performance.

---

## Follow Graph Modeling

The follows table is self-referential:

```text
follows
├── follower_id
├── following_id
└── created_at
```

Constraints:

* UNIQUE(follower_id, following_id)
* Indexed relationships.
* Cascade deletes.

---

## Authentication

Authentication uses:

* Local Strategy.
* JWT Strategy.

JWT protects API endpoints while frontend middleware handles route protection.

---

## Likes Counter

Tweet like counts are denormalized.

Benefits:

* Fast timeline rendering.
* Avoids repeated COUNT(*) queries.

Consistency is maintained through database transactions and uniqueness constraints.

---

# Trade-offs & Known Limitations

| Area        | Decision               | Trade-off                             |
| ----------- | ---------------------- | ------------------------------------- |
| Timeline    | Fan-out on read        | More expensive reads                  |
| Search      | SQL LIKE matching      | Not optimized for massive datasets    |
| Avatars     | Placeholder/URL only   | No file uploads                       |
| JWT Storage | Local storage + cookie | HttpOnly cookies would be more secure |
| Real-time   | Not implemented        | Requires refresh                      |

---

# Docker Troubleshooting

## Remove containers and volumes

```bash
docker-compose down -v
```

---

## Remove Docker build cache

```bash
docker builder prune -af
```

---

## Rebuild everything

```bash
docker-compose build --no-cache

docker-compose up
```

---

# AI Tooling

This project intentionally embraced AI-assisted development as encouraged by the challenge.

## Tools Used

* Claude
* ChatGPT
* GitHub Copilot

---

## How AI Was Used

### Architecture

AI assisted in:

* Database modeling.
* Module decomposition.
* Timeline strategy discussions.
* Cursor pagination design.

---

### Testing

AI accelerated:

* Unit test generation.
* Integration scenarios.
* Edge case identification.

All generated tests were manually reviewed and validated.

---

### Debugging

AI helped diagnose:

* TypeORM query issues.
* Pagination behavior.
* Docker configuration problems.
* Test isolation concerns.

---

### Documentation

AI assisted in producing:

* Runbook instructions.
* Technical explanations.
* README refinement.

---

## Manual Validation

Despite extensive AI usage, all critical functionality was manually verified:

* Authentication flows.
* Docker setup.
* Seed execution.
* Timeline behavior.
* Likes and follows.
* Frontend interactions.
* Test assertions.

---

# Final Notes

This project prioritizes pragmatic engineering over unnecessary complexity.

The objective was not to build Twitter at internet scale, but to demonstrate the ability to:

* Deliver functional software quickly.
* Make sound architectural decisions.
* Maintain code quality.
* Test effectively.
* Collaborate productively with modern AI development tools.

Thank you for reviewing this submission.
