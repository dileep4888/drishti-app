import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routes.auth import router as auth_router
from .routes.dashboard_api import router as dashboard_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app):
    # On startup: drop and recreate all tables to match current models,
    # then seed demo data. This handles schema drift between deploys.
    logger.info("Dropping and recreating all tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    logger.info("Tables created.")

    # Seed if empty
    from .database import SessionLocal
    from .models import User
    db = SessionLocal()
    try:
        if not db.query(User).first():
            logger.info("Seeding demo data...")
            from .seed import seed
            seed()
            logger.info("Seed complete.")
    finally:
        db.close()

    yield


app = FastAPI(
    title="DRISHTI AI",
    description="Digital Real-time Intelligent Surveillance, Tracking & Inspection System",
    version="1.0.0",
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
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
