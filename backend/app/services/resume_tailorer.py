from typing import List, Set, Tuple

from backend.app.schemas.tailor import (
    ExperienceBulletModel,
    MasterResumeInput,
    TailorRequest,
    TailorResponse,
)
from backend.app.services.keyword_extractor import KeywordExtractor


class ResumeTailorer:
    @classmethod
    def tailor(cls, request: TailorRequest) -> TailorResponse:
        jd_keywords = set(KeywordExtractor.extract_keywords(request.job_description))
        resume_keywords = set(KeywordExtractor.extract_keywords(
            f"{request.master_resume.headline} {request.master_resume.summary} "
            f"{' '.join(request.master_resume.all_skills)}"
        ))

        matched_keywords = sorted(list(jd_keywords.intersection(resume_keywords)))
        missing_keywords = sorted(list(jd_keywords.difference(resume_keywords)))

        score = cls._calculate_ats_score(jd_keywords, matched_keywords)
        optimized_bullets = cls._optimize_bullets(request.master_resume.experience_bullets, jd_keywords)
        tailored_headline = cls._build_headline(request.job_title, matched_keywords)
        tailored_summary = cls._build_summary(request.master_resume.summary, matched_keywords)

        return TailorResponse(
            job_title=request.job_title,
            company_name=request.company_name,
            ats_match_score=score,
            matched_keywords=matched_keywords,
            missing_keywords=missing_keywords,
            tailored_headline=tailored_headline,
            tailored_summary=tailored_summary,
            optimized_bullets=optimized_bullets,
            pdf_download_url=f"/api/v1/tailor/download/{request.company_name.lower().replace(' ', '-')}"
        )

    @classmethod
    def _calculate_ats_score(cls, jd_keywords: Set[str], matched_keywords: List[str]) -> int:
        if not jd_keywords:
            return 85
        ratio = len(matched_keywords) / len(jd_keywords)
        scaled_score = int(min(100, max(45, ratio * 100 + 20)))
        return scaled_score

    @classmethod
    def _optimize_bullets(
        cls, bullets: List[ExperienceBulletModel], target_keywords: Set[str]
    ) -> List[ExperienceBulletModel]:
        scored_bullets: List[Tuple[int, ExperienceBulletModel]] = []
        for bullet in bullets:
            bullet_keywords = set(KeywordExtractor.extract_keywords(
                f"{bullet.bullet_point} {' '.join(bullet.associated_skills)}"
            ))
            matches_count = len(target_keywords.intersection(bullet_keywords))
            scored_bullets.append((matches_count, bullet))

        scored_bullets.sort(key=lambda item: item[0], reverse=True)
        return [item[1] for item in scored_bullets]

    @classmethod
    def _build_headline(cls, job_title: str, matched_keywords: List[str]) -> str:
        highlighted = ", ".join(matched_keywords[:3]).title() if matched_keywords else "Full Stack"
        return f"{job_title} | Specializing in {highlighted}"

    @classmethod
    def _build_summary(cls, base_summary: str, matched_keywords: List[str]) -> str:
        if not matched_keywords:
            return base_summary
        highlight_text = ", ".join(matched_keywords[:5])
        return f"{base_summary} Core technical competencies aligned with {highlight_text}."
