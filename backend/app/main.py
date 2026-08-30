from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, dashboard

app = FastAPI(
    title="DRISHTI API",
    description="Backend for the DoSJE Smart Real-Time Monitoring & Inspection App",
    version="0.1.0",
)

# During the hackathon, allow all origins so the mobile app / dashboard can call this
# freely from any dev machine. Lock this down to specific domains before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "drishti-backend"}
