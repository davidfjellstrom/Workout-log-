# Workout Log

A web app for logging workouts and exercises. Create an account, log your sessions and track sets, reps and weight.

## Teknikstack

| Del | Teknologi |
|-----|-----------|
| Backend | Python, FastAPI, SQLAlchemy |
| Databas | PostgreSQL |
| Frontend | React, TypeScript, Vite |
| Auth | JWT via HTTP-only cookie |
| Driftsättning | Vercel |

---

## Driftsättning på Vercel

Projektet är uppdelat i två separata Vercel-projekt — ett för backend och ett för frontend.

### 1. Lägg upp koden på GitHub

Pusha hela repot till GitHub innan du fortsätter.

### 2. Backend

1. Gå till [vercel.com](https://vercel.com) → **Add New Project**
2. Importera repot och sätt **Root Directory** till `backend`
3. Lägg till dessa miljövariabler under **Environment Variables**:

| Variabel | Värde |
|----------|-------|
| `DATABASE_URL` | Hämtas från Vercel Postgres (se nedan) |
| `SECRET_KEY` | Generera med `openssl rand -hex 32` |
| `ENVIRONMENT` | `production` |
| `ALLOWED_ORIGINS` | Din frontend-URL, t.ex. `https://traningsdagbok.vercel.app` |

**Skapa databasen:** I Vercel-dashboarden → **Storage** → **Create Database** → välj **Postgres**. Koppla den till backend-projektet — `DATABASE_URL` sätts då automatiskt.

4. Deploya. Backend-URL:en ser ut som `https://traningsdagbok-api.vercel.app`.

### 3. Frontend

1. Skapa ett nytt Vercel-projekt, samma repo men **Root Directory** satt till `frontend`
2. Lägg till miljövariabel:

| Variabel | Värde |
|----------|-------|
| `VITE_API_URL` | Din backend-URL, t.ex. `https://traningsdagbok-api.vercel.app` |

3. Deploya.

---

## Lokal utveckling

### Förutsättningar

- Python 3.11+
- Node.js 18+
- MySQL eller PostgreSQL

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fyll i DATABASE_URL och SECRET_KEY
uvicorn app:app --reload
```

API:et körs på `http://localhost:8000` — dokumentation på `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Appen körs på `http://localhost:5173`.

---

## Miljövariabler

### Backend (`backend/.env`)

| Variabel | Beskrivning |
|----------|-------------|
| `DATABASE_URL` | Databasanslutning (PostgreSQL eller MySQL) |
| `SECRET_KEY` | Slumpmässig nyckel för JWT-signering |
| `ENVIRONMENT` | `development` eller `production` |
| `ALLOWED_ORIGINS` | Kommaseparerade frontend-URL:er |

### Frontend (`frontend/.env`)

| Variabel | Beskrivning |
|----------|-------------|
| `VITE_API_URL` | URL till backend-API:et |

---

## API-endpoints

| Metod | Endpoint | Beskrivning | Auth |
|-------|----------|-------------|------|
| POST | `/users` | Registrera konto | Nej |
| POST | `/auth/login` | Logga in | Nej |
| POST | `/auth/logout` | Logga ut | Ja |
| GET | `/auth/me` | Hämta inloggad användare | Ja |
| GET | `/sessions` | Lista träningspass | Ja |
| POST | `/sessions` | Skapa nytt pass | Ja |
| GET | `/sessions/{id}` | Hämta pass med övningar | Ja |
| DELETE | `/sessions/{id}` | Ta bort pass | Ja |
| POST | `/sessions/{id}/exercises` | Lägg till övning | Ja |
