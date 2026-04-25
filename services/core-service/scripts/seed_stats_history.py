#!/usr/bin/env python3
"""Seed backdated stats history for a real DriveMind user.

This script uses the real core-service flow (`generate` + `submit`) and then
backdates the persisted timestamps in PostgreSQL so `/stats` charts show
multiple weeks of activity.

Usage:
  - Docker Compose:
      docker compose run --rm core-service python scripts/seed_stats_history.py \
        --email student@example.com \
        --password Student123! \
        --permit-code B

  - Docker Compose with env vars:
      docker compose run --rm \
        -e STATS_SEED_EMAIL=student@example.com \
        -e STATS_SEED_PASSWORD=Student123! \
        -e STATS_SEED_PERMIT_CODE=B \
        core-service python scripts/seed_stats_history.py

  - Host (against compose-exposed ports):
      STATS_SEED_EMAIL=student@example.com \
      STATS_SEED_PASSWORD=Student123! \
      STATS_SEED_AUTH_BASE_URL=http://localhost:8001 \
      STATS_SEED_CORE_BASE_URL=http://localhost:8002 \
      DB_HOST=localhost DB_PORT=5432 DB_NAME=core_db DB_USER=core_user DB_PASSWORD=core_password \
      python scripts/seed_stats_history.py --permit-code B

Verification:
  - Unit tests only:
      python -m pytest tests/test_seed_stats_history.py

Safety notes:
  - Requires explicit user credentials.
  - Creates new tests/attempts only for the authenticated user.
  - Only backdates rows created during the current script run.
  - Uses `FAILED` mode only when there is enough failed-question history;
    otherwise it falls back to a safe mode.
"""

from __future__ import annotations

import argparse
import os
import random
import sys
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path
from typing import TYPE_CHECKING, Any
from urllib.parse import urljoin

import jwt

if TYPE_CHECKING:
    import httpx
else:  # pragma: no cover - import availability depends on runtime environment
    try:
        import httpx  # type: ignore[import-not-found]
    except ImportError:  # pragma: no cover - handled before runtime HTTP calls
        httpx = None

try:
    import psycopg  # type: ignore[import-not-found]
except ImportError:  # pragma: no cover - validated by runtime command
    psycopg = None


SERVICE_ROOT = Path(__file__).resolve().parent.parent
REQUIRED_DB_ENV = ("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD")
DEFAULT_AUTH_BASE_URL = "http://auth-service:8000"
DEFAULT_CORE_BASE_URL = "http://core-service:8000"
DEFAULT_DAYS = 21
DEFAULT_START_DATE = date(2026, 4, 19)
DEFAULT_END_DATE = date(2026, 4, 26)
DEFAULT_ATTEMPTS = 32
DEFAULT_COUNT = 30
MIN_FAILED_HISTORY = 12
PASSING_WRONG_RANGE = (0, 3)
FAILING_WRONG_RANGE = (4, 8)
MODE_SEQUENCE = ("PERMIT", "RANDOM", "TOPIC", "PERMIT", "RANDOM", "TOPIC")


class SeedStatsHistoryError(RuntimeError):
    """Raised when the stats history seeding flow cannot continue safely."""


@dataclass(frozen=True)
class ScriptConfig:
    email: str
    password: str
    permit_code: str | None
    auth_base_url: str
    core_base_url: str
    start_date: date
    end_date: date
    attempts: int
    question_count: int
    seed: int
    request_timeout_seconds: float


@dataclass(frozen=True)
class TopicInventory:
    topic_id: int
    topic_number: int
    name: str
    question_count: int


@dataclass(frozen=True)
class QuestionSnapshot:
    question_id: int
    topic_id: int
    correct_label: str
    option_labels: tuple[str, ...]


@dataclass(frozen=True)
class ScheduledAttempt:
    index: int
    mode: str
    topic_id: int | None
    desired_wrong_count: int
    test_created_at: datetime
    started_at: datetime
    finished_at: datetime
    answer_timestamps: tuple[datetime, ...]


@dataclass(frozen=True)
class TestSeedResult:
    test_id: int
    attempt_id: int
    mode: str
    topic_id: int | None
    correct_count: int
    wrong_count: int
    finished_at: datetime


def env_or_default(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip()
    return normalized or default


def parse_args(argv: list[str]) -> ScriptConfig:
    parser = argparse.ArgumentParser(description="Seed backdated stats history for a real DriveMind user.")
    parser.add_argument("--email", default=env_or_default("STATS_SEED_EMAIL"), help="User email.")
    parser.add_argument("--password", default=env_or_default("STATS_SEED_PASSWORD"), help="User password.")
    parser.add_argument(
        "--permit-code",
        default=env_or_default("STATS_SEED_PERMIT_CODE"),
        help="Permit code to use. If omitted, the first permit with enough questions is selected.",
    )
    parser.add_argument(
        "--auth-base-url",
        default=env_or_default("STATS_SEED_AUTH_BASE_URL", DEFAULT_AUTH_BASE_URL),
        help="Auth service base URL, without the /api/v1 suffix.",
    )
    parser.add_argument(
        "--core-base-url",
        default=env_or_default("STATS_SEED_CORE_BASE_URL", DEFAULT_CORE_BASE_URL),
        help="Core service base URL, without the /api/v1 suffix.",
    )
    parser.add_argument(
        "--start-date",
        default=env_or_default("STATS_SEED_START_DATE"),
        help=(
            "Inclusive ISO start date for backdated attempts (YYYY-MM-DD). "
            f"Default: {DEFAULT_START_DATE.isoformat()}."
        ),
    )
    parser.add_argument(
        "--end-date",
        default=env_or_default("STATS_SEED_END_DATE"),
        help=(
            "Inclusive ISO end date for backdated attempts (YYYY-MM-DD). "
            f"Default: {DEFAULT_END_DATE.isoformat()}."
        ),
    )
    parser.add_argument(
        "--days",
        type=int,
        default=int(env_or_default("STATS_SEED_DAYS") or 0) or None,
        help="Legacy relative window in days. Used only when --start-date/--end-date are omitted.",
    )
    parser.add_argument(
        "--attempts",
        type=int,
        default=int(env_or_default("STATS_SEED_ATTEMPTS", str(DEFAULT_ATTEMPTS)) or DEFAULT_ATTEMPTS),
    )
    parser.add_argument(
        "--question-count",
        type=int,
        default=int(env_or_default("STATS_SEED_QUESTION_COUNT", str(DEFAULT_COUNT)) or DEFAULT_COUNT),
        help="Questions per generated test. Default: 30.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=int(env_or_default("STATS_SEED_RANDOM_SEED", "20260425") or 20260425),
        help="Deterministic RNG seed.",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=float(env_or_default("STATS_SEED_TIMEOUT_SECONDS", "20") or 20.0),
        help="HTTP timeout in seconds.",
    )
    args = parser.parse_args(argv)

    if not args.email:
        raise SeedStatsHistoryError("missing user email; pass --email or STATS_SEED_EMAIL")
    if not args.password:
        raise SeedStatsHistoryError("missing user password; pass --password or STATS_SEED_PASSWORD")
    if args.attempts <= 0:
        raise SeedStatsHistoryError("--attempts must be greater than zero")
    if args.question_count <= 0:
        raise SeedStatsHistoryError("--question-count must be greater than zero")

    if args.start_date or args.end_date:
        if not args.start_date or not args.end_date:
            raise SeedStatsHistoryError("--start-date and --end-date must be provided together")
        try:
            start_date = date.fromisoformat(args.start_date)
            end_date = date.fromisoformat(args.end_date)
        except ValueError as exc:
            raise SeedStatsHistoryError("--start-date and --end-date must use YYYY-MM-DD format") from exc
    elif args.days is not None:
        if args.days < 7:
            raise SeedStatsHistoryError("--days must be at least 7 to populate weekly charts")
        end_date = date.today()
        start_date = end_date - timedelta(days=args.days - 1)
    else:
        start_date = DEFAULT_START_DATE
        end_date = DEFAULT_END_DATE

    if end_date < start_date:
        raise SeedStatsHistoryError("--end-date must be the same as or after --start-date")

    total_days = (end_date - start_date).days + 1
    if total_days < 7:
        raise SeedStatsHistoryError("date range must span at least 7 days to populate weekly charts")

    permit_code = args.permit_code.strip().upper() if isinstance(args.permit_code, str) and args.permit_code.strip() else None
    return ScriptConfig(
        email=args.email.strip(),
        password=args.password,
        permit_code=permit_code,
        auth_base_url=args.auth_base_url.rstrip("/"),
        core_base_url=args.core_base_url.rstrip("/"),
        start_date=start_date,
        end_date=end_date,
        attempts=args.attempts,
        question_count=args.question_count,
        seed=args.seed,
        request_timeout_seconds=args.timeout_seconds,
    )


def get_db_config() -> dict[str, Any]:
    missing = [key for key in REQUIRED_DB_ENV if not os.getenv(key)]
    if missing:
        raise SeedStatsHistoryError(f"missing required database env vars: {', '.join(missing)}")
    return {
        "host": os.environ["DB_HOST"],
        "port": int(os.environ["DB_PORT"]),
        "dbname": os.environ["DB_NAME"],
        "user": os.environ["DB_USER"],
        "password": os.environ["DB_PASSWORD"],
    }


def connect_db():
    if psycopg is None:
        raise SeedStatsHistoryError("psycopg is not installed; run pip install -r requirements.txt")
    try:
        return psycopg.connect(**get_db_config())
    except Exception as exc:  # pragma: no cover - exercised by runtime connectivity
        raise SeedStatsHistoryError(f"database connection failed: {exc}") from exc


def api_url(base_url: str, path: str) -> str:
    root = f"{base_url}/"
    return urljoin(root, path.lstrip("/"))


def ensure_httpx_installed() -> None:
    if httpx is None:
        raise SeedStatsHistoryError("httpx is not installed; run pip install -r requirements.txt")


def resolve_user_id(login_payload: dict[str, Any], token: str) -> str:
    payload_user_id = None
    raw_user = login_payload.get("user")
    if isinstance(raw_user, dict):
        raw_id = raw_user.get("id")
        if raw_id is not None:
            payload_user_id = str(raw_id)

    jwt_sub = None
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        raw_sub = decoded.get("sub")
        if raw_sub is not None:
            jwt_sub = str(raw_sub)
    except jwt.PyJWTError:
        jwt_sub = None

    if payload_user_id and jwt_sub and payload_user_id != jwt_sub:
        raise SeedStatsHistoryError("login response user.id does not match JWT sub; aborting for safety")
    if payload_user_id:
        return payload_user_id
    if jwt_sub:
        return jwt_sub
    raise SeedStatsHistoryError("could not resolve user id from login response or JWT")


def login_and_get_identity(client: httpx.Client, config: ScriptConfig) -> tuple[str, str]:
    response = client.post(
        api_url(config.auth_base_url, "/api/v1/auth/login"),
        json={"email": config.email, "password": config.password},
    )
    response.raise_for_status()
    payload = response.json()
    token = payload.get("access_token")
    if not isinstance(token, str) or not token.strip():
        raise SeedStatsHistoryError("auth login did not return a usable access_token")
    return token, resolve_user_id(payload, token)


def get_auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def fetch_permits(client: httpx.Client, token: str) -> list[dict[str, Any]]:
    response = client.get(api_url(client.base_url, "/api/v1/permits"), headers=get_auth_headers(token))
    response.raise_for_status()
    payload = response.json()
    items = payload.get("items")
    if not isinstance(items, list):
        raise SeedStatsHistoryError("permits response is missing items")
    return items


def fetch_topics(client: httpx.Client, token: str, permit_code: str) -> list[dict[str, Any]]:
    response = client.get(
        api_url(client.base_url, "/api/v1/topics"),
        headers=get_auth_headers(token),
        params={"permit_code": permit_code},
    )
    response.raise_for_status()
    payload = response.json()
    items = payload.get("items")
    if not isinstance(items, list):
        raise SeedStatsHistoryError("topics response is missing items")
    return items


def fetch_topic_inventory(connection: Any, permit_code: str) -> list[TopicInventory]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT t.id, t.topic_number, t.name, COUNT(q.id) AS question_count
            FROM topics t
            JOIN permits p ON p.id = t.permit_id
            LEFT JOIN questions q ON q.topic_id = t.id
            WHERE p.code = %s
            GROUP BY t.id, t.topic_number, t.name
            ORDER BY t.topic_number ASC, t.id ASC
            """,
            (permit_code,),
        )
        rows = cursor.fetchall()
    return [
        TopicInventory(
            topic_id=int(row[0]),
            topic_number=int(row[1]),
            name=str(row[2]),
            question_count=int(row[3] or 0),
        )
        for row in rows
    ]


def fetch_permit_question_count(connection: Any, permit_code: str) -> int:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT COUNT(q.id)
            FROM questions q
            JOIN permits p ON p.id = q.permit_id
            WHERE p.code = %s
            """,
            (permit_code,),
        )
        row = cursor.fetchone()
    return int(row[0] or 0) if row is not None else 0


def pick_permit_code(connection: Any, requested_permit_code: str | None, question_count: int) -> str:
    if requested_permit_code is not None:
        available = fetch_permit_question_count(connection, requested_permit_code)
        if available < question_count:
            raise SeedStatsHistoryError(
                f"permit {requested_permit_code} has only {available} questions; need at least {question_count}"
            )
        return requested_permit_code

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT p.code
            FROM permits p
            JOIN questions q ON q.permit_id = p.id
            GROUP BY p.id, p.code
            HAVING COUNT(q.id) >= %s
            ORDER BY p.code ASC
            LIMIT 1
            """,
            (question_count,),
        )
        row = cursor.fetchone()
    if row is None:
        raise SeedStatsHistoryError(f"no permit has at least {question_count} questions")
    return str(row[0])


def count_failed_question_history(connection: Any, user_id: str, permit_code: str) -> int:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT COUNT(DISTINCT aa.question_id)
            FROM attempt_answers aa
            JOIN test_attempts ta ON ta.id = aa.attempt_id
            JOIN tests t ON t.id = ta.test_id
            JOIN permits p ON p.id = t.permit_id
            WHERE ta.user_id = %s
              AND p.code = %s
              AND aa.is_correct = FALSE
            """,
            (user_id, permit_code),
        )
        row = cursor.fetchone()
    return int(row[0] or 0) if row is not None else 0


def build_distributed_day_offsets(total_days: int, attempts: int) -> list[int]:
    if total_days <= 0:
        raise SeedStatsHistoryError("total_days must be positive")
    if attempts <= 0:
        return []
    if attempts == 1:
        return [total_days - 1]

    step = (total_days - 1) / (attempts - 1)
    offsets: list[int] = []
    for index in range(attempts):
        candidate = round(index * step)
        min_allowed = offsets[-1] + 1 if offsets else 0
        remaining_slots = attempts - index - 1
        max_allowed = total_days - remaining_slots - 1
        offsets.append(min(max(candidate, min_allowed), max_allowed))
    return offsets


def build_clustered_day_offsets(total_days: int, extra_attempts: int, rng: random.Random) -> list[int]:
    if total_days <= 0:
        raise SeedStatsHistoryError("total_days must be positive")
    if extra_attempts <= 0:
        return []

    hotspot_count = min(max(2, total_days // 3), total_days)
    hotspot_centers = rng.sample(range(total_days), k=hotspot_count)
    weights = [1.0] * total_days

    for center in hotspot_centers:
        intensity = rng.uniform(1.6, 3.4)
        for day_offset in range(total_days):
            distance = abs(day_offset - center)
            if distance > 2:
                continue
            weights[day_offset] += intensity / (distance + 1)

    return sorted(rng.choices(range(total_days), weights=weights, k=extra_attempts))


def generate_finished_times(start_date: date, end_date: date, attempts: int, rng: random.Random) -> list[datetime]:
    total_days = (end_date - start_date).days + 1
    if total_days <= 0:
        raise SeedStatsHistoryError("end_date must be the same as or after start_date")
    if attempts <= total_days:
        selected_offsets = build_distributed_day_offsets(total_days, attempts)
    else:
        unique_offsets = list(range(total_days))
        extra_offsets = build_clustered_day_offsets(total_days, attempts - total_days, rng)
        selected_offsets = sorted(unique_offsets + extra_offsets)
    counters_by_day: dict[int, int] = {}
    finished_times: list[datetime] = []
    for day_offset in selected_offsets:
        counters_by_day[day_offset] = counters_by_day.get(day_offset, 0) + 1
        slot = counters_by_day[day_offset] - 1
        attempt_day = start_date + timedelta(days=day_offset)
        base_minutes = 8 * 60 + rng.randint(0, 9 * 60)
        minute_offset = min(slot * 37, 6 * 60)
        clock = time(hour=0, minute=0)
        finished_at = datetime.combine(attempt_day, clock).replace(tzinfo=UTC)
        finished_at += timedelta(minutes=base_minutes + minute_offset, seconds=rng.randint(0, 59))
        finished_times.append(finished_at)
    return sorted(finished_times)


def choose_wrong_count(index: int, total_attempts: int, question_count: int, rng: random.Random) -> int:
    if total_attempts <= 0:
        raise SeedStatsHistoryError("total_attempts must be positive")
    progress = index / max(total_attempts - 1, 1)
    failure_bias = 0.65 if progress < 0.33 else 0.4 if progress < 0.66 else 0.2
    if rng.random() < failure_bias:
        lower, upper = FAILING_WRONG_RANGE
    else:
        lower, upper = PASSING_WRONG_RANGE
    return min(rng.randint(lower, upper), question_count)


def choose_mode(
    *,
    attempt_index: int,
    question_count: int,
    eligible_topic_ids: list[int],
    failed_history_count: int,
    rng: random.Random,
) -> tuple[str, int | None]:
    if failed_history_count >= max(MIN_FAILED_HISTORY, question_count // 2) and attempt_index % 5 == 4:
        return "FAILED", None

    preferred = MODE_SEQUENCE[attempt_index % len(MODE_SEQUENCE)]
    if preferred == "TOPIC" and eligible_topic_ids:
        return "TOPIC", rng.choice(eligible_topic_ids)
    if preferred == "TOPIC":
        return "PERMIT", None
    return preferred, None


def build_answer_timestamps(started_at: datetime, finished_at: datetime, total_answers: int) -> tuple[datetime, ...]:
    if total_answers <= 0:
        return tuple()
    duration_seconds = max(int((finished_at - started_at).total_seconds()), total_answers)
    step = max(duration_seconds // total_answers, 1)
    stamps: list[datetime] = []
    for index in range(total_answers):
        candidate = started_at + timedelta(seconds=step * (index + 1))
        if candidate > finished_at:
            candidate = finished_at
        stamps.append(candidate)
    return tuple(stamps)


def build_schedule(
    *,
    attempts: int,
    start_date: date,
    end_date: date,
    question_count: int,
    eligible_topic_ids: list[int],
    initial_failed_history_count: int,
    rng: random.Random,
) -> list[ScheduledAttempt]:
    finished_times = generate_finished_times(start_date=start_date, end_date=end_date, attempts=attempts, rng=rng)
    schedule: list[ScheduledAttempt] = []
    failed_history_count = initial_failed_history_count
    for index, finished_at in enumerate(finished_times):
        mode, topic_id = choose_mode(
            attempt_index=index,
            question_count=question_count,
            eligible_topic_ids=eligible_topic_ids,
            failed_history_count=failed_history_count,
            rng=rng,
        )
        duration_seconds = rng.randint(8 * 60, 22 * 60)
        started_at = finished_at - timedelta(seconds=duration_seconds)
        test_created_at = started_at - timedelta(seconds=rng.randint(30, 240))
        desired_wrong_count = choose_wrong_count(index=index, total_attempts=attempts, question_count=question_count, rng=rng)
        answer_timestamps = build_answer_timestamps(started_at, finished_at, question_count)
        schedule.append(
            ScheduledAttempt(
                index=index,
                mode=mode,
                topic_id=topic_id,
                desired_wrong_count=desired_wrong_count,
                test_created_at=test_created_at,
                started_at=started_at,
                finished_at=finished_at,
                answer_timestamps=answer_timestamps,
            )
        )
        failed_history_count += desired_wrong_count
    return schedule


def fetch_question_snapshots(connection: Any, test_id: int) -> list[QuestionSnapshot]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT q.id, q.topic_id, qco.correct_label, qo.label
            FROM test_questions tq
            JOIN questions q ON q.id = tq.question_id
            JOIN question_correct_options qco ON qco.question_id = q.id
            JOIN question_options qo ON qo.question_id = q.id
            WHERE tq.test_id = %s
            ORDER BY q.id ASC, qo.label ASC
            """,
            (test_id,),
        )
        rows = cursor.fetchall()

    grouped: dict[int, dict[str, Any]] = {}
    for question_id, topic_id, correct_label, option_label in rows:
        item = grouped.setdefault(
            int(question_id),
            {
                "topic_id": int(topic_id),
                "correct_label": str(correct_label),
                "option_labels": [],
            },
        )
        item["option_labels"].append(str(option_label))

    return [
        QuestionSnapshot(
            question_id=question_id,
            topic_id=payload["topic_id"],
            correct_label=payload["correct_label"],
            option_labels=tuple(payload["option_labels"]),
        )
        for question_id, payload in grouped.items()
    ]


def weighted_sample_without_replacement(
    candidates: list[QuestionSnapshot],
    weights: dict[int, float],
    sample_size: int,
    rng: random.Random,
) -> set[int]:
    remaining = list(candidates)
    selected: set[int] = set()
    picks = min(sample_size, len(remaining))
    for _ in range(picks):
        total_weight = sum(max(weights.get(item.question_id, 1.0), 0.0) for item in remaining)
        if total_weight <= 0:
            chosen = rng.choice(remaining)
        else:
            threshold = rng.random() * total_weight
            cumulative = 0.0
            chosen = remaining[-1]
            for item in remaining:
                cumulative += max(weights.get(item.question_id, 1.0), 0.0)
                if cumulative >= threshold:
                    chosen = item
                    break
        selected.add(chosen.question_id)
        remaining = [item for item in remaining if item.question_id != chosen.question_id]
    return selected


def build_answers_payload(
    questions: list[QuestionSnapshot],
    desired_wrong_count: int,
    weak_topic_ids: set[int],
    rng: random.Random,
) -> list[dict[str, Any]]:
    wrongable_questions = [question for question in questions if len(question.option_labels) > 1]
    weights = {
        question.question_id: 3.0 if question.topic_id in weak_topic_ids else 1.0 for question in wrongable_questions
    }
    wrong_question_ids = weighted_sample_without_replacement(
        candidates=wrongable_questions,
        weights=weights,
        sample_size=min(desired_wrong_count, len(wrongable_questions)),
        rng=rng,
    )

    answers: list[dict[str, Any]] = []
    for question in questions:
        if question.question_id in wrong_question_ids:
            wrong_labels = [label for label in question.option_labels if label != question.correct_label]
            selected_label = rng.choice(wrong_labels)
        else:
            selected_label = question.correct_label
        answers.append({"question_id": question.question_id, "selected_label": selected_label})
    return answers


def build_weak_topic_ids(topics: list[TopicInventory]) -> set[int]:
    if not topics:
        return set()
    ordered = sorted(topics, key=lambda topic: (-topic.question_count, topic.topic_number, topic.topic_id))
    return {topic.topic_id for topic in ordered[: max(1, min(2, len(ordered)))]}


def submit_attempt(
    client: httpx.Client,
    token: str,
    test_id: int,
    answers: list[dict[str, Any]],
    duration_seconds: int,
) -> dict[str, Any]:
    response = client.post(
        api_url(client.base_url, f"/api/v1/tests/{test_id}/submit"),
        headers=get_auth_headers(token),
        json={"answers": answers, "duration_seconds": duration_seconds},
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict):
        raise SeedStatsHistoryError(f"submit response for test {test_id} is invalid")
    return payload


def generate_test(
    client: httpx.Client,
    token: str,
    permit_code: str,
    mode: str,
    question_count: int,
    topic_id: int | None,
) -> dict[str, Any]:
    body: dict[str, Any] = {"permit_code": permit_code, "mode": mode, "count": question_count}
    if topic_id is not None:
        body["topic_id"] = topic_id
    response = client.post(api_url(client.base_url, "/api/v1/tests/generate"), headers=get_auth_headers(token), json=body)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict) or not isinstance(payload.get("id"), int):
        raise SeedStatsHistoryError(f"generate response for mode {mode} is invalid")
    return payload


def backdate_test_rows(
    connection: Any,
    *,
    user_id: str,
    test_id: int,
    test_created_at: datetime,
    started_at: datetime,
    finished_at: datetime,
    answer_timestamps: tuple[datetime, ...],
) -> int:
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE tests SET created_at = %s WHERE id = %s AND user_id = %s",
                (test_created_at.replace(tzinfo=None), test_id, user_id),
            )
            if cursor.rowcount != 1:
                raise SeedStatsHistoryError(f"test row not found for test {test_id}")
            cursor.execute(
                """
                UPDATE test_attempts
                SET started_at = %s, finished_at = %s
                WHERE test_id = %s AND user_id = %s
                RETURNING id
                """,
                (started_at.replace(tzinfo=None), finished_at.replace(tzinfo=None), test_id, user_id),
            )
            row = cursor.fetchone()
            if row is None:
                raise SeedStatsHistoryError(f"attempt row not found for test {test_id}")
            attempt_id = int(row[0])

            cursor.execute(
                "SELECT id FROM attempt_answers WHERE attempt_id = %s ORDER BY id ASC",
                (attempt_id,),
            )
            answer_ids = [int(answer_row[0]) for answer_row in cursor.fetchall()]
            if len(answer_ids) != len(answer_timestamps):
                raise SeedStatsHistoryError(
                    f"attempt {attempt_id} has {len(answer_ids)} answers but expected {len(answer_timestamps)} timestamps"
                )

            cursor.executemany(
                "UPDATE attempt_answers SET answered_at = %s WHERE id = %s",
                [
                    (timestamp.replace(tzinfo=None), answer_id)
                    for answer_id, timestamp in zip(answer_ids, answer_timestamps, strict=True)
                ],
            )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    return attempt_id


def print_plan_header(config: ScriptConfig, user_id: str, permit_code: str, topics: list[TopicInventory]) -> None:
    eligible_topics = [topic for topic in topics if topic.question_count >= config.question_count]
    print(
        f"Seeding stats history for user {config.email} ({user_id}) on permit {permit_code} "
        f"with {config.attempts} attempts from {config.start_date.isoformat()} to {config.end_date.isoformat()}."
    )
    print(
        f"Eligible topic-mode topics: {len(eligible_topics)} / {len(topics)} "
        f"(need >= {config.question_count} questions). RNG seed: {config.seed}."
    )


def seed_history(config: ScriptConfig) -> list[TestSeedResult]:
    ensure_httpx_installed()
    rng = random.Random(config.seed)
    connection = connect_db()
    try:
        permit_code = pick_permit_code(connection, config.permit_code, config.question_count)
        topics = fetch_topic_inventory(connection, permit_code)
        eligible_topic_ids = [topic.topic_id for topic in topics if topic.question_count >= config.question_count]
        weak_topic_ids = build_weak_topic_ids(topics)

        with httpx.Client(base_url=config.auth_base_url, timeout=config.request_timeout_seconds) as auth_client:
            token, user_id = login_and_get_identity(auth_client, config)

        print_plan_header(config, user_id, permit_code, topics)
        initial_failed_history_count = count_failed_question_history(connection, user_id, permit_code)
        schedule = build_schedule(
            attempts=config.attempts,
            start_date=config.start_date,
            end_date=config.end_date,
            question_count=config.question_count,
            eligible_topic_ids=eligible_topic_ids,
            initial_failed_history_count=initial_failed_history_count,
            rng=rng,
        )

        results: list[TestSeedResult] = []
        with httpx.Client(base_url=config.core_base_url, timeout=config.request_timeout_seconds) as core_client:
            for item in schedule:
                test_payload = generate_test(
                    client=core_client,
                    token=token,
                    permit_code=permit_code,
                    mode=item.mode,
                    question_count=config.question_count,
                    topic_id=item.topic_id,
                )
                test_id = int(test_payload["id"])
                snapshots = fetch_question_snapshots(connection, test_id)
                if len(snapshots) != config.question_count:
                    raise SeedStatsHistoryError(
                        f"generated test {test_id} returned {len(snapshots)} questions; expected {config.question_count}. "
                        "Check permit/topic data before using topic or failed mode."
                    )

                duration_seconds = max(int((item.finished_at - item.started_at).total_seconds()), 1)
                answers = build_answers_payload(
                    questions=snapshots,
                    desired_wrong_count=item.desired_wrong_count,
                    weak_topic_ids=weak_topic_ids,
                    rng=rng,
                )
                submit_payload = submit_attempt(
                    client=core_client,
                    token=token,
                    test_id=test_id,
                    answers=answers,
                    duration_seconds=duration_seconds,
                )
                attempt_id = backdate_test_rows(
                    connection,
                    user_id=user_id,
                    test_id=test_id,
                    test_created_at=item.test_created_at,
                    started_at=item.started_at,
                    finished_at=item.finished_at,
                    answer_timestamps=item.answer_timestamps,
                )
                results.append(
                    TestSeedResult(
                        test_id=test_id,
                        attempt_id=attempt_id,
                        mode=item.mode,
                        topic_id=item.topic_id,
                        correct_count=int(submit_payload.get("correct_count", 0) or 0),
                        wrong_count=int(submit_payload.get("wrong_count", 0) or 0),
                        finished_at=item.finished_at,
                    )
                )
                print(
                    f"[{item.index + 1}/{len(schedule)}] test={test_id} attempt={attempt_id} "
                    f"mode={item.mode} topic_id={item.topic_id or '-'} wrong={submit_payload.get('wrong_count')} "
                    f"finished_at={item.finished_at.date().isoformat()}"
                )
        return results
    finally:
        connection.close()


def summarize_results(results: list[TestSeedResult]) -> None:
    if not results:
        print("No tests were created.")
        return
    modes: dict[str, int] = {}
    passed = 0
    failed = 0
    for result in results:
        modes[result.mode] = modes.get(result.mode, 0) + 1
        if result.wrong_count <= 3:
            passed += 1
        else:
            failed += 1
    first_day = min(result.finished_at for result in results).date().isoformat()
    last_day = max(result.finished_at for result in results).date().isoformat()
    print("\nSeed completed.")
    print(f"Tests created: {len(results)} | Passed: {passed} | Failed: {failed}")
    print(f"Date range: {first_day} -> {last_day}")
    print("Modes:")
    for mode, count in sorted(modes.items()):
        print(f"  - {mode}: {count}")


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    try:
        config = parse_args(args)
        results = seed_history(config)
        summarize_results(results)
        return 0
    except Exception as exc:
        if httpx is not None and isinstance(exc, httpx.HTTPStatusError):
            detail = exc.response.text.strip()
            print(f"HTTP error {exc.response.status_code} calling {exc.request.url}: {detail}", file=sys.stderr)
            return 1
        if isinstance(exc, SeedStatsHistoryError):
            print(str(exc), file=sys.stderr)
            return 1
        raise


if __name__ == "__main__":
    raise SystemExit(main())
