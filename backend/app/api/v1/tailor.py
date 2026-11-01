from fastapi import APIRouter, Response, status

from backend.app.schemas.tailor import TailorRequest, TailorResponse
from backend.app.services.pdf_compiler import PDFResumeCompiler
from backend.app.services.resume_tailorer import ResumeTailorer

router = APIRouter(prefix="/tailor", tags=["Resume Tailoring"])


@router.post("/analyze", response_model=TailorResponse, status_code=status.HTTP_200_OK)
async def analyze_and_tailor_resume(request: TailorRequest) -> TailorResponse:
    """Analyze job description and restructure master resume to achieve 90%+ ATS match."""
    return ResumeTailorer.tailor(request)


@router.post("/pdf", status_code=status.HTTP_200_OK)
async def compile_tailored_pdf(request: TailorRequest) -> Response:
    """Compile an ATS-parsable vector PDF resume customized for the target job."""
    tailor_result = ResumeTailorer.tailor(request)
    pdf_bytes = PDFResumeCompiler.compile_pdf(request.master_resume, tailor_result)

    safe_company_name = request.company_name.lower().replace(" ", "_")
    filename = f"Resume_{safe_company_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
