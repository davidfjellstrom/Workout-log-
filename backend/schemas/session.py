from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import List
from schemas.exercise import ExerciseResponse


class SessionCreate(BaseModel):
    """Schema för att skapa ett nytt träningspass."""
    title: str = Field(..., min_length=1, max_length=100)
    date: date


class SessionListItem(BaseModel):
    """Schema för ett pass i listvy (utan övningar, men med antal)."""
    id: int
    title: str
    date: date
    created_at: datetime
    exercise_count: int

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    """Schema för ett pass med alla dess övningar."""
    id: int
    user_id: int
    title: str
    date: date
    created_at: datetime
    exercises: List[ExerciseResponse]

    class Config:
        from_attributes = True
