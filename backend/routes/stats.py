import logging
from datetime import date, timedelta
from collections import defaultdict
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
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
    days: Optional[int] = Query(default=None),
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
    current_week_monday = today - timedelta(days=today.weekday())

    # Fetch all sessions for this user (no date cutoff) so the window covers all data
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.user_id,
    ).all()

    week_counts: dict[str, int] = defaultdict(int)
    for session in sessions:
        label = _iso_week_label(session.date)
        week_counts[label] += 1

    # Window: from the earliest session's week to the latest (including future)
    if sessions:
        earliest = min(s.date for s in sessions)
        latest = max(s.date for s in sessions)
    else:
        earliest = today
        latest = today

    start_date = earliest - timedelta(days=earliest.weekday())
    end_week_monday = max(current_week_monday, latest - timedelta(days=latest.weekday()))
    num_weeks = (end_week_monday - start_date).days // 7 + 1

    sessions_per_week = []
    for i in range(num_weeks):
        week_monday = start_date + timedelta(weeks=i)
        label = _iso_week_label(week_monday)
        sessions_per_week.append({"week": label, "count": week_counts.get(label, 0)})

    # --- top_exercises: top 5 by frequency ---
    top_q = (
        db.query(Exercise.name, func.count(Exercise.id).label("count"))
        .join(WorkoutSession, Exercise.session_id == WorkoutSession.id)
        .filter(WorkoutSession.user_id == current_user.user_id)
    )
    if days:
        cutoff = today - timedelta(days=days)
        top_q = top_q.filter(WorkoutSession.date >= cutoff)
    top_exercises_query = (
        top_q
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
    for i in range(num_weeks):
        week_monday = start_date + timedelta(weeks=i)
        label = _iso_week_label(week_monday)
        avg_intensity = round(week_intensity_sum[label] / week_intensity_count[label], 1) if week_intensity_count[label] > 0 else None
        volume_per_week.append({
            "week": label,
            "duration": week_duration.get(label, 0),
            "avg_intensity": avg_intensity,
        })

    # --- volume_by_exercise: per-exercise volume data ---
    vol_exercise_names = [row.name for row in (
        db.query(Exercise.name)
        .join(WorkoutSession, Exercise.session_id == WorkoutSession.id)
        .filter(
            WorkoutSession.user_id == current_user.user_id,
            or_(Exercise.duration_minutes.isnot(None), Exercise.intensity.isnot(None))
        )
        .distinct()
        .all()
    )]

    volume_by_exercise: dict[str, list] = {}
    for ex_name in vol_exercise_names:
        ex_rows = (
            db.query(
                WorkoutSession.date,
                func.sum(Exercise.duration_minutes).label("total_duration"),
                func.avg(Exercise.intensity).label("avg_intensity"),
            )
            .join(Exercise, Exercise.session_id == WorkoutSession.id)
            .filter(
                WorkoutSession.user_id == current_user.user_id,
                Exercise.name == ex_name,
            )
            .group_by(WorkoutSession.date)
            .all()
        )
        wd: dict[str, int] = defaultdict(int)
        wi_sum: dict[str, float] = defaultdict(float)
        wi_cnt: dict[str, int] = defaultdict(int)
        for row in ex_rows:
            label = _iso_week_label(row.date)
            if row.total_duration:
                wd[label] += int(row.total_duration)
            if row.avg_intensity is not None:
                wi_sum[label] += float(row.avg_intensity)
                wi_cnt[label] += 1
        weekly = []
        for i in range(num_weeks):
            label = _iso_week_label(start_date + timedelta(weeks=i))
            avg_i = round(wi_sum[label] / wi_cnt[label], 1) if wi_cnt[label] > 0 else None
            weekly.append({"week": label, "duration": wd.get(label, 0), "avg_intensity": avg_i})
        volume_by_exercise[ex_name] = weekly

    return {
        "sessions_per_week": sessions_per_week,
        "top_exercises": top_exercises,
        "exercise_progression": exercise_progression,
        "volume_per_week": volume_per_week,
        "volume_by_exercise": volume_by_exercise,
    }
