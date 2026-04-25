"""
Volunteer Reliability Prediction — Logistic Regression model.

Features used:
  - total_completed      (count of completed tasks)
  - total_no_shows       (count of no-show events)
  - total_cancelled      (count of voluntarily cancelled)
  - completion_ratio     (completed / total assigned)
  - avg_match_score      (how well-matched the volunteer was to past tasks)
  - days_since_joined    (tenure on the platform)

Target: will_show_up (1 = completed, 0 = no_show) — for each future assignment.

The model trains on historical participation data and stores itself in memory.
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from models.user import User
from models.participation import Participation

# Module-level model state (in-memory singleton)
_model: LogisticRegression | None = None
_scaler: StandardScaler | None = None


def _build_features(db: Session) -> pd.DataFrame:
    """
    Build a feature matrix from participation history.
    One row per (volunteer, task) where status ∈ {completed, no_show}.
    """
    rows = (
        db.query(Participation, User)
        .join(User, User.id == Participation.volunteer_id)
        .filter(Participation.status.in_(["completed", "no_show"]))
        .all()
    )

    if not rows:
        return pd.DataFrame()

    records = []
    for part, user in rows:
        # Aggregate stats for this volunteer up to this participation
        all_parts = (
            db.query(Participation)
            .filter(
                Participation.volunteer_id == user.id,
                Participation.applied_at <= part.applied_at,
            )
            .all()
        )
        total_completed = sum(1 for p in all_parts if p.status == "completed")
        total_no_shows = sum(1 for p in all_parts if p.status == "no_show")
        total_cancelled = sum(1 for p in all_parts if p.status == "cancelled")
        total_assigned = total_completed + total_no_shows + total_cancelled
        completion_ratio = total_completed / total_assigned if total_assigned else 0.5

        avg_match = np.mean([p.match_score for p in all_parts if p.match_score]) if any(
            p.match_score for p in all_parts
        ) else 50.0

        now = datetime.now(timezone.utc)
        days_since_joined = (now - user.created_at.replace(tzinfo=timezone.utc)).days if user.created_at else 30

        records.append({
            "total_completed": total_completed,
            "total_no_shows": total_no_shows,
            "total_cancelled": total_cancelled,
            "completion_ratio": completion_ratio,
            "avg_match_score": avg_match,
            "days_since_joined": days_since_joined,
            "will_show_up": 1 if part.status == "completed" else 0,
        })

    return pd.DataFrame(records)


def train_reliability_model(db: Session) -> dict:
    """
    Train (or retrain) the logistic regression model on current data.
    Returns training metrics.
    """
    global _model, _scaler

    df = _build_features(db)

    if df.empty or len(df) < 5:
        return {"status": "insufficient_data", "rows": len(df)}

    feature_cols = [
        "total_completed", "total_no_shows", "total_cancelled",
        "completion_ratio", "avg_match_score", "days_since_joined",
    ]
    X = df[feature_cols].values
    y = df["will_show_up"].values

    _scaler = StandardScaler()
    X_scaled = _scaler.fit_transform(X)

    _model = LogisticRegression(max_iter=300, random_state=42)
    _model.fit(X_scaled, y)

    accuracy = _model.score(X_scaled, y)
    return {
        "status": "trained",
        "rows": len(df),
        "accuracy": round(accuracy, 4),
        "features": feature_cols,
    }


def predict_show_up_probability(db: Session, volunteer_id: int) -> float:
    """
    Predict the probability that a volunteer shows up for a future task.
    Returns a float in [0, 1].  Falls back to the user's reliability_score if
    the model isn't trained yet.
    """
    global _model, _scaler

    user = db.query(User).filter(User.id == volunteer_id).first()
    if not user:
        return 0.5

    if _model is None or _scaler is None:
        # Fallback: use raw reliability score
        return user.reliability_score if user.reliability_score is not None else 0.5

    parts = db.query(Participation).filter(Participation.volunteer_id == volunteer_id).all()
    total_completed = sum(1 for p in parts if p.status == "completed")
    total_no_shows = sum(1 for p in parts if p.status == "no_show")
    total_cancelled = sum(1 for p in parts if p.status == "cancelled")
    total_assigned = total_completed + total_no_shows + total_cancelled
    completion_ratio = total_completed / total_assigned if total_assigned else 0.5
    avg_match = np.mean([p.match_score for p in parts if p.match_score]) if any(
        p.match_score for p in parts
    ) else 50.0
    now = datetime.now(timezone.utc)
    days_since_joined = (now - user.created_at.replace(tzinfo=timezone.utc)).days if user.created_at else 30

    features = np.array([[
        total_completed, total_no_shows, total_cancelled,
        completion_ratio, avg_match, days_since_joined,
    ]])
    features_scaled = _scaler.transform(features)
    proba = _model.predict_proba(features_scaled)[0][1]  # P(will_show_up = 1)
    return round(float(proba), 4)
