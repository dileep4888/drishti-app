from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routes.auth import router as auth_router
from .routes.dashboard_api import router as dashboard_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DRISHTI AI",
    description="Digital Real-time Intelligent Surveillance, Tracking & Inspection System",
    version="1.0.0",
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
