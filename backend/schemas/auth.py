from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Schema för inloggningsförfrågan."""
    username: str
    password: str


class TokenResponse(BaseModel):
    """Schema för svar när inloggning lyckas."""
    message: str
    user_id: int
    username: str


class CurrentUser(BaseModel):
    """Schema för den inloggade användaren (hämtad från JWT)."""
    user_id: int
    username: str
