# Workout Log

A web app for logging workouts and exercises. Create an account, log your sessions and track sets, reps and weight.

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Frontend | React, TypeScript, Vite |
| Auth | JWT via HTTP-only cookie |
| Deployment | Vercel |

---

## Deploying to Vercel

The project is split into two separate Vercel projects — one for the backend and one for the frontend.

### 1. Push the code to GitHub

Push the full repo to GitHub before continuing.

### 2. Backend

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the repo and set **Root Directory** to `backend`
3. Add the following environment variables under **Environment Variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Provided by Vercel Postgres (see below) |
| `SECRET_KEY` | Generate with `openssl rand -hex 32` |
| `ENVIRONMENT` | `production` |
| `ALLOWED_ORIGINS` | Your frontend URL, e.g. `https://workout-log.vercel.app` |

**Create the database:** In the Vercel dashboard → **Storage** → **Create Database** → choose **Postgres**. Connect it to the backend project — `DATABASE_URL` will be set automatically.

4. Deploy. The backend URL will look like `https://workout-log-api.vercel.app`.

### 3. Frontend

1. Create a new Vercel project from the same repo, but set **Root Directory** to `frontend`
2. Add the environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your backend URL, e.g. `https://workout-log-api.vercel.app` |

3. Deploy.

---

## Local development

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL and SECRET_KEY
uvicorn app:app --reload
```

API runs at `http://localhost:8000` — documentation at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Database connection string (PostgreSQL) |
| `SECRET_KEY` | Random key for JWT signing |
| `ENVIRONMENT` | `development` or `production` |
| `ALLOWED_ORIGINS` | Comma-separated list of frontend URLs |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL to the backend API |

---

## API endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/users` | Register account | No |
| POST | `/auth/login` | Log in | No |
| POST | `/auth/logout` | Log out | Yes |
| GET | `/auth/me` | Get current user | Yes |
| GET | `/sessions` | List workouts | Yes |
| POST | `/sessions` | Create workout | Yes |
| GET | `/sessions/{id}` | Get workout with exercises | Yes |
| DELETE | `/sessions/{id}` | Delete workout | Yes |
| POST | `/sessions/{id}/exercises` | Add exercise | Yes |
