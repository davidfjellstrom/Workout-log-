from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class UserCreate(BaseModel):
    """Schema för att skapa ett nytt konto."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

    @field_validator('username')
    @classmethod
    def username_must_be_alphanumeric(cls, v: str) -> str:
        if not v.replace('_', '').isalnum():
            raise ValueError('Användarnamnet får bara innehålla bokstäver, siffror och understreck')
        return v.strip()


class UserResponse(BaseModel):
    """Schema för svar när en användare returneras (utan lösenord)."""
    id: int
    username: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
