import logging
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from schemas.user import UserCreate, UserResponse
from models.user import User
from config.database import get_db
from utils.password import hash_password

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registrerar ett nytt konto.
    Kontrollerar att användarnamnet inte redan finns, hashar lösenordet och sparar användaren.
    """
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Användarnamnet '{user.username}' är redan taget"
        )

    hashed_password = hash_password(user.password)
    new_user = User(username=user.username, password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info("New account created: %s (ID: %d)", new_user.username, new_user.id)
    return new_user
