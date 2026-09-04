# Workout Log

A web app for logging workouts. Create an account, record your sessions, and track sets, reps, weight and cardio over time.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

**Live app:** https://workoutlog-frontend-one.vercel.app

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

## Features

- **Accounts** — register and log in; passwords hashed with bcrypt.
- **Sessions** — create, rename, re-date, duplicate and delete workouts.
- **Exercises** — strength entries track sets, reps and weight; cardio entries track duration and intensity (1–10).
- **Autocomplete** — the exercise name field suggests names you have used before, ordered by frequency.
- **Duplicate a session** — repeat a previous workout onto today's date in one click.
- **Statistics** — sessions per week, most-trained exercises, weight progression and training volume, rendered with Recharts.
- **Automatic logout** — the session ends after 30 minutes of inactivity, matching the JWT's lifetime.

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2 |
| Database | PostgreSQL |
| Frontend | React 19, TypeScript, Vite, React Router, Recharts |
| HTTP client | axios (with credentials) |
| Auth | JWT in an HTTP-only cookie |
| Hosting | Vercel (two projects) |

## Architecture

Two independently deployed applications that share nothing but the HTTP contract.

```
┌──────────────────┐   axios, withCredentials   ┌──────────────────┐   SQLAlchemy   ┌────────────┐
│  React frontend  │ ─────────────────────────▶ │  FastAPI backend │ ─────────────▶ │ PostgreSQL │
│   (Vercel #1)    │ ◀───────────────────────── │   (Vercel #2)    │ ◀───────────── │            │
└──────────────────┘   JSON + Set-Cookie        └──────────────────┘                └────────────┘
```

**Authentication.** Login signs a JWT and returns it as an HTTP-only cookie, so JavaScript can never read the token. The browser attaches it to every subsequent request because axios is configured with `withCredentials: true`. Because the two Vercel projects live on different domains, the cookie is issued with `SameSite=None; Secure` in production and `SameSite=Lax` in development — and it is cleared on logout with those same attributes, since a mismatched `Set-Cookie` is rejected outright in a cross-site response.

**Authorization.** `get_current_user` decodes the cookie and is injected as a FastAPI dependency into every protected route. Each query additionally filters on `user_id`, so a user can only reach their own data even if they guess another session's id.

**Schema.** `init_db()` calls `Base.metadata.create_all`, which creates missing tables and never touches existing data. There is deliberately no migration logic in the startup path; column changes need a migration step run once, not on every cold start.

## Project structure

```
.
├── backend/
│   ├── api/index.py        # Vercel entry point — re-exports `app`
│   ├── app.py              # FastAPI app, CORS, router registration
│   ├── config/database.py  # Engine, SessionLocal, get_db dependency
│   ├── models/             # SQLAlchemy tables
│   ├── schemas/            # Pydantic request/response models
│   ├── routes/             # auth, users, sessions, exercises, stats
│   └── utils/              # JWT signing, bcrypt hashing
└── frontend/
    └── src/
        ├── components/     # Header, ProtectedRoute, pickers, modals
        ├── config/axios.ts # axios instance with credentials
        ├── context/        # AuthContext
        ├── hooks/          # useInactivityLogout
        ├── pages/          # Home, Login, Register, Sessions, Stats, ...
        ├── services/api.ts # every API call, in one place
        └── types/          # TypeScript mirrors of the backend schemas
```

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A PostgreSQL database

### Clone

```bash
git clone https://github.com/davidfjellstrom/traningsdagbok.git
cd traningsdagbok
```

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then fill in DATABASE_URL and SECRET_KEY
uvicorn app:app --reload
```

The API runs at `http://localhost:8000`, with interactive documentation at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # optional; defaults to http://localhost:8000
npm run dev
```

The app runs at `http://localhost:5173`.

## Configuration

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | PostgreSQL connection string. `postgres://` URLs are rewritten to `postgresql://` automatically. |
| `SECRET_KEY` | yes | Key used to sign JWTs. Generate with `openssl rand -hex 32`. |
| `ENVIRONMENT` | no | `development` (default) or `production`. Controls the cookie's `Secure`/`SameSite` attributes. |
| `ALLOWED_ORIGINS` | no | Comma-separated list of origins allowed by CORS. Defaults to the local Vite ports. |

Both `DATABASE_URL` and `SECRET_KEY` are read at import time and the app refuses to start without them.

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | no | Base URL of the backend. Defaults to `http://localhost:8000`. |

## API reference

The authoritative, always-current reference is the generated OpenAPI documentation at **`/docs`** (or `/redoc`) on a running backend. The table below is an index of the 15 endpoints.

All routes except registration and login require the `access_token` cookie and operate only on the authenticated user's own data.

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/login` | Log in; sets the `access_token` cookie. |
| `POST` | `/auth/logout` | Log out; clears the cookie. |
| `GET` | `/auth/me` | Return the currently authenticated user. |

### Users

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/users/` | Register an account. Username 3–50 chars, alphanumeric plus underscore; password at least 6 chars. |

### Sessions

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/sessions/` | List the user's workouts with an exercise count per session. |
| `POST` | `/sessions/` | Create a workout. |
| `GET` | `/sessions/{session_id}` | Get one workout including all its exercises. |
| `PATCH` | `/sessions/{session_id}` | Update a workout's title or date. |
| `POST` | `/sessions/{session_id}/duplicate` | Copy a workout and its exercises onto a new date. |
| `DELETE` | `/sessions/{session_id}` | Delete a workout and its exercises. |
| `GET` | `/sessions/exercise-names` | Distinct exercise names the user has used, ordered by frequency, each flagged with whether it has ever carried a weight. Powers the autocomplete. |

> The literal `/sessions/exercise-names` route is registered before the parameterised `/sessions/{session_id}` route. FastAPI matches in registration order, so reversing them would make `exercise-names` parse as a session id and fail with 422.

### Exercises

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions/{session_id}/exercises` | Add an exercise to a workout. |
| `PATCH` | `/sessions/{session_id}/exercises/{exercise_id}` | Update an exercise. Omitting a field leaves it unchanged; sending `null` clears it. |
| `DELETE` | `/sessions/{session_id}/exercises/{exercise_id}` | Delete an exercise. |

### Statistics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/stats/` | Aggregated statistics: sessions per week, top exercises (with the previous period for comparison), weight progression, and training volume. Accepts an optional `days` query parameter. |

## Data model

```
User ──< WorkoutSession ──< Exercise
```

Deletes cascade down the chain: removing a user removes their sessions, and removing a session removes its exercises.

| Table | Columns |
|-------|---------|
| `users` | `id`, `username` (unique), `password` (bcrypt hash), `created_at`, `updated_at` |
| `workout_sessions` | `id`, `user_id` → users, `title`, `date`, `created_at` |
| `exercises` | `id`, `session_id` → sessions, `name`, `is_cardio`, `sets`, `reps`, `weight_kg`, `duration_minutes`, `intensity` |

A single `exercises` table covers both training types. `is_cardio` selects which columns are meaningful: strength entries use `sets`/`reps`/`weight_kg`, cardio entries use `duration_minutes`/`intensity`. All of them are nullable, so an entry can carry only the fields that apply to it.

## Deployment

The repository is deployed as **two separate Vercel projects** from the same source.

### Backend

1. Create a Vercel project from the repo with **Root Directory** set to `backend`.
2. Under **Storage**, create a Postgres database and connect it to the project — this sets `DATABASE_URL` for you.
3. Set the remaining environment variables:

   | Variable | Value |
   |----------|-------|
   | `SECRET_KEY` | Output of `openssl rand -hex 32` |
   | `ENVIRONMENT` | `production` |
   | `ALLOWED_ORIGINS` | The frontend's URL |

4. Deploy. `backend/vercel.json` routes every request to `api/index.py`, which re-exports the FastAPI app.

### Frontend

1. Create a second Vercel project from the same repo with **Root Directory** set to `frontend`.
2. Set `VITE_API_URL` to the backend's URL.
3. Deploy. `frontend/vercel.json` rewrites all paths to `index.html` so client-side routing works on refresh.

`ALLOWED_ORIGINS` on the backend and `VITE_API_URL` on the frontend have to point at each other, or the browser will block the cross-site cookie.

## Roadmap

- A real migration tool (Alembic) so column changes have a repeatable path.
- Automated tests for the API and the exercise editing flow.
- Editable exercise names, not just their numeric fields.
- Personal-record tracking per exercise.
- Export a training log to CSV.

## License

No license has been added to this repository yet, so all rights are reserved by default. Open an issue if you would like it published under an open-source license.
