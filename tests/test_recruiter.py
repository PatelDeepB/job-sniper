from backend.app.schemas.sniper import RecruiterOutreachRequest
from backend.app.services.recruiter_matcher import RecruiterMatcherService


def test_recruiter_matcher_generates_compliant_inmail():
    request = RecruiterOutreachRequest(
        candidate_name="Jane Doe",
        job_title="Staff Backend Engineer",
        company_name="Airbnb",
        top_skills=["FastAPI", "Distributed Systems"],
        recruiter_name="Sarah",
    )

    response = RecruiterMatcherService.generate_outreach(request)

    assert response.character_count <= 300
    assert "Sarah" in response.message_body
    assert "Airbnb" in response.message_body
    assert "FastAPI" in response.message_body
    assert "linkedin.com/search" in response.linkedin_search_url


def test_recruiter_matcher_handles_missing_recruiter_name():
    request = RecruiterOutreachRequest(
        candidate_name="Jane Doe",
        job_title="Software Engineer",
        company_name="Google",
        top_skills=["Python"],
        recruiter_name=None,
    )

    response = RecruiterMatcherService.generate_outreach(request)

    assert response.character_count <= 300
    assert "Hi there" in response.message_body
