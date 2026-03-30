import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your .env file.")

# Vercel Postgres skickar "postgres://" men SQLAlchemy kräver "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from models.user import User  # noqa: F401
    from models.session import WorkoutSession  # noqa: F401
    from models.exercise import Exercise  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Add new columns to existing tables if they don't exist yet
    with engine.connect() as conn:
        conn.execute(__import__('sqlalchemy').text(
            "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS duration_minutes INTEGER"
        ))
        conn.execute(__import__('sqlalchemy').text(
            "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS intensity INTEGER"
        ))
        conn.execute(__import__('sqlalchemy').text(
            "ALTER TABLE exercises ALTER COLUMN sets DROP NOT NULL"
        ))
        conn.execute(__import__('sqlalchemy').text(
            "ALTER TABLE exercises ALTER COLUMN reps DROP NOT NULL"
        ))
        conn.execute(__import__('sqlalchemy').text(
            "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_cardio BOOLEAN NOT NULL DEFAULT false"
        ))
        # Backfill: mark old exercises as cardio if they have duration set,
        # or if they have sets=1, reps=1 and no weight (old cardio entries before is_cardio existed)
        conn.execute(__import__('sqlalchemy').text(
            "UPDATE exercises SET is_cardio = true WHERE is_cardio = false AND ("
            "  duration_minutes IS NOT NULL"
            "  OR (weight_kg IS NULL AND sets IS NOT NULL AND sets = 1 AND reps IS NOT NULL AND reps = 1)"
            ")"
        ))
        conn.commit()

    logger.info("Database tables created/verified.")
