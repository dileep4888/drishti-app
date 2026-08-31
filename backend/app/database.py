"""Firebase Firestore database connection."""
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

_db = None


def get_firestore():
    """Initialize Firebase Admin SDK and return Firestore client."""
    global _db
    if _db is not None:
        return _db

    # Try loading from environment variable (JSON string)
    firebase_cred_json = os.getenv("FIREBASE_CREDENTIALS")
    if firebase_cred_json:
        try:
            cred_info = json.loads(firebase_cred_json)
            cred = credentials.Certificate(cred_info)
        except (json.JSONDecodeError, Exception):
            # Might be a file path
            cred = credentials.Certificate(firebase_cred_json)
    else:
        # Try local service account file
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        else:
            # Default credentials (for environments with ADC)
            cred = None

    if cred:
        firebase_admin.initialize_app(cred)
    else:
        firebase_admin.initialize_app()

    _db = firestore.client()
    return _db


def get_db():
    """Dependency for FastAPI routes — yields Firestore client."""
    db = get_firestore()
    try:
        yield db
    finally:
        pass  # Firestore client doesn't need explicit close
