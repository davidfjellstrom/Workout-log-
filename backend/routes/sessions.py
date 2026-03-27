import logging
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List
from schemas.session import SessionCreate, SessionResponse, SessionListItem
from schemas.auth import CurrentUser
from models.session import WorkoutSession
from config.database import get_db
from routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/sessions",
    tags=["sessions"]
)


@router.get("/", response_model=List[SessionListItem])
async def get_sessions(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Hämtar alla träningspass för den inloggade användaren.
    Returnerar en lista med pass + antal övningar per pass.
    """
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.user_id
    ).order_by(WorkoutSession.date.desc()).all()

    result = []
    for session in sessions:
        result.append(SessionListItem(
            id=session.id,
            title=session.title,
            date=session.date,
            created_at=session.created_at,
            exercise_count=len(session.exercises)
        ))
    return result


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Skapar ett nytt träningspass för den inloggade användaren.
    """
    new_session = WorkoutSession(
        user_id=current_user.user_id,
        title=session_data.title,
        date=session_data.date
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    logger.info("New session '%s' created by %s", new_session.title, current_user.username)
    return new_session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Hämtar ett specifikt träningspass med alla dess övningar.
    Returnerar 404 om passet inte finns eller tillhör en annan användare.
    """
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.user_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Träningspass med ID {session_id} hittades inte"
        )

    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Tar bort ett träningspass.
    Övningarna tas bort automatiskt tack vare cascade="all, delete-orphan".
    """
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.user_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Träningspass med ID {session_id} hittades inte"
        )

    db.delete(session)
    db.commit()

    logger.info("Session '%s' deleted by %s", session.title, current_user.username)
    return None
