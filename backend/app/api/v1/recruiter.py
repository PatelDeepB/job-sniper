from fastapi import APIRouter, status

from backend.app.schemas.sniper import RecruiterOutreachRequest, RecruiterOutreachResponse
from backend.app.services.recruiter_matcher import RecruiterMatcherService

router = APIRouter(prefix="/recruiter", tags=["Recruiter Outreach"])


@router.post("/outreach", response_model=RecruiterOutreachResponse, status_code=status.HTTP_200_OK)
async def generate_recruiter_outreach(request: RecruiterOutreachRequest) -> RecruiterOutreachResponse:
    """Generate direct LinkedIn InMail connection text and search URL for hiring recruiters."""
    return RecruiterMatcherService.generate_outreach(request)
