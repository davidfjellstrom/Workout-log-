import os
import logging
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, status, Depends, Cookie, Response
from sqlalchemy.orm import Session
from typing import Optional
from schemas.auth import LoginRequest, TokenResponse, CurrentUser
from models.user import User
from config.database import get_db
from utils.password import verify_password
from utils.auth import create_access_token, decode_access_token

load_dotenv()

logger = logging.getLogger(__name__)

# I produktion (olika domäner) krävs samesite=none + secure=true för att
# cookien ska skickas med i cross-origin-anrop från frontend
_env = os.getenv("ENVIRONMENT", "development")
COOKIE_SECURE = _env == "production"
COOKIE_SAMESITE = "none" if _env == "production" else "lax"

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Loggar in en användare och sätter ett JWT-token som HTTP-only cookie.
    """
    user = db.query(User).filter(User.username == login_data.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Fel användarnamn eller lösenord"
        )

    if not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Fel användarnamn eller lösenord"
        )

    # Skapa JWT-token med användarens id och namn
    token_data = {"user_id": user.id, "username": user.username}
    access_token = create_access_token(data=token_data)

    # Sätt token som HTTP-only cookie (JavaScript kan inte läsa den)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=1800,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )

    logger.info("User '%s' logged in", user.username)
    return TokenResponse(
        message="Inloggning lyckades!",
        user_id=user.id,
        username=user.username
    )


@router.post("/logout")
async def logout(response: Response):
    """Loggar ut användaren genom att rensa cookien."""
    response.delete_cookie(key="access_token")
    return {"message": "Du har loggats ut"}


def get_current_user(access_token: Optional[str] = Cookie(None)) -> CurrentUser:
    """
    Dependency-funktion som läser JWT-cookien och returnerar den inloggade användaren.
    Används som Depends(...) i skyddade endpoints.
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inte inloggad. Logga in först."
        )

    payload = decode_access_token(access_token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ogiltigt eller utgånget token. Logga in igen."
        )

    return CurrentUser(
        user_id=payload.get("user_id"),
        username=payload.get("username")
    )


@router.get("/me", response_model=CurrentUser)
async def get_me(current_user: CurrentUser = Depends(get_current_user)):
    """Returnerar den inloggade användarens info (kräver inloggning)."""
    return current_user
