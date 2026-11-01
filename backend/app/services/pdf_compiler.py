import io
from typing import List

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from backend.app.schemas.tailor import MasterResumeInput, TailorResponse


class PDFResumeCompiler:
    @classmethod
    def compile_pdf(cls, resume: MasterResumeInput, tailor_result: TailorResponse) -> bytes:
        pdf_buffer = io.BytesIO()
        document = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            leftMargin=0.5 * inch,
            rightMargin=0.5 * inch,
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch,
        )

        styles = getSampleStyleSheet()
        elements = []

        cls._add_header_section(elements, resume, styles)
        cls._add_summary_section(elements, tailor_result.tailored_summary, styles)
        cls._add_skills_section(elements, tailor_result.matched_keywords, resume.all_skills, styles)
        cls._add_experience_section(elements, tailor_result.optimized_bullets, styles)

        document.build(elements)
        pdf_bytes = pdf_buffer.getvalue()
        pdf_buffer.close()
        return pdf_bytes

    @classmethod
    def _add_header_section(cls, elements: List, resume: MasterResumeInput, styles) -> None:
        title_style = ParagraphStyle(
            "ResumeTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=18,
            alignment=1,
        )
        elements.append(Paragraph(resume.full_name, title_style))
        elements.append(Spacer(1, 4))

        contact_line = f"{resume.email} | {resume.phone} | {resume.location}"
        if resume.linkedin_url:
            contact_line += f" | {resume.linkedin_url}"
        contact_style = ParagraphStyle(
            "ResumeContact",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            alignment=1,
        )
        elements.append(Paragraph(contact_line, contact_style))
        elements.append(Spacer(1, 8))

    @classmethod
    def _add_summary_section(cls, elements: List, summary_text: str, styles) -> None:
        sec_style = ParagraphStyle("SecHeading", fontName="Helvetica-Bold", fontSize=10, leading=12)
        body_style = ParagraphStyle("SecBody", fontName="Helvetica", fontSize=8.5, leading=11)
        elements.append(Paragraph("<b>PROFESSIONAL SUMMARY</b>", sec_style))
        elements.append(Spacer(1, 2))
        elements.append(Paragraph(summary_text, body_style))
        elements.append(Spacer(1, 8))

    @classmethod
    def _add_skills_section(cls, elements: List, matched: List[str], all_skills: List[str], styles) -> None:
        sec_style = ParagraphStyle("SecHeading", fontName="Helvetica-Bold", fontSize=10, leading=12)
        body_style = ParagraphStyle("SecBody", fontName="Helvetica", fontSize=8.5, leading=11)
        skills_text = f"<b>Core Competencies:</b> {', '.join(matched or all_skills[:10])}"
        elements.append(Paragraph("<b>TECHNICAL EXPERTISE</b>", sec_style))
        elements.append(Spacer(1, 2))
        elements.append(Paragraph(skills_text, body_style))
        elements.append(Spacer(1, 8))

    @classmethod
    def _add_experience_section(cls, elements: List, bullets: List, styles) -> None:
        sec_style = ParagraphStyle("SecHeading", fontName="Helvetica-Bold", fontSize=10, leading=12)
        bullet_style = ParagraphStyle("Bullet", fontName="Helvetica", fontSize=8.5, leading=11, leftIndent=12)
        elements.append(Paragraph("<b>WORK EXPERIENCE</b>", sec_style))
        elements.append(Spacer(1, 2))

        for bullet in bullets[:6]:
            role_header = f"<b>{bullet.role_title}</b> - {bullet.company}"
            elements.append(Paragraph(role_header, sec_style))
            elements.append(Paragraph(f"• {bullet.bullet_point}", bullet_style))
            elements.append(Spacer(1, 4))
