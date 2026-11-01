from typing import Optional

from backend.app.schemas.llm import LLMProviderConfig, LLMProviderType
from backend.app.services.llm.base import LLMResponse
from backend.app.services.llm.factory import get_provider

COVER_LETTER_SYSTEM_PROMPT = """You are an expert career coach writing concise, authentic job application answers.
Your writing is direct, confident, and free of clichés. Never start with "I am excited" or "I am passionate".
Match the tone of a senior professional. Keep all responses under the specified token limit."""


class OpenTextAnswerService:
    """
    Generates AI answers for open-ended job application questions
    using the user's chosen LLM provider.
    """

    @classmethod
    async def answer_open_question(
        cls,
        question: str,
        job_title: str,
        company_name: str,
        candidate_skills: list[str],
        candidate_summary: str,
        provider_config: LLMProviderConfig,
        max_tokens: int = 250,
    ) -> LLMResponse:
        """
        Generate a tailored, authentic answer to an open-ended ATS question.

        Args:
            question: The exact question text from the job application form.
            job_title: Target job title (e.g., "Senior Backend Engineer").
            company_name: Hiring company name (e.g., "Stripe").
            candidate_skills: List of the candidate's core skills.
            candidate_summary: Short professional summary from the master profile.
            provider_config: LLM provider selection and API key from the extension.
            max_tokens: Maximum response length in tokens.

        Returns:
            LLMResponse with the generated answer text and provider metadata.
        """
        provider = get_provider(provider_config.provider)

        skills_text = ", ".join(candidate_skills[:8])
        user_prompt = (
            f"Write a professional answer to this job application question:\n\n"
            f"Question: {question}\n\n"
            f"Context:\n"
            f"- Target Role: {job_title} at {company_name}\n"
            f"- My Background: {candidate_summary}\n"
            f"- My Key Skills: {skills_text}\n\n"
            f"Answer in 2 to 3 sentences maximum. Be specific and authentic. "
            f"Do not use generic phrases like 'I am passionate' or 'I am excited to apply'."
        )

        return await provider.generate(
            system_prompt=COVER_LETTER_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            api_key=provider_config.api_key,
            max_tokens=max_tokens,
            custom_model_id=provider_config.custom_model_id,
        )

    @classmethod
    async def generate_cover_letter_paragraph(
        cls,
        job_title: str,
        company_name: str,
        job_description_snippet: str,
        candidate_summary: str,
        top_matched_keywords: list[str],
        provider_config: LLMProviderConfig,
    ) -> LLMResponse:
        """
        Generate a single strong cover letter paragraph tailored to the specific job.

        Args:
            job_title: Target role title.
            company_name: Target company name.
            job_description_snippet: Key requirements extracted from the job description.
            candidate_summary: Master resume professional summary.
            top_matched_keywords: Top 5 ATS-matched keywords for this role.
            provider_config: LLM provider selection and API key.

        Returns:
            LLMResponse with the generated cover letter paragraph.
        """
        provider = get_provider(provider_config.provider)

        keywords_text = ", ".join(top_matched_keywords[:5])
        user_prompt = (
            f"Write a single powerful cover letter opening paragraph (3 sentences max) for:\n\n"
            f"Role: {job_title} at {company_name}\n"
            f"Key Requirements: {job_description_snippet[:500]}\n"
            f"My Background: {candidate_summary}\n"
            f"My Strongest Matching Skills: {keywords_text}\n\n"
            f"Be direct, specific, and avoid generic opener phrases. "
            f"Reference the company or role specifically in the first sentence."
        )

        return await provider.generate(
            system_prompt=COVER_LETTER_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            api_key=provider_config.api_key,
            max_tokens=200,
            custom_model_id=provider_config.custom_model_id,
        )
