from fastapi import APIRouter, Query, status

from backend.app.schemas.sniper import SniperFeedResponse
from backend.app.services.feed_monitor import FeedMonitorService

router = APIRouter(prefix="/sniper", tags=["Job Sniper Feed"])


@router.get("/feed", response_model=SniperFeedResponse, status_code=status.HTTP_200_OK)
async def get_fresh_sniper_feed(
    max_age_minutes: int = Query(default=60, ge=1, le=1440, description="Max job age in minutes")
) -> SniperFeedResponse:
    """Fetch live public Greenhouse/Lever feeds filtered for newly posted jobs (<60m)."""
    return await FeedMonitorService.fetch_fresh_feed(max_age_minutes=max_age_minutes)
