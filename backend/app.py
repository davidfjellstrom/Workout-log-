import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.users import router as users_router
from routes.auth import router as auth_router
from routes.sessions import router as sessions_router
from routes.exercises import router as exercises_router
from routes.stats import router as stats_router
from config.database import init_db

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(name)s - %(message)s")
logger = logging.getLogger(__name__)


_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Workout Log API...")
    init_db()
    yield


app = FastAPI(
    title="Workout Log API",
    description="Backend for Workout Log — manages users, workout sessions and exercises",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(exercises_router)
app.include_router(sessions_router)
app.include_router(stats_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Workout Log API!",
        "docs": "/docs",
        "endpoints": {
            "POST /users": "Register account",
            "POST /auth/login": "Log in",
            "POST /auth/logout": "Log out",
            "GET /auth/me": "Get current user",
            "GET /sessions": "List workouts",
            "POST /sessions": "Create workout",
            "GET /sessions/{id}": "Get workout with exercises",
            "DELETE /sessions/{id}": "Delete workout",
            "POST /sessions/{id}/exercises": "Add exercise",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
