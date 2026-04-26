"""
Chatbot route — AI-powered conversational assistant.
Keyword-matching engine with hooks for Dialogflow / Google Cloud AI.

POST /chatbot
  Body: { "message": "..." }
  Returns: { "reply": "..." }
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from routes.auth import get_current_user
from database import SessionLocal
from models import User, Task, Participation
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])


class ChatRequest(BaseModel):
    message: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Keyword intent resolver ────────────────────────────────────────────
def resolve_intent(text: str, user: User, db: Session) -> str:
    t = text.lower().strip()

    # ── Available tasks ────────────────────────────────────────────────
    if any(k in t for k in ["available task", "open task", "find task", "show task", "list task"]):
        tasks = db.query(Task).filter(Task.status == "open").limit(5).all()
        if not tasks:
            return "There are no open tasks right now. Check back soon!"
        lines = [f"• **{task.title}** — {task.location_name or 'Remote'} ({task.urgency} urgency)" for task in tasks]
        return f"Here are **{len(tasks)} open tasks**:\n\n" + "\n".join(lines) + "\n\nVisit the Dashboard to apply!"

    # ── My status / applications ───────────────────────────────────────
    if any(k in t for k in ["my status", "my task", "my application", "applied", "assigned to me"]):
        records = db.query(Participation).filter(Participation.volunteer_id == user.id).order_by(Participation.applied_at.desc()).limit(5).all()
        if not records:
            return "You haven't applied to any tasks yet. Browse open tasks on the Dashboard!"
        lines = [f"• Task #{r.task_id} — **{r.status}**" for r in records]
        return "Your recent task activity:\n\n" + "\n".join(lines)

    # ── Points / leaderboard ───────────────────────────────────────────
    if any(k in t for k in ["point", "score", "rank", "leaderboard", "badge"]):
        return (
            f"You currently have **{user.points or 0} points** and a reliability score of "
            f"**{int((user.reliability_score or 0) * 100)}%**.\n\n"
            "Check the **Leaderboard** page to see how you rank against other volunteers! 🏆"
        )

    # ── Help ───────────────────────────────────────────────────────────
    if any(k in t for k in ["help", "what can you do", "commands", "guide"]):
        return (
            "I can help you with:\n\n"
            "• 📋 **Available tasks** — list open volunteer opportunities\n"
            "• 📊 **My task status** — check your current applications\n"
            "• 🏆 **Leaderboard** — see your points and ranking\n"
            "• 📍 **Task location** — ask about a specific city or task\n"
            "• 🎓 **Certificates** — info about your earned certificates\n\n"
            "Just type your question naturally!"
        )

    # ── Certificates ───────────────────────────────────────────────────
    if any(k in t for k in ["certificate", "cert", "download"]):
        return "Visit your **Profile → Certificates** page to view and download all your earned certificates. 🎓"

    # ── Location / map ────────────────────────────────────────────────
    if any(k in t for k in ["location", "map", "near me", "city", "where"]):
        tasks = db.query(Task).filter(Task.status == "open", Task.location_name.isnot(None)).limit(5).all()
        if not tasks:
            return "No location-specific tasks are open right now. Some tasks are remote — check the Dashboard!"
        lines = [f"• **{t.title}** — 📍 {t.location_name}" for t in tasks]
        return "Tasks with locations:\n\n" + "\n".join(lines)

    # ── Greeting ───────────────────────────────────────────────────────
    if any(k in t for k in ["hi", "hello", "hey", "good morning", "good evening"]):
        return f"Hello {user.full_name}! 👋 How can I assist you today? Type **help** to see what I can do."

    # ── Fallback ───────────────────────────────────────────────────────
    return (
        "I'm not sure I understand that. Try asking about:\n"
        "• Available tasks\n• My task status\n• Leaderboard & points\n• Certificates\n\n"
        "Type **help** for a full list of things I can do!"
    )

    # ── DIALOGFLOW / CLOUD AI HOOK ────────────────────────────────────
    # To integrate Dialogflow ES/CX, replace the fallback above with:
    #   from google.cloud import dialogflow_v2 as dialogflow
    #   session_client = dialogflow.SessionsClient()
    #   session = session_client.session_path(PROJECT_ID, session_id)
    #   text_input = dialogflow.TextInput(text=message, language_code="en")
    #   query_input = dialogflow.QueryInput(text=text_input)
    #   response = session_client.detect_intent(session=session, query_input=query_input)
    #   return response.query_result.fulfillment_text


@router.post("")
def chat(req: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reply = resolve_intent(req.message, current_user, db)
    return {"reply": reply, "intent": "resolved"}
