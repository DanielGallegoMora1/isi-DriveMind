#!/usr/bin/env python3
"""Seed real DriveMind students for MVP end-to-end testing.

This script logs in as a real `school_admin` user and creates N students through
the public auth-service endpoint `POST /api/v1/auth/students`.

Usage:
  - Docker Compose:
      docker compose run --rm auth-service python scripts/seed_students.py \
        --school-admin-email admin@school.test \
        --school-admin-password Admin123! \
        --count 10 \
        --license-code B

  - Docker Compose with env vars:
      docker compose run --rm \
        -e STUDENT_SEED_SCHOOL_ADMIN_EMAIL=admin@school.test \
        -e STUDENT_SEED_SCHOOL_ADMIN_PASSWORD=Admin123! \
        -e STUDENT_SEED_COUNT=10 \
        -e STUDENT_SEED_LICENSE_CODE=B \
        auth-service python scripts/seed_students.py

  - Host (against compose-exposed ports):
      STUDENT_SEED_SCHOOL_ADMIN_EMAIL=admin@school.test \
      STUDENT_SEED_SCHOOL_ADMIN_PASSWORD=Admin123! \
      STUDENT_SEED_AUTH_BASE_URL=http://localhost:8001 \
      python scripts/seed_students.py --count 5 --print-emails-summary

Verification:
  - Unit tests only:
      python -m pytest tests/test_seed_students.py

Safety notes:
  - Requires explicit school admin credentials.
  - Creates real student users in the target environment.
  - Uses deterministic email/name/document generation from the provided prefixes.
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any
from urllib.parse import urljoin

if TYPE_CHECKING:
    import httpx
else:  # pragma: no cover - import availability depends on runtime environment
    try:
        import httpx  # type: ignore[import-not-found]
    except ImportError:  # pragma: no cover - handled before runtime HTTP calls
        httpx = None


DEFAULT_AUTH_BASE_URL = "http://auth-service:8000"
DEFAULT_COUNT = 10
DEFAULT_START_INDEX = 1
DEFAULT_EMAIL_PREFIX = "student"
DEFAULT_EMAIL_DOMAIN = "example.com"
DEFAULT_FULL_NAME_PREFIX = "MVP Student"
DEFAULT_STUDENT_PASSWORD = "Student123!"
DEFAULT_LICENSE_CODE = "B"
DEFAULT_DOCUMENT_PREFIX = "DOC"


class SeedStudentsError(RuntimeError):
    """Raised when the student seeding flow cannot continue safely."""


@dataclass(frozen=True)
class ScriptConfig:
    school_admin_email: str
    school_admin_password: str
    auth_base_url: str
    count: int
    start_index: int
    email_prefix: str
    email_domain: str
    full_name_prefix: str
    student_password: str
    license_code: str
    document_prefix: str | None
    print_emails_summary: bool
    request_timeout_seconds: float


@dataclass(frozen=True)
class PlannedStudent:
    index: int
    email: str
    full_name: str
    document_id: str | None


@dataclass(frozen=True)
class CreatedStudent:
    index: int
    email: str
    full_name: str
    student_id: str


def env_or_default(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip()
    return normalized or default


def parse_args(argv: list[str]) -> ScriptConfig:
    parser = argparse.ArgumentParser(description="Seed DriveMind students through the real auth API.")
    parser.add_argument(
        "--school-admin-email",
        default=env_or_default("STUDENT_SEED_SCHOOL_ADMIN_EMAIL"),
        help="School admin email used to authenticate.",
    )
    parser.add_argument(
        "--school-admin-password",
        default=env_or_default("STUDENT_SEED_SCHOOL_ADMIN_PASSWORD"),
        help="School admin password used to authenticate.",
    )
    parser.add_argument(
        "--auth-base-url",
        default=env_or_default("STUDENT_SEED_AUTH_BASE_URL", DEFAULT_AUTH_BASE_URL),
        help="Auth service base URL, without the /api/v1 suffix.",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=int(env_or_default("STUDENT_SEED_COUNT", str(DEFAULT_COUNT)) or DEFAULT_COUNT),
        help=f"How many students to create. Default: {DEFAULT_COUNT}.",
    )
    parser.add_argument(
        "--start-index",
        type=int,
        default=int(env_or_default("STUDENT_SEED_START_INDEX", str(DEFAULT_START_INDEX)) or DEFAULT_START_INDEX),
        help=f"First numeric suffix used for generated students. Default: {DEFAULT_START_INDEX}.",
    )
    parser.add_argument(
        "--email-prefix",
        default=env_or_default("STUDENT_SEED_EMAIL_PREFIX", DEFAULT_EMAIL_PREFIX),
        help=f"Email local-part prefix. Default: {DEFAULT_EMAIL_PREFIX}.",
    )
    parser.add_argument(
        "--email-domain",
        default=env_or_default("STUDENT_SEED_EMAIL_DOMAIN", DEFAULT_EMAIL_DOMAIN),
        help=f"Email domain used for generated students. Default: {DEFAULT_EMAIL_DOMAIN}.",
    )
    parser.add_argument(
        "--full-name-prefix",
        default=env_or_default("STUDENT_SEED_FULL_NAME_PREFIX", DEFAULT_FULL_NAME_PREFIX),
        help=f"Full name prefix. Default: {DEFAULT_FULL_NAME_PREFIX}.",
    )
    parser.add_argument(
        "--student-password",
        default=env_or_default("STUDENT_SEED_STUDENT_PASSWORD", DEFAULT_STUDENT_PASSWORD),
        help="Password assigned to every generated student.",
    )
    parser.add_argument(
        "--license-code",
        default=env_or_default("STUDENT_SEED_LICENSE_CODE", DEFAULT_LICENSE_CODE),
        help=f"License code assigned to every generated student. Default: {DEFAULT_LICENSE_CODE}.",
    )
    parser.add_argument(
        "--document-prefix",
        default=env_or_default("STUDENT_SEED_DOCUMENT_PREFIX", DEFAULT_DOCUMENT_PREFIX),
        help=(
            "Optional document_id prefix. Pass an empty env var or --document-prefix '' to skip documents. "
            f"Default: {DEFAULT_DOCUMENT_PREFIX}."
        ),
    )
    parser.add_argument(
        "--print-emails-summary",
        action="store_true",
        help="Print the final list of created emails.",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=float(env_or_default("STUDENT_SEED_TIMEOUT_SECONDS", "20") or 20.0),
        help="HTTP timeout in seconds.",
    )
    args = parser.parse_args(argv)

    if not args.school_admin_email:
        raise SeedStudentsError(
            "missing school admin email; pass --school-admin-email or STUDENT_SEED_SCHOOL_ADMIN_EMAIL"
        )
    if not args.school_admin_password:
        raise SeedStudentsError(
            "missing school admin password; pass --school-admin-password or STUDENT_SEED_SCHOOL_ADMIN_PASSWORD"
        )
    if args.count <= 0:
        raise SeedStudentsError("--count must be greater than zero")
    if args.start_index <= 0:
        raise SeedStudentsError("--start-index must be greater than zero")
    if args.timeout_seconds <= 0:
        raise SeedStudentsError("--timeout-seconds must be greater than zero")

    email_prefix = args.email_prefix.strip()
    email_domain = args.email_domain.strip()
    full_name_prefix = args.full_name_prefix.strip()
    student_password = args.student_password
    license_code = args.license_code.strip().upper()
    document_prefix = normalize_optional_text(args.document_prefix)

    if not email_prefix:
        raise SeedStudentsError("--email-prefix must not be blank")
    if not email_domain:
        raise SeedStudentsError("--email-domain must not be blank")
    if not full_name_prefix:
        raise SeedStudentsError("--full-name-prefix must not be blank")
    if not student_password:
        raise SeedStudentsError("--student-password must not be blank")
    if not license_code:
        raise SeedStudentsError("--license-code must not be blank")

    return ScriptConfig(
        school_admin_email=args.school_admin_email.strip(),
        school_admin_password=args.school_admin_password,
        auth_base_url=args.auth_base_url.rstrip("/"),
        count=args.count,
        start_index=args.start_index,
        email_prefix=email_prefix,
        email_domain=email_domain,
        full_name_prefix=full_name_prefix,
        student_password=student_password,
        license_code=license_code,
        document_prefix=document_prefix,
        print_emails_summary=args.print_emails_summary,
        request_timeout_seconds=args.timeout_seconds,
    )


def normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def api_url(base_url: str, path: str) -> str:
    root = f"{base_url}/"
    return urljoin(root, path.lstrip("/"))


def ensure_httpx_installed() -> None:
    if httpx is None:
        raise SeedStudentsError("httpx is not installed; run pip install -r requirements.txt")


def get_auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def login_as_school_admin(client: httpx.Client, config: ScriptConfig) -> str:
    response = client.post(
        api_url(config.auth_base_url, "/api/v1/auth/login"),
        json={"email": config.school_admin_email, "password": config.school_admin_password},
    )
    response.raise_for_status()
    payload = response.json()
    token = payload.get("access_token")
    if not isinstance(token, str) or not token.strip():
        raise SeedStudentsError("auth login did not return a usable access_token")

    user = payload.get("user")
    if not isinstance(user, dict) or user.get("role") != "school_admin":
        raise SeedStudentsError("authenticated user is not a school_admin; aborting for safety")
    return token


def build_planned_student(config: ScriptConfig, index: int) -> PlannedStudent:
    email = f"{config.email_prefix}{index}@{config.email_domain}"
    full_name = f"{config.full_name_prefix} {index}"
    document_id = f"{config.document_prefix}-{index}" if config.document_prefix else None
    return PlannedStudent(index=index, email=email, full_name=full_name, document_id=document_id)


def build_student_payload(planned_student: PlannedStudent, config: ScriptConfig) -> dict[str, Any]:
    return {
        "email": planned_student.email,
        "password": config.student_password,
        "full_name": planned_student.full_name,
        "document_id": planned_student.document_id,
        "licenses": [config.license_code],
    }


def create_student(
    client: httpx.Client,
    token: str,
    planned_student: PlannedStudent,
    config: ScriptConfig,
) -> CreatedStudent:
    response = client.post(
        api_url(config.auth_base_url, "/api/v1/auth/students"),
        json=build_student_payload(planned_student, config),
        headers=get_auth_headers(token),
    )
    response.raise_for_status()
    payload = response.json()
    raw_id = payload.get("id")
    if raw_id is None:
        raise SeedStudentsError(f"create student response for {planned_student.email} is missing id")
    return CreatedStudent(
        index=planned_student.index,
        email=planned_student.email,
        full_name=planned_student.full_name,
        student_id=str(raw_id),
    )


def create_students(client: httpx.Client, config: ScriptConfig) -> list[CreatedStudent]:
    token = login_as_school_admin(client, config)
    created_students: list[CreatedStudent] = []

    for offset in range(config.count):
        student_index = config.start_index + offset
        planned_student = build_planned_student(config, student_index)
        created_student = create_student(client, token, planned_student, config)
        created_students.append(created_student)
        print(
            f"[created {offset + 1}/{config.count}] {created_student.email} "
            f"({created_student.full_name}) id={created_student.student_id}"
        )

    return created_students


def print_summary(created_students: list[CreatedStudent], config: ScriptConfig) -> None:
    print(f"Created {len(created_students)} students with license {config.license_code}.")
    if config.print_emails_summary and created_students:
        print("Created emails:")
        for student in created_students:
            print(f"- {student.email}")


def render_http_error(exc: Exception) -> str:
    response = getattr(exc, "response", None)
    if response is None:
        return str(exc)

    status_code = getattr(response, "status_code", "?")
    detail: str | None = None
    try:
        payload = response.json()
    except Exception:
        payload = None

    if isinstance(payload, dict):
        raw_detail = payload.get("detail")
        if isinstance(raw_detail, str) and raw_detail.strip():
            detail = raw_detail.strip()

    if not detail:
        text = getattr(response, "text", "")
        if isinstance(text, str) and text.strip():
            detail = text.strip()

    if detail:
        return f"HTTP {status_code}: {detail}"
    return f"HTTP {status_code}"


def run(config: ScriptConfig) -> list[CreatedStudent]:
    ensure_httpx_installed()
    assert httpx is not None
    with httpx.Client(timeout=config.request_timeout_seconds) as client:
        created_students = create_students(client, config)
    print_summary(created_students, config)
    return created_students


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    try:
        config = parse_args(args)
        run(config)
    except SeedStudentsError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        httpx_request_error = getattr(httpx, "RequestError", None)
        httpx_status_error = getattr(httpx, "HTTPStatusError", None)
        if httpx_request_error is not None and isinstance(exc, httpx_request_error):
            print(f"Error: request failed: {exc}", file=sys.stderr)
            return 1
        if httpx_status_error is not None and isinstance(exc, httpx_status_error):
            print(f"Error: {render_http_error(exc)}", file=sys.stderr)
            return 1
        raise
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
