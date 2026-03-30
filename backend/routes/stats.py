import logging
from datetime import date, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from schemas.auth import CurrentUser
from models.session import WorkoutSession
from models.exercise import Exercise
from config.database import get_db
from routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/stats",
    tags=["stats"]
)


def _iso_week_label(d: date) -> str:
    """Return ISO week label like '2026-W10' for a given date."""
    year, week, _ = d.isocalendar()
    return f"{year}-W{week:02d}"


@router.get("/")
async def get_stats(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Returns workout statistics for the current user:
    - sessions_per_week: last 8 weeks with session counts (including 0-count weeks)
    - top_exercises: top 5 most frequently used exercise names
    - exercise_progression: for each top exercise, sorted list of {date, max_weight}
    """
    today = date.today()

    # --- sessions_per_week: last 8 weeks ---
    # Find Monday of the current ISO week
    current_week_monday = today - timedelta(days=today.weekday())
    # Go back 7 more weeks so we have 8 weeks total (oldest first)
    start_date = current_week_monday - timedelta(weeks=7)

    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.user_id,
        WorkoutSession.date >= start_date
    ).all()

    week_counts: dict[str, int] = defaultdict(int)
    for session in sessions:
        label = _iso_week_label(session.date)
        week_counts[label] += 1

    # Build ordered list for all 8 weeks, including zero-count weeks
    sessions_per_week = []
    for i in range(8):
        week_monday = start_date + timedelta(weeks=i)
        label = _iso_week_label(week_monday)
        sessions_per_week.append({"week": label, "count": week_counts.get(label, 0)})

    # --- top_exercises: top 5 by frequency ---
    top_exercises_query = (
        db.query(Exercise.name, func.count(Exercise.id).label("count"))
        .join(WorkoutSession, Exercise.session_id == WorkoutSession.id)
        .filter(WorkoutSession.user_id == current_user.user_id)
        .group_by(Exercise.name)
        .order_by(func.count(Exercise.id).desc())
        .limit(5)
        .all()
    )

    top_exercises = [{"name": row.name, "count": row.count} for row in top_exercises_query]

    # Only include exercises that track weight (have ever had a non-null weight_kg)
    # in the progression section
    weight_tracking_names_query = (
        db.query(Exercise.name)
        .join(WorkoutSession, Exercise.session_id == WorkoutSession.id)
        .filter(
            WorkoutSession.user_id == current_user.user_id,
            Exercise.weight_kg.isnot(None)
        )
        .group_by(Exercise.name)
        .all()
    )
    weight_tracking_names = {row.name for row in weight_tracking_names_query}
    top_exercise_names = [row["name"] for row in top_exercises if row["name"] in weight_tracking_names]

    # --- exercise_progression: max weight per date for each top exercise ---
    exercise_progression: dict[str, list] = {}

    for exercise_name in top_exercise_names:
        rows = (
            db.query(WorkoutSession.date, func.max(Exercise.weight_kg).label("max_weight"))
            .join(Exercise, Exercise.session_id == WorkoutSession.id)
            .filter(
                WorkoutSession.user_id == current_user.user_id,
                Exercise.name == exercise_name,
                Exercise.weight_kg.isnot(None)
            )
            .group_by(WorkoutSession.date)
            .order_by(WorkoutSession.date.asc())
            .all()
        )

        exercise_progression[exercise_name] = [
            {"date": str(row.date), "max_weight": row.max_weight}
            for row in rows
        ]

    # --- volume_per_week: total duration + avg intensity per week ---
    exercise_rows = (
        db.query(
            WorkoutSession.date,
            func.sum(Exercise.duration_minutes).label("total_duration"),
            func.avg(Exercise.intensity).label("avg_intensity"),
        )
        .join(Exercise, Exercise.session_id == WorkoutSession.id)
        .filter(
            WorkoutSession.user_id == current_user.user_id,
            WorkoutSession.date >= start_date,
        )
        .group_by(WorkoutSession.date)
        .all()
    )

    week_duration: dict[str, int] = defaultdict(int)
    week_intensity_sum: dict[str, float] = defaultdict(float)
    week_intensity_count: dict[str, int] = defaultdict(int)

    for row in exercise_rows:
        label = _iso_week_label(row.date)
        if row.total_duration:
            week_duration[label] += int(row.total_duration)
        if row.avg_intensity is not None:
            week_intensity_sum[label] += float(row.avg_intensity)
            week_intensity_count[label] += 1

    volume_per_week = []
    for i in range(8):
        week_monday = start_date + timedelta(weeks=i)
        label = _iso_week_label(week_monday)
        avg_intensity = round(week_intensity_sum[label] / week_intensity_count[label], 1) if week_intensity_count[label] > 0 else None
        volume_per_week.append({
            "week": label,
            "duration": week_duration.get(label, 0),
            "avg_intensity": avg_intensity,
        })

    return {
        "sessions_per_week": sessions_per_week,
        "top_exercises": top_exercises,
        "exercise_progression": exercise_progression,
        "volume_per_week": volume_per_week,
    }
