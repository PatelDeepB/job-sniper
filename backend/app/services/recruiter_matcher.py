import urllib.parse
from typing import List, Optional

from backend.app.schemas.sniper import RecruiterOutreachRequest, RecruiterOutreachResponse


class RecruiterMatcherService:
    @classmethod
    def generate_outreach(cls, request: RecruiterOutreachRequest) -> RecruiterOutreachResponse:
        search_query = f"{request.company_name} recruiter {request.job_title}"
        encoded_query = urllib.parse.quote(search_query)
        linkedin_url = f"https://www.linkedin.com/search/results/people/?keywords={encoded_query}"

        recipient = request.recruiter_name or "there"
        skill_highlight = request.top_skills[0] if request.top_skills else "distributed systems"

        # Strictly crafted to stay under the 300-character LinkedIn free connection limit
        message_body = (
            f"Hi {recipient}, saw you posted {request.job_title} at {request.company_name}. "
            f"Just submitted my application highlighting my experience in {skill_highlight}. "
            f"Would love to connect and follow your team's roadmap! Best, {request.candidate_name}"
        )

        if len(message_body) > 300:
            message_body = message_body[:296] + "..."

        subject = f"Application follow-up: {request.job_title} - {request.candidate_name}"

        return RecruiterOutreachResponse(
            linkedin_search_url=linkedin_url,
            suggested_subject=subject,
            message_body=message_body,
            character_count=len(message_body),
        )
