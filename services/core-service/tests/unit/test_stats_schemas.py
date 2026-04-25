from datetime import UTC, datetime

from app.presentation.schemas import StatsHistoryItem, StatsSummary


def test_stats_summary_serializes_last_activity_at_as_utc_iso8601() -> None:
    payload = StatsSummary(
        total_tests=4,
        passed_tests=3,
        failed_tests=1,
        accuracy_pct=82.5,
        pass_rate_pct=75.0,
        average_score=82.5,
        current_streak_days=2,
        best_streak_days=4,
        last_activity_at=datetime(2026, 4, 25, 10, 30, 0),
        average_time_seconds=420.0,
        total_time_seconds=1680,
    )

    assert payload.model_dump(mode="json")["last_activity_at"] == "2026-04-25T10:30:00Z"


def test_stats_history_item_serializes_created_at_as_utc_iso8601() -> None:
    item = StatsHistoryItem(
        test_id=9,
        created_at=datetime(2026, 4, 19, 8, 15, 0, tzinfo=UTC),
        passed=True,
        score=90,
        correct_count=27,
        wrong_count=3,
        accuracy_pct=90.0,
        permit_code="B",
        topic_id=None,
        test_type="RANDOM",
    )

    assert item.model_dump(mode="json")["created_at"] == "2026-04-19T08:15:00Z"
