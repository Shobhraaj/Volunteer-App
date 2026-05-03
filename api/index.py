import sys
import os

# Add the root directory to the path so we can import 'backend'
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, "backend"))

# Vercel environment fix for SQLite (read-only filesystem)
# We point it to /tmp if it's a local sqlite path
if os.environ.get("VERCEL"):
    os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL", "sqlite:////tmp/volunteer_platform.db")

from backend.main import app

# This is required for Vercel to find the FastAPI instance
# If the instance is named 'app', it will be picked up automatically.

