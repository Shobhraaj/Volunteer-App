"""
Authentication routes — register, login, current-user.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.user import UserRegister, UserLogin, Token, UserOut
from services.auth_service import (
    register_user,
    authenticate_user,
    create_access_token,
    get_current_user,
)
from models.user import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=Token)
def register(body: UserRegister, db: Session = Depends(get_db)):
    user = register_user(db, body.email, body.password, body.full_name, body.role)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "user_id": user.id}


@router.post("/login", response_model=Token)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "user_id": user.id}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
