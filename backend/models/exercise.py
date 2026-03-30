from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from config.database import Base


class Exercise(Base):
    """
    SQLAlchemy model for the exercises table.
    Representerar en övning inom ett träningspass.
    """
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    sets = Column(Integer, nullable=True)
    reps = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    intensity = Column(Integer, nullable=True)
    is_cardio = Column(Boolean, nullable=False, default=False, server_default='false')

    # Relation tillbaka till passet
    session = relationship("WorkoutSession", back_populates="exercises")

    def __repr__(self):
        return f"<Exercise(id={self.id}, name='{self.name}', sets={self.sets}, reps={self.reps})>"
