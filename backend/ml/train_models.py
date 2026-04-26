"""
CLI helper to train / retrain ML models from the command line.

Usage:
    python -m ml.train_models
"""

from database import SessionLocal
from ml.reliability_model import train_reliability_model


def main():
    db = SessionLocal()
    try:
        print("🧠 Training reliability model...")
        result = train_reliability_model(db)
        print(f"   Result: {result}")
        print("✅ Done!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
