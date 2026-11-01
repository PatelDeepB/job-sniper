from typing import List, Optional
from pydantic import BaseModel, Field


class JobPostingItem(BaseModel):
    id: str
    company_name: str
    title: str
    url: str
    platform: str
    location: str
    is_remote: bool
    estimated_age_minutes: int = Field(ge=0)


class SniperFeedResponse(BaseModel):
    total_jobs: int
    fresh_count_15m: int
    items: List[JobPostingItem]


class RecruiterOutreachRequest(BaseModel):
    candidate_name: str
    job_title: str
    company_name: str
    top_skills: List[str]
    recruiter_name: Optional[str] = None


class RecruiterOutreachResponse(BaseModel):
    linkedin_search_url: str
    suggested_subject: str
    message_body: str
    character_count: int = Field(le=300)
