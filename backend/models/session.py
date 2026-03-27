from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base


class WorkoutSession(Base):
    """
    SQLAlchemy model for the workout_sessions table.
    Representerar ett träningspass med titel och datum.
    """
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relation tillbaka till användaren
    user = relationship("User", back_populates="sessions")

    # Ett pass kan ha många övningar
    exercises = relationship("Exercise", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<WorkoutSession(id={self.id}, title='{self.title}', date={self.date})>"
