from __future__ import annotations

import io
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = CURRENT_DIR.parent

if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from scripts import seed_students


class SeedStudentsTests(unittest.TestCase):
    def test_parse_args_uses_defaults_and_normalizes_license_code(self) -> None:
        config = seed_students.parse_args(
            [
                "--school-admin-email",
                "admin@school.test",
                "--school-admin-password",
                "secret",
                "--license-code",
                " b ",
            ]
        )

        self.assertEqual(config.auth_base_url, seed_students.DEFAULT_AUTH_BASE_URL)
        self.assertEqual(config.count, seed_students.DEFAULT_COUNT)
        self.assertEqual(config.start_index, seed_students.DEFAULT_START_INDEX)
        self.assertEqual(config.license_code, "B")
        self.assertEqual(config.document_prefix, seed_students.DEFAULT_DOCUMENT_PREFIX)

    def test_parse_args_rejects_non_positive_count(self) -> None:
        with self.assertRaisesRegex(seed_students.SeedStudentsError, "--count"):
            seed_students.parse_args(
                [
                    "--school-admin-email",
                    "admin@school.test",
                    "--school-admin-password",
                    "secret",
                    "--count",
                    "0",
                ]
            )

    def test_build_planned_student_supports_optional_document_prefix(self) -> None:
        config = seed_students.parse_args(
            [
                "--school-admin-email",
                "admin@school.test",
                "--school-admin-password",
                "secret",
                "--document-prefix",
                "",
            ]
        )

        planned_student = seed_students.build_planned_student(config, 7)

        self.assertEqual(planned_student.email, "student7@example.com")
        self.assertEqual(planned_student.full_name, "MVP Student 7")
        self.assertIsNone(planned_student.document_id)

    def test_login_as_school_admin_rejects_non_school_admin_role(self) -> None:
        config = seed_students.parse_args(
            [
                "--school-admin-email",
                "admin@school.test",
                "--school-admin-password",
                "secret",
            ]
        )
        client = FakeClient(
            [
                FakeResponse(
                    {
                        "access_token": "jwt-token",
                        "user": {"role": "system_admin"},
                    }
                )
            ]
        )

        with self.assertRaisesRegex(seed_students.SeedStudentsError, "school_admin"):
            seed_students.login_as_school_admin(client, config)

    def test_create_students_uses_login_and_real_student_endpoint(self) -> None:
        config = seed_students.parse_args(
            [
                "--school-admin-email",
                "admin@school.test",
                "--school-admin-password",
                "secret",
                "--count",
                "2",
                "--start-index",
                "3",
                "--email-prefix",
                "mvp.student",
                "--email-domain",
                "drivemind.test",
                "--full-name-prefix",
                "Alumno MVP",
                "--student-password",
                "Student123!",
                "--license-code",
                "a1",
                "--document-prefix",
                "DNI",
            ]
        )
        client = FakeClient(
            [
                FakeResponse(
                    {
                        "access_token": "jwt-token",
                        "user": {"role": "school_admin"},
                    }
                ),
                FakeResponse({"id": "student-3"}),
                FakeResponse({"id": "student-4"}),
            ]
        )

        created_students = seed_students.create_students(client, config)

        self.assertEqual([student.email for student in created_students], [
            "mvp.student3@drivemind.test",
            "mvp.student4@drivemind.test",
        ])
        self.assertEqual(client.calls[0]["url"], "http://auth-service:8000/api/v1/auth/login")
        self.assertEqual(client.calls[1]["url"], "http://auth-service:8000/api/v1/auth/students")
        self.assertEqual(client.calls[2]["json"], {
            "email": "mvp.student4@drivemind.test",
            "password": "Student123!",
            "full_name": "Alumno MVP 4",
            "document_id": "DNI-4",
            "licenses": ["A1"],
        })
        self.assertEqual(client.calls[1]["headers"], {"Authorization": "Bearer jwt-token"})

    def test_print_summary_optionally_lists_emails(self) -> None:
        config = seed_students.parse_args(
            [
                "--school-admin-email",
                "admin@school.test",
                "--school-admin-password",
                "secret",
                "--print-emails-summary",
            ]
        )
        created_students = [
            seed_students.CreatedStudent(index=1, email="student1@example.com", full_name="MVP Student 1", student_id="1"),
            seed_students.CreatedStudent(index=2, email="student2@example.com", full_name="MVP Student 2", student_id="2"),
        ]

        buffer = io.StringIO()
        with redirect_stdout(buffer):
            seed_students.print_summary(created_students, config)

        output = buffer.getvalue()
        self.assertIn("Created 2 students with license B.", output)
        self.assertIn("- student1@example.com", output)
        self.assertIn("- student2@example.com", output)


class FakeResponse:
    def __init__(self, payload: dict[str, object], status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code
        self.text = str(payload)

    def json(self) -> dict[str, object]:
        return self._payload

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise AssertionError("Unexpected HTTP error in unit test")


class FakeClient:
    def __init__(self, responses: list[FakeResponse]) -> None:
        self._responses = responses
        self.calls: list[dict[str, object]] = []

    def post(self, url: str, json: dict[str, object], headers: dict[str, str] | None = None) -> FakeResponse:
        self.calls.append({"url": url, "json": json, "headers": headers})
        if not self._responses:
            raise AssertionError("No more fake responses configured")
        return self._responses.pop(0)


if __name__ == "__main__":
    unittest.main()
