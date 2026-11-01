import pytest

from backend.app.schemas.tailor import ExperienceBulletModel, MasterResumeInput, TailorRequest
from backend.app.services.keyword_extractor import KeywordExtractor
from backend.app.services.resume_tailorer import ResumeTailorer


@pytest.fixture
def sample_master_resume() -> MasterResumeInput:
    return MasterResumeInput(
        full_name="Jane Doe",
        email="jane.doe@example.com",
        phone="+1 555-0199",
        location="San Francisco, CA",
        linkedin_url="https://linkedin.com/in/janedoe",
        github_url="https://github.com/janedoe",
        headline="Senior Backend Engineer",
        summary="Experienced engineer building high-throughput distributed microservices.",
        all_skills=["Python", "FastAPI", "Docker", "Kubernetes", "PostgreSQL", "Redis", "AWS"],
        experience_bullets=[
            ExperienceBulletModel(
                id="b1",
                company="TechCorp",
                role_title="Backend Engineer",
                bullet_point="Architected REST APIs using FastAPI and PostgreSQL handling 5k req/sec.",
                associated_skills=["FastAPI", "PostgreSQL", "Python"],
            ),
            ExperienceBulletModel(
                id="b2",
                company="TechCorp",
                role_title="Backend Engineer",
                bullet_point="Containerized microservices with Docker and deployed on Kubernetes clusters.",
                associated_skills=["Docker", "Kubernetes"],
            ),
            ExperienceBulletModel(
                id="b3",
                company="CloudScale",
                role_title="Software Engineer",
                bullet_point="Managed caching pipelines using Redis and AWS ElastiCache.",
                associated_skills=["Redis", "AWS"],
            ),
        ],
    )


def test_keyword_extractor_normalizes_taxonomy():
    raw_jd = "Looking for a Python developer with k8s and react.js experience building microservices."
    keywords = KeywordExtractor.extract_keywords(raw_jd)

    assert "python" in keywords
    assert "kubernetes" in keywords
    assert "react" in keywords
    assert "microservices" in keywords


def test_resume_tailorer_calculates_high_ats_score(sample_master_resume):
    request = TailorRequest(
        job_title="Senior Python Engineer",
        company_name="Acme Inc",
        job_description="We need a Python and FastAPI engineer proficient in Docker and PostgreSQL.",
        master_resume=sample_master_resume,
    )

    response = ResumeTailorer.tailor(request)

    assert response.ats_match_score >= 80
    assert "fastapi" in response.matched_keywords
    assert "docker" in response.matched_keywords
    assert "postgresql" in response.matched_keywords


def test_resume_tailorer_reorders_relevant_bullets_to_top(sample_master_resume):
    request = TailorRequest(
        job_title="Container Infrastructure Engineer",
        company_name="CloudInfra",
        job_description="Specialist in Docker and Kubernetes orchestration on Linux systems.",
        master_resume=sample_master_resume,
    )

    response = ResumeTailorer.tailor(request)

    assert response.optimized_bullets[0].id == "b2"
    assert "Docker" in response.optimized_bullets[0].bullet_point
