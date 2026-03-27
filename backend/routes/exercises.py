import logging
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from schemas.exercise import ExerciseCreate, ExerciseResponse
from schemas.auth import CurrentUser
from models.session import WorkoutSession
from models.exercise import Exercise
from config.database import get_db
from routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/sessions",
    tags=["exercises"]
)


@router.post("/{session_id}/exercises", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
async def add_exercise(
    session_id: int,
    exercise_data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Lägger till en övning på ett träningspass.
    Kontrollerar att passet tillhör den inloggade användaren.
    """
    # Verifiera att passet finns och tillhör användaren
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.user_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Träningspass med ID {session_id} hittades inte"
        )

    new_exercise = Exercise(
        session_id=session_id,
        name=exercise_data.name,
        sets=exercise_data.sets,
        reps=exercise_data.reps,
        weight_kg=exercise_data.weight_kg
    )

    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)

    logger.info("Exercise '%s' added to session '%s'", new_exercise.name, session.title)
    return new_exercise
