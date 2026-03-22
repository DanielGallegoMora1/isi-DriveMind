"""Seed core question bank data from JSON.

Usage:
  - Host: python scripts/seed_questions.py
  - Docker: docker compose run --rm core-service python scripts/seed_questions.py

Verification:
  - Run `python -m unittest tests.test_seed_questions` from `services/core-service`
  - For a live Postgres check, set the `DB_*` env vars and rerun the same command.
"""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    import psycopg  # type: ignore[import-not-found]
except ImportError:  # pragma: no cover - validated by runtime command
    psycopg = None


REQUIRED_DB_ENV = ("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD")
REQUIRED_ROOT_KEYS = {"tipo_permiso", "temas"}
REQUIRED_TOPIC_KEYS = {"tema_numero", "tema_nombre", "preguntas"}
REQUIRED_QUESTION_KEYS = {
    "id_pregunta",
    "pregunta",
    "opciones",
    "respuesta_correcta",
    "explicacion",
    "requiere_imagen",
    "dificultad",
}
ALLOWED_OPTION_LABELS = {"a", "b", "c", "d"}
DEFAULT_SOURCE_PATH = Path(__file__).with_name("preguntas.json")


class SeedValidationError(ValueError):
    """Raised when the JSON payload does not satisfy the importer contract."""


@dataclass(frozen=True)
class NormalizedQuestion:
    external_id: str
    statement: str
    options: dict[str, str]
    correct_label: str
    explanation: str | None
    requires_image: bool
    image_description: str | None
    difficulty: int


@dataclass(frozen=True)
class NormalizedTopic:
    topic_number: int
    name: str
    questions: list[NormalizedQuestion]


@dataclass(frozen=True)
class NormalizedPayload:
    permit_code: str
    permit_name: str
    topics: list[NormalizedTopic]


@dataclass(frozen=True)
class ImportStats:
    permit_code: str
    topics: int
    questions: int
    options: int


def normalize_non_empty_text(value: Any, field_name: str) -> str:
    if not isinstance(value, str):
        raise SeedValidationError(f"{field_name} must be a string")
    normalized = value.strip()
    if not normalized:
        raise SeedValidationError(f"{field_name} must not be blank")
    return normalized


def normalize_nullable_text(value: Any, field_name: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise SeedValidationError(f"{field_name} must be a string or null")
    normalized = value.strip()
    return normalized or None


def normalize_permit_code(value: Any) -> str:
    return normalize_non_empty_text(value, "tipo_permiso").upper()


def normalize_permit_name(permit_code: str) -> str:
    return f"Permiso {permit_code}"


def normalize_topic_number(value: Any) -> int:
    try:
        topic_number = int(value)
    except (TypeError, ValueError) as exc:
        raise SeedValidationError("tema_numero must be an integer") from exc
    if topic_number <= 0:
        raise SeedValidationError("tema_numero must be greater than zero")
    return topic_number


def normalize_difficulty(value: Any) -> int:
    try:
        difficulty = int(value)
    except (TypeError, ValueError) as exc:
        raise SeedValidationError("dificultad must be an integer between 1 and 5") from exc
    if difficulty < 1 or difficulty > 5:
        raise SeedValidationError("dificultad must be an integer between 1 and 5")
    return difficulty


def normalize_option_label(value: Any, field_name: str) -> str:
    label = normalize_non_empty_text(value, field_name).lower()
    if label not in ALLOWED_OPTION_LABELS:
        raise SeedValidationError(f"{field_name} must be one of a, b, c, d")
    return label


def normalize_options(value: Any) -> dict[str, str]:
    if not isinstance(value, dict):
        raise SeedValidationError("opciones must be an object")
    normalized_options: dict[str, str] = {}
    for raw_label, raw_text in value.items():
        label = normalize_option_label(raw_label, "opciones label")
        if label in normalized_options:
            raise SeedValidationError(f"duplicate option label: {label}")
        normalized_options[label] = normalize_non_empty_text(raw_text, f"opciones.{label}")
    if not normalized_options:
        raise SeedValidationError("opciones must not be empty")
    return dict(sorted(normalized_options.items()))


def normalize_correct_label(value: Any, options: dict[str, str]) -> str:
    correct_label = normalize_option_label(value, "respuesta_correcta")
    if correct_label not in options:
        raise SeedValidationError(
            f"respuesta_correcta '{correct_label}' must exist in opciones"
        )
    return correct_label


def validate_required_keys(payload: dict[str, Any], required_keys: set[str], context: str) -> None:
    missing_keys = sorted(required_keys.difference(payload))
    if missing_keys:
        joined = ", ".join(missing_keys)
        raise SeedValidationError(f"{context} is missing required keys: {joined}")


def normalize_question(payload: dict[str, Any], topic_number: int, question_index: int) -> NormalizedQuestion:
    validate_required_keys(payload, REQUIRED_QUESTION_KEYS, f"question {question_index} in topic {topic_number}")
    external_id = normalize_non_empty_text(payload["id_pregunta"], "id_pregunta")
    statement = normalize_non_empty_text(payload["pregunta"], "pregunta")
    options = normalize_options(payload["opciones"])
    correct_label = normalize_correct_label(payload["respuesta_correcta"], options)
    explanation = normalize_nullable_text(payload["explicacion"], "explicacion")
    requires_image = payload["requiere_imagen"]
    if not isinstance(requires_image, bool):
        raise SeedValidationError("requiere_imagen must be a boolean")
    image_description = normalize_nullable_text(
        payload.get("descripcion_imagen"),
        "descripcion_imagen",
    )
    difficulty = normalize_difficulty(payload["dificultad"])

    return NormalizedQuestion(
        external_id=external_id,
        statement=statement,
        options=options,
        correct_label=correct_label,
        explanation=explanation,
        requires_image=requires_image,
        image_description=image_description,
        difficulty=difficulty,
    )


def normalize_topic(payload: dict[str, Any], topic_index: int) -> NormalizedTopic:
    validate_required_keys(payload, REQUIRED_TOPIC_KEYS, f"topic {topic_index}")
    topic_number = normalize_topic_number(payload["tema_numero"])
    topic_name = normalize_non_empty_text(payload["tema_nombre"], "tema_nombre")
    raw_questions = payload["preguntas"]
    if not isinstance(raw_questions, list) or not raw_questions:
        raise SeedValidationError(f"topic {topic_number} must contain at least one question")

    questions = [
        normalize_question(question_payload, topic_number, question_index)
        for question_index, question_payload in enumerate(raw_questions, start=1)
    ]

    return NormalizedTopic(topic_number=topic_number, name=topic_name, questions=questions)


def normalize_payload(payload: dict[str, Any]) -> NormalizedPayload:
    validate_required_keys(payload, REQUIRED_ROOT_KEYS, "root payload")
    permit_code = normalize_permit_code(payload["tipo_permiso"])
    permit_name = normalize_permit_name(permit_code)
    raw_topics = payload["temas"]
    if not isinstance(raw_topics, list) or not raw_topics:
        raise SeedValidationError("temas must contain at least one topic")

    topics = [normalize_topic(topic_payload, topic_index) for topic_index, topic_payload in enumerate(raw_topics, start=1)]

    topic_numbers = [topic.topic_number for topic in topics]
    if len(topic_numbers) != len(set(topic_numbers)):
        raise SeedValidationError("tema_numero values must be unique per import")

    external_ids = [question.external_id for topic in topics for question in topic.questions]
    if len(external_ids) != len(set(external_ids)):
        raise SeedValidationError("id_pregunta values must be unique per import")

    return NormalizedPayload(permit_code=permit_code, permit_name=permit_name, topics=topics)


def load_payload(source_path: Path) -> NormalizedPayload:
    try:
        raw_payload = json.loads(source_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SeedValidationError(f"source file not found: {source_path}") from exc
    except json.JSONDecodeError as exc:
        raise SeedValidationError(f"invalid JSON in {source_path}: {exc.msg}") from exc

    if not isinstance(raw_payload, dict):
        raise SeedValidationError("root payload must be a JSON object")
    return normalize_payload(raw_payload)


def get_db_config() -> dict[str, Any]:
    missing = [key for key in REQUIRED_DB_ENV if not os.getenv(key)]
    if missing:
        raise SeedValidationError(f"missing required database env vars: {', '.join(missing)}")
    return {
        "host": os.environ["DB_HOST"],
        "port": int(os.environ["DB_PORT"]),
        "dbname": os.environ["DB_NAME"],
        "user": os.environ["DB_USER"],
        "password": os.environ["DB_PASSWORD"],
    }


def connect_db():
    if psycopg is None:
        raise RuntimeError("psycopg is not installed; run pip install -r requirements.txt")
    try:
        return psycopg.connect(**get_db_config())
    except Exception as exc:  # pragma: no cover - exercised by runtime connectivity
        raise RuntimeError(f"database connection failed: {exc}") from exc


def upsert_permit(cursor: Any, payload: NormalizedPayload) -> int:
    cursor.execute(
        """
        INSERT INTO permits (code, name)
        VALUES (%s, %s)
        ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name
        RETURNING id
        """,
        (payload.permit_code, payload.permit_name),
    )
    permit_id = cursor.fetchone()
    if permit_id is None:
        raise RuntimeError("permit upsert did not return an id")
    return int(permit_id[0])


def upsert_topic(cursor: Any, permit_id: int, topic: NormalizedTopic) -> int:
    cursor.execute(
        """
        INSERT INTO topics (permit_id, topic_number, name)
        VALUES (%s, %s, %s)
        ON CONFLICT (permit_id, topic_number) DO UPDATE
        SET name = EXCLUDED.name
        RETURNING id
        """,
        (permit_id, topic.topic_number, topic.name),
    )
    topic_id = cursor.fetchone()
    if topic_id is None:
        raise RuntimeError(f"topic upsert did not return an id for topic {topic.topic_number}")
    return int(topic_id[0])


def upsert_question(cursor: Any, permit_id: int, topic_id: int, question: NormalizedQuestion) -> int:
    cursor.execute(
        """
        INSERT INTO questions (
            external_id,
            permit_id,
            topic_id,
            statement,
            difficulty,
            requires_image,
            image_description,
            base_explanation
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (external_id) DO UPDATE
        SET permit_id = EXCLUDED.permit_id,
            topic_id = EXCLUDED.topic_id,
            statement = EXCLUDED.statement,
            difficulty = EXCLUDED.difficulty,
            requires_image = EXCLUDED.requires_image,
            image_description = EXCLUDED.image_description,
            base_explanation = EXCLUDED.base_explanation
        RETURNING id
        """,
        (
            question.external_id,
            permit_id,
            topic_id,
            question.statement,
            question.difficulty,
            question.requires_image,
            question.image_description,
            question.explanation,
        ),
    )
    question_id = cursor.fetchone()
    if question_id is None:
        raise RuntimeError(f"question upsert did not return an id for {question.external_id}")
    return int(question_id[0])


def replace_options(cursor: Any, question_id: int, options: dict[str, str]) -> None:
    cursor.execute("DELETE FROM question_options WHERE question_id = %s", (question_id,))
    cursor.executemany(
        "INSERT INTO question_options (question_id, label, text) VALUES (%s, %s, %s)",
        [(question_id, label, text) for label, text in options.items()],
    )


def upsert_correct_option(cursor: Any, question_id: int, correct_label: str) -> None:
    cursor.execute(
        """
        INSERT INTO question_correct_options (question_id, correct_label)
        VALUES (%s, %s)
        ON CONFLICT (question_id) DO UPDATE
        SET correct_label = EXCLUDED.correct_label
        """,
        (question_id, correct_label),
    )


def import_payload(connection: Any, payload: NormalizedPayload) -> ImportStats:
    topic_count = 0
    question_count = 0
    option_count = 0

    with connection.transaction():
        with connection.cursor() as cursor:
            permit_id = upsert_permit(cursor, payload)
            topic_ids: dict[int, int] = {}
            for topic in payload.topics:
                topic_id = upsert_topic(cursor, permit_id, topic)
                topic_ids[topic.topic_number] = topic_id
                topic_count += 1

            for topic in payload.topics:
                topic_id = topic_ids[topic.topic_number]
                for question in topic.questions:
                    question_id = upsert_question(cursor, permit_id, topic_id, question)
                    replace_options(cursor, question_id, question.options)
                    upsert_correct_option(cursor, question_id, question.correct_label)
                    question_count += 1
                    option_count += len(question.options)

    return ImportStats(
        permit_code=payload.permit_code,
        topics=topic_count,
        questions=question_count,
        options=option_count,
    )


def resolve_source_path(argv: list[str]) -> Path:
    if len(argv) > 2:
        raise SeedValidationError("usage: python scripts/seed_questions.py [path-to-json]")
    if len(argv) == 2:
        return Path(argv[1]).resolve()
    return DEFAULT_SOURCE_PATH


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv
    try:
        source_path = resolve_source_path(args)
        payload = load_payload(source_path)
        with connect_db() as connection:
            stats = import_payload(connection, payload)
    except SeedValidationError as exc:
        print(f"Validation error: {exc}", file=sys.stderr)
        return 1
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except Exception as exc:  # pragma: no cover - safety net for unexpected SQL/runtime errors
        print(f"Import failed: {exc}", file=sys.stderr)
        return 1

    print(
        "Imported permit {permit} with {topics} topics, {questions} questions, and {options} options.".format(
            permit=stats.permit_code,
            topics=stats.topics,
            questions=stats.questions,
            options=stats.options,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
