from backend.app.schemas.tailor import MasterResumeInput, TailorRequest
from backend.app.services.pdf_compiler import PDFResumeCompiler
from backend.app.services.resume_tailorer import ResumeTailorer
from tests.test_tailor import sample_master_resume  # noqa: F401


def test_pdf_compiler_produces_valid_pdf_stream(sample_master_resume):  # noqa: F811
    request = TailorRequest(
        job_title="Backend Engineer",
        company_name="Stripe",
        job_description="Seeking a FastAPI and PostgreSQL expert.",
        master_resume=sample_master_resume,
    )

    tailor_result = ResumeTailorer.tailor(request)
    pdf_bytes = PDFResumeCompiler.compile_pdf(sample_master_resume, tailor_result)

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF-")
