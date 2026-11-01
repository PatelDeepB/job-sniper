import pytest

from backend.app.services.feed_monitor import FeedMonitorService


@pytest.mark.asyncio
async def test_feed_monitor_returns_fresh_jobs():
    response = await FeedMonitorService.fetch_fresh_feed(max_age_minutes=60)

    assert response.total_jobs > 0
    assert response.fresh_count_15m >= 0
    first_item = response.items[0]
    assert first_item.estimated_age_minutes <= 60
    assert first_item.company_name in ["Stripe", "Datadog", "Figma", "Cloudflare"]
