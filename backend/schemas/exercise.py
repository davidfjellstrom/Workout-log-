from pydantic import BaseModel, Field
from typing import Optional


class ExerciseCreate(BaseModel):
    """Schema för att lägga till en övning på ett pass."""
    name: str = Field(..., min_length=1, max_length=100)
    sets: int = Field(default=1, ge=1)
    reps: int = Field(default=1, ge=1)
    weight_kg: Optional[float] = None


class ExerciseResponse(BaseModel):
    """Schema för en övning i svaret från API:et."""
    id: int
    session_id: int
    name: str
    sets: int
    reps: int
    weight_kg: Optional[float]

    class Config:
        from_attributes = True
