from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1.tailor import router as tailor_router

app = FastAPI(
    title="JobSniper Cloud API",
    description="Autonomous AI career agent API: ATS keyword tailoring, real-time job sniping, and recruiter intelligence.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tailor_router, prefix="/api/v1")


@app.get("/health", tags=["System"])
async def health_check() -> dict:
    """Lightweight unauthenticated health check endpoint."""
    return {"status": "healthy", "service": "job-sniper-api", "version": "0.1.0"}
