import json
import os
import firebase_admin
from firebase_admin import credentials, firestore, messaging

from datetime import datetime, timezone

# Load credentials from environment or a service account file
# For local dev, we might use a stub if credentials aren't provided
_db = None

def init_firebase():
    global _db
    try:
        # Check if already initialized
        firebase_admin.get_app()
    except ValueError:
        # Not initialized
        cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _db = firestore.client()
        else:
            print("[FirebaseService] Warning: No service account found. Firestore sync disabled.")

def sync_task_status(task_id: int, volunteer_id: int, status: str, history: list):
    """
    Pushes task status and history to Firestore for real-time tracking.
    Collection: task_tracking
    Doc ID: {taskId}_{volunteerId}
    """
    if _db is None:
        init_firebase()
    
    if _db is None:
        return

    doc_id = f"{task_id}_{volunteer_id}"
    doc_ref = _db.collection("task_tracking").document(doc_id)
    
    doc_ref.set({
        "taskId": task_id,
        "volunteerId": volunteer_id,
        "status": status,
        "history": history,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    })

def send_fcm_notification(token: str, title: str, body: str, data: dict = None):
    """
    Sends a push notification to a specific device token.
    """
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )
        response = messaging.send(message)
        print(f"[FCM] Successfully sent message: {response}")
    except Exception as e:
        print(f"[FCM] Error sending message: {e}")

