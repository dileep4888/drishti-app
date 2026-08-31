import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import get_firestore
from .routes.auth import router as auth_router
from .routes.dashboard_api import router as dashboard_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app):
    # On startup: seed Firestore with demo data if empty
    try:
        db = get_firestore()
        existing_users = list(db.collection("users").limit(1).stream())
        if not existing_users:
            logger.info("Seeding demo data into Firestore...")
            from .seed import seed
            seed()
            logger.info("Seed complete.")
        else:
            logger.info("Firestore already has data, skipping seed.")
    except Exception as e:
        logger.warning(f"Firestore startup check failed: {e}")
        logger.info("Continuing without seed — add FIREBASE_CREDENTIALS env var.")

    yield


app = FastAPI(
    title="DRISHTI AI",
    description="Digital Real-time Intelligent Surveillance, Tracking & Inspection System",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for dev/demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {
        "name": "DRISHTI AI",
        "full_name": "Digital Real-time Intelligent Surveillance, Tracking & Inspection System",
        "version": "2.0.0",
        "backend": "Firebase Firestore",
        "docs": "/docs",
        "status": "operational",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "database": "firestore"}
