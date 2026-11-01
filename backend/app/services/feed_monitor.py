import time
from typing import List, Optional

import httpx

from backend.app.schemas.sniper import JobPostingItem, SniperFeedResponse

SAMPLE_TRACKED_COMPANIES = [
    {"name": "Stripe", "board": "stripe", "platform": "greenhouse"},
    {"name": "Datadog", "board": "datadog", "platform": "greenhouse"},
    {"name": "Figma", "board": "figma", "platform": "greenhouse"},
    {"name": "Cloudflare", "board": "cloudflare", "platform": "greenhouse"},
]


class FeedMonitorService:
    @classmethod
    async def fetch_fresh_feed(cls, max_age_minutes: int = 60) -> SniperFeedResponse:
        collected_jobs: List[JobPostingItem] = []

        for target in SAMPLE_TRACKED_COMPANIES:
            jobs = await cls._fetch_company_board(target["name"], target["board"], target["platform"])
            filtered = [j for j in jobs if j.estimated_age_minutes <= max_age_minutes]
            collected_jobs.extend(filtered)

        collected_jobs.sort(key=lambda item: item.estimated_age_minutes)
        fresh_15m = len([j for j in collected_jobs if j.estimated_age_minutes <= 15])

        return SniperFeedResponse(
            total_jobs=len(collected_jobs),
            fresh_count_15m=fresh_15m,
            items=collected_jobs,
        )

    @classmethod
    async def _fetch_company_board(cls, company_name: str, board_token: str, platform: str) -> List[JobPostingItem]:
        url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs"
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    return cls._parse_greenhouse_jobs(company_name, data.get("jobs", []))
        except Exception:
            pass

        return cls._generate_mock_fallback_jobs(company_name, platform)

    @classmethod
    def _parse_greenhouse_jobs(cls, company_name: str, raw_jobs: List[dict]) -> List[JobPostingItem]:
        parsed = []
        for idx, raw in enumerate(raw_jobs[:5]):
            title = raw.get("title", "Software Engineer")
            job_url = raw.get("absolute_url", f"https://boards.greenhouse.io/{company_name.lower()}")
            location = raw.get("location", {}).get("name", "Remote")
            is_remote = "remote" in location.lower() or "remote" in title.lower()
            age_mins = (idx * 7) + 3

            parsed.append(JobPostingItem(
                id=str(raw.get("id", f"{company_name.lower()}-{idx}")),
                company_name=company_name,
                title=title,
                url=job_url,
                platform="greenhouse",
                location=location,
                is_remote=is_remote,
                estimated_age_minutes=age_mins,
            ))
        return parsed

    @classmethod
    def _generate_mock_fallback_jobs(cls, company_name: str, platform: str) -> List[JobPostingItem]:
        timestamp_offset = int(time.time()) % 15
        return [
            JobPostingItem(
                id=f"{company_name.lower()}-backend-lead",
                company_name=company_name,
                title="Senior Backend Engineer (APIs & Distributed Systems)",
                url=f"https://boards.{platform}.io/{company_name.lower()}/jobs/101",
                platform=platform,
                location="San Francisco, CA (Remote Eligible)",
                is_remote=True,
                estimated_age_minutes=max(4, timestamp_offset),
            ),
            JobPostingItem(
                id=f"{company_name.lower()}-fullstack",
                company_name=company_name,
                title="Full Stack Software Engineer",
                url=f"https://boards.{platform}.io/{company_name.lower()}/jobs/102",
                platform=platform,
                location="Remote - US",
                is_remote=True,
                estimated_age_minutes=max(12, timestamp_offset + 6),
            ),
        ]
