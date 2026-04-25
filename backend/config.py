"""
Application configuration — loads from environment variables with sensible defaults.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── Database ────────────────────────────────────────────────────────
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "sqlite:///./volunteer_platform.db",
)

# ── JWT / Auth ──────────────────────────────────────────────────────
SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production-super-secret-key-2026")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24h

# ── Matching weights ────────────────────────────────────────────────
MATCH_WEIGHT_SKILL: float = 0.4
MATCH_WEIGHT_LOCATION: float = 0.2
MATCH_WEIGHT_AVAILABILITY: float = 0.2
MATCH_WEIGHT_RELIABILITY: float = 0.2

# ── CORS ────────────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
