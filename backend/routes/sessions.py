import logging
from datetime import date
from fastapi import APIRouter, HTTPException, status, Depends, Body
from sqlalchemy.orm import Session
from typing import List
from schemas.session import SessionCreate, SessionUpdate, SessionResponse, SessionListItem, DuplicateSessionBody
from schemas.auth import CurrentUser
from models.session import WorkoutSession
from models.exercise import Exercise
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


@router.patch("/{session_id}", response_model=SessionListItem)
async def update_session(
    session_id: int,
    session_data: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.user_id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    for field, value in session_data.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return SessionListItem(
        id=session.id,
        title=session.title,
        date=session.date,
        created_at=session.created_at,
        exercise_count=len(session.exercises)
    )


@router.post("/{session_id}/duplicate", response_model=SessionListItem, status_code=status.HTTP_201_CREATED)
async def duplicate_session(
    session_id: int,
    body: DuplicateSessionBody = Body(default=DuplicateSessionBody()),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    original = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.user_id
    ).first()
    if not original:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    target_date = body.date or date.today().isoformat()

    new_session = WorkoutSession(
        user_id=current_user.user_id,
        title=original.title,
        date=target_date,
    )
    db.add(new_session)
    db.flush()

    for ex in original.exercises:
        db.add(Exercise(
            session_id=new_session.id,
            name=ex.name,
            is_cardio=ex.is_cardio,
            sets=ex.sets,
            reps=ex.reps,
            weight_kg=ex.weight_kg,
            duration_minutes=ex.duration_minutes,
            intensity=ex.intensity,
        ))

    db.commit()
    db.refresh(new_session)
    return SessionListItem(
        id=new_session.id,
        title=new_session.title,
        date=new_session.date,
        created_at=new_session.created_at,
        exercise_count=len(new_session.exercises),
    )


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
