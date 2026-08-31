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
    # On startup: recreate tables and seed if needed.
    from sqlalchemy import text
    from .database import SessionLocal
    from .models import User

    is_mysql = str(engine.url).startswith("mysql")

    with engine.begin() as conn:
        if is_mysql:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(text(f"DROP TABLE IF EXISTS {table.name}"))
        if is_mysql:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

    Base.metadata.create_all(bind=engine)
    logger.info("Tables created.")

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
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {
        "name": "DRISHTI AI",
        "full_name": "Digital Real-time Intelligent Surveillance, Tracking & Inspection System",
        "version": "2.0.0",
        "backend": "MySQL + SQLAlchemy",
        "docs": "/docs",
        "status": "operational",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "database": "mysql"}
