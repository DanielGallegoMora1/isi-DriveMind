from __future__ import annotations

import random
import sys
import unittest
from collections import Counter
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = CURRENT_DIR.parent

if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from scripts import seed_stats_history


class SeedStatsHistoryHelpersTests(unittest.TestCase):
    def test_choose_mode_falls_back_when_failed_or_topic_are_not_safe(self) -> None:
        rng = random.Random(7)

        mode, topic_id = seed_stats_history.choose_mode(
            attempt_index=2,
            question_count=30,
            eligible_topic_ids=[],
            failed_history_count=3,
            rng=rng,
        )

        self.assertEqual(mode, "PERMIT")
        self.assertIsNone(topic_id)

    def test_build_answers_payload_hits_exact_wrong_count_and_only_uses_valid_labels(self) -> None:
        rng = random.Random(11)
        questions = [
            seed_stats_history.QuestionSnapshot(1, 10, "a", ("a", "b", "c")),
            seed_stats_history.QuestionSnapshot(2, 10, "b", ("a", "b", "c")),
            seed_stats_history.QuestionSnapshot(3, 20, "c", ("a", "b", "c")),
            seed_stats_history.QuestionSnapshot(4, 20, "a", ("a", "b", "c")),
        ]

        answers = seed_stats_history.build_answers_payload(
            questions=questions,
            desired_wrong_count=2,
            weak_topic_ids={10},
            rng=rng,
        )

        answers_by_question = {item["question_id"]: item["selected_label"] for item in answers}
        wrong_count = sum(
            1 for question in questions if answers_by_question[question.question_id] != question.correct_label
        )

        self.assertEqual(len(answers), len(questions))
        self.assertEqual(wrong_count, 2)
        for question in questions:
            self.assertIn(answers_by_question[question.question_id], question.option_labels)

    def test_build_schedule_spreads_attempts_and_backdates_answers(self) -> None:
        rng = random.Random(2026)

        schedule = seed_stats_history.build_schedule(
            attempts=8,
            start_date=date(2026, 4, 19),
            end_date=date(2026, 4, 26),
            question_count=30,
            eligible_topic_ids=[101, 102],
            initial_failed_history_count=0,
            rng=rng,
        )

        self.assertEqual(len(schedule), 8)
        finished_dates = [item.finished_at.date() for item in schedule]
        self.assertEqual(finished_dates, sorted(finished_dates))
        self.assertGreaterEqual((finished_dates[-1] - finished_dates[0]).days, 7)
        for item in schedule:
            self.assertEqual(len(item.answer_timestamps), 30)
            self.assertLess(item.test_created_at, item.started_at)
            self.assertLess(item.started_at, item.finished_at)
            self.assertLessEqual(item.answer_timestamps[-1], item.finished_at)
            self.assertGreaterEqual(item.desired_wrong_count, 0)

    def test_generate_finished_times_cover_full_explicit_range_when_attempts_match_days(self) -> None:
        rng = random.Random(99)

        finished_times = seed_stats_history.generate_finished_times(
            start_date=date(2026, 4, 19),
            end_date=date(2026, 4, 26),
            attempts=8,
            rng=rng,
        )

        finished_dates = [item.date() for item in finished_times]
        self.assertEqual(len(finished_dates), len(set(finished_dates)))
        self.assertEqual(finished_dates[0], date(2026, 4, 19))
        self.assertEqual(finished_dates[-1], date(2026, 4, 26))

    def test_generate_finished_times_still_spread_when_attempts_are_less_than_days(self) -> None:
        rng = random.Random(17)

        finished_times = seed_stats_history.generate_finished_times(
            start_date=date(2026, 4, 19),
            end_date=date(2026, 4, 26),
            attempts=4,
            rng=rng,
        )

        finished_dates = [item.date() for item in finished_times]
        self.assertEqual(finished_dates, sorted(finished_dates))
        self.assertEqual(len(finished_dates), len(set(finished_dates)))
        self.assertEqual(finished_dates[0], date(2026, 4, 19))
        self.assertEqual(finished_dates[-1], date(2026, 4, 26))

    def test_parse_args_defaults_to_april_19_through_26_window(self) -> None:
        config = seed_stats_history.parse_args(["--email", "student@example.com", "--password", "secret"])

        self.assertEqual(config.start_date, date(2026, 4, 19))
        self.assertEqual(config.end_date, date(2026, 4, 26))
        self.assertEqual(config.attempts, 32)

    def test_parse_args_accepts_explicit_date_range(self) -> None:
        config = seed_stats_history.parse_args(
            [
                "--email",
                "student@example.com",
                "--password",
                "secret",
                "--start-date",
                "2026-04-19",
                "--end-date",
                "2026-04-26",
            ]
        )

        self.assertEqual(config.start_date, date(2026, 4, 19))
        self.assertEqual(config.end_date, date(2026, 4, 26))

    def test_build_answer_timestamps_are_monotonic(self) -> None:
        started_at = datetime(2026, 4, 1, 10, 0, tzinfo=UTC)
        finished_at = started_at + timedelta(minutes=15)

        timestamps = seed_stats_history.build_answer_timestamps(started_at, finished_at, 5)

        self.assertEqual(len(timestamps), 5)
        self.assertTrue(all(left <= right for left, right in zip(timestamps, timestamps[1:])))
        self.assertGreaterEqual(timestamps[0], started_at)
        self.assertLessEqual(timestamps[-1], finished_at)

    def test_generate_finished_times_create_irregular_clusters_when_attempts_exceed_days(self) -> None:
        rng = random.Random(20260425)

        finished_times = seed_stats_history.generate_finished_times(
            start_date=date(2026, 4, 19),
            end_date=date(2026, 4, 26),
            attempts=32,
            rng=rng,
        )

        finished_dates = [item.date() for item in finished_times]
        per_day_counts = Counter(finished_dates)

        self.assertEqual(len(finished_times), 32)
        self.assertEqual(finished_dates[0], date(2026, 4, 19))
        self.assertEqual(finished_dates[-1], date(2026, 4, 26))
        self.assertEqual(len(per_day_counts), 8)
        self.assertGreater(max(per_day_counts.values()), min(per_day_counts.values()))
        self.assertGreaterEqual(max(per_day_counts.values()), 5)

    def test_backdate_test_rows_commits_outer_transaction(self) -> None:
        class FakeCursor:
            def __init__(self) -> None:
                self.rowcount = 0
                self.executemany_calls: list[tuple[str, list[tuple[datetime, int]]]] = []

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb) -> None:
                return None

            def execute(self, query: str, params: tuple) -> None:
                normalized = " ".join(query.split())
                if normalized.startswith("UPDATE tests SET created_at"):
                    self.rowcount = 1
                    return
                if normalized.startswith("UPDATE test_attempts SET started_at"):
                    self._fetchone = (321,)
                    return
                if normalized.startswith("SELECT id FROM attempt_answers"):
                    self._fetchall = [(11,), (12,)]
                    return
                raise AssertionError(f"Unexpected query: {normalized}")

            def fetchone(self):
                return self._fetchone

            def fetchall(self):
                return self._fetchall

            def executemany(self, query: str, params_list: list[tuple[datetime, int]]) -> None:
                self.executemany_calls.append((query, params_list))

        class FakeConnection:
            def __init__(self) -> None:
                self.cursor_instance = FakeCursor()
                self.commits = 0
                self.rollbacks = 0

            def cursor(self):
                return self.cursor_instance

            def commit(self) -> None:
                self.commits += 1

            def rollback(self) -> None:
                self.rollbacks += 1

        connection = FakeConnection()
        test_created_at = datetime(2026, 4, 19, 8, 0, tzinfo=UTC)
        started_at = datetime(2026, 4, 19, 8, 5, tzinfo=UTC)
        finished_at = datetime(2026, 4, 19, 8, 20, tzinfo=UTC)
        answer_timestamps = (
            datetime(2026, 4, 19, 8, 10, tzinfo=UTC),
            datetime(2026, 4, 19, 8, 15, tzinfo=UTC),
        )

        attempt_id = seed_stats_history.backdate_test_rows(
            connection,
            user_id="student-id",
            test_id=99,
            test_created_at=test_created_at,
            started_at=started_at,
            finished_at=finished_at,
            answer_timestamps=answer_timestamps,
        )

        self.assertEqual(attempt_id, 321)
        self.assertEqual(connection.commits, 1)
        self.assertEqual(connection.rollbacks, 0)
        self.assertEqual(len(connection.cursor_instance.executemany_calls), 1)


if __name__ == "__main__":
    unittest.main()
