import pytest

from backend.app.schemas.sniper import RecruiterOutreachRequest
from backend.app.schemas.tailor import TailorRequest
from backend.app.services.feed_monitor import FeedMonitorService
from backend.app.services.pdf_compiler import PDFResumeCompiler
from backend.app.services.recruiter_matcher import RecruiterMatcherService
from backend.app.services.resume_tailorer import ResumeTailorer
from tests.test_tailor import sample_master_resume  # noqa: F401


@pytest.mark.asyncio
async def test_complete_e2e_sniper_and_tailor_flow(sample_master_resume):  # noqa: F811
    # Arrange: Poll for newly posted jobs
    feed = await FeedMonitorService.fetch_fresh_feed(max_age_minutes=60)
    assert feed.total_jobs > 0
    target_job = feed.items[0]

    # Act 1: Tailor master resume for the sniped job
    tailor_request = TailorRequest(
        job_title=target_job.title,
        company_name=target_job.company_name,
        job_description=f"We are hiring a {target_job.title} proficient in Python, Docker, and FastAPI.",
        master_resume=sample_master_resume,
    )
    tailored_response = ResumeTailorer.tailor(tailor_request)

    # Assert 1: Validate ATS match score and reordering
    assert tailored_response.ats_match_score >= 70
    assert len(tailored_response.optimized_bullets) == len(sample_master_resume.experience_bullets)

    # Act 2: Generate recruiter warm-touch InMail note
    outreach_request = RecruiterOutreachRequest(
        candidate_name=sample_master_resume.full_name,
        job_title=target_job.title,
        company_name=target_job.company_name,
        top_skills=tailored_response.matched_keywords,
        recruiter_name="Alex",
    )
    outreach_response = RecruiterMatcherService.generate_outreach(outreach_request)

    # Assert 2: Strictly compliant with LinkedIn 300-char free connection limit
    assert outreach_response.character_count <= 300
    assert "Alex" in outreach_response.message_body
    assert "linkedin.com/search" in outreach_response.linkedin_search_url

    # Act 3: Compile vector PDF
    pdf_bytes = PDFResumeCompiler.compile_pdf(sample_master_resume, tailored_response)

    # Assert 3: Valid vector PDF stream
    assert pdf_bytes.startswith(b"%PDF-")
    assert len(pdf_bytes) > 500
