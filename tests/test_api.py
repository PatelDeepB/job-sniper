from fastapi.testclient import TestClient

from backend.app.main import app
from tests.test_tailor import sample_master_resume  # noqa: F401

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_analyze_resume_endpoint(sample_master_resume):  # noqa: F811
    payload = {
        "job_title": "Python Engineer",
        "company_name": "Datadog",
        "job_description": "We are seeking a Python and Docker engineer.",
        "master_resume": sample_master_resume.model_dump(),
    }
    response = client.post("/api/v1/tailor/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["company_name"] == "Datadog"
    assert data["ats_match_score"] >= 70
    assert "docker" in data["matched_keywords"]
