from pydantic import BaseModel, Field
from typing import Optional


class ExerciseCreate(BaseModel):
    """Schema för att lägga till en övning på ett pass."""
    name: str = Field(..., min_length=1, max_length=100)
    is_cardio: bool = False
    sets: Optional[int] = Field(default=None, ge=1)
    reps: Optional[int] = Field(default=None, ge=1)
    weight_kg: Optional[float] = None
    duration_minutes: Optional[int] = Field(default=None, ge=1)
    intensity: Optional[int] = Field(default=None, ge=1, le=10)


class ExerciseUpdate(BaseModel):
    """Schema för att uppdatera en övning."""
    sets: Optional[int] = Field(default=None, ge=1)
    reps: Optional[int] = Field(default=None, ge=1)
    weight_kg: Optional[float] = None
    duration_minutes: Optional[int] = Field(default=None, ge=1)
    intensity: Optional[int] = Field(default=None, ge=1, le=10)


class ExerciseResponse(BaseModel):
    """Schema för en övning i svaret från API:et."""
    id: int
    session_id: int
    name: str
    is_cardio: bool
    sets: Optional[int]
    reps: Optional[int]
    weight_kg: Optional[float]
    duration_minutes: Optional[int]
    intensity: Optional[int]

    class Config:
        from_attributes = True
