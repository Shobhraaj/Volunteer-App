"""
FastAPI Entry Point — AI-Powered Volunteer Coordination Platform

Registers all route modules & creates DB tables on startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from database import engine, Base

# Import all models so SQLAlchemy registers them with Base.metadata
from models import User, Task, Participation, Badge  # noqa: F401

# Import route modules
from routes.auth import router as auth_router
from routes.volunteers import router as volunteers_router
from routes.tasks import router as tasks_router
from routes.organizers import router as organizers_router
from routes.analytics import router as analytics_router
from routes.chatbot import router as chatbot_router

# ── App instance ─────────────────────────────────────────────────────
app = FastAPI(
    title="AI Volunteer Platform",
    description="AI-powered data-driven volunteer coordination platform",
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(volunteers_router)
app.include_router(tasks_router)
app.include_router(organizers_router)
app.include_router(analytics_router)
app.include_router(chatbot_router)


# ── Create tables on startup ────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


# ── Health check ─────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "running",
        "app": "AI Volunteer Platform",
        "version": "1.0.0",
        "docs": "/docs",
    }
