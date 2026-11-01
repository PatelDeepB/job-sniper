from typing import List, Optional
from pydantic import BaseModel, Field


class ExperienceBulletModel(BaseModel):
    id: str
    company: str
    role_title: str
    bullet_point: str
    associated_skills: List[str] = Field(default_factory=list)


class MasterResumeInput(BaseModel):
    full_name: str
    email: str
    phone: str
    location: str
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    headline: str
    summary: str
    all_skills: List[str]
    experience_bullets: List[ExperienceBulletModel]


class TailorRequest(BaseModel):
    job_title: str
    company_name: str
    job_description: str
    master_resume: MasterResumeInput


class ATSKeywordMatch(BaseModel):
    keyword: str
    matched: bool
    relevance_score: float


class TailorResponse(BaseModel):
    job_title: str
    company_name: str
    ats_match_score: int = Field(ge=0, le=100)
    matched_keywords: List[str]
    missing_keywords: List[str]
    tailored_headline: str
    tailored_summary: str
    optimized_bullets: List[ExperienceBulletModel]
    pdf_download_url: Optional[str] = None
