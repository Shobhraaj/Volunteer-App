import os
from google.cloud import bigquery
from datetime import datetime, timezone

# Initialize BigQuery client if credentials are provided
_client = None

def init_bigquery():
    global _client
    try:
        # Check for service account path
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            _client = bigquery.Client()
        else:
            print("[BigQueryService] Warning: No credentials found. Streaming disabled.")
    except Exception as e:
        print(f"[BigQueryService] Error initializing: {e}")

def stream_task_event(task_id: int, volunteer_id: int, status: str):
    """
    Streams a task status event to BigQuery for Looker Studio analytics.
    Dataset: volunteer_analytics
    Table: task_lifecycle_events
    """
    if _client is None:
        init_bigquery()
    
    if _client is None:
        return

    table_id = os.getenv("BQ_TABLE_ID", "your-project.volunteer_analytics.task_lifecycle_events")
    
    rows_to_insert = [
        {
            "task_id": task_id,
            "volunteer_id": volunteer_id,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    ]

    try:
        errors = _client.insert_rows_json(table_id, rows_to_insert)
        if errors == []:
            print("[BigQuery] New rows have been added.")
        else:
            print(f"[BigQuery] Errors encountered: {errors}")
    except Exception as e:
        print(f"[BigQuery] Failed to stream data: {e}")
