from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = CURRENT_DIR.parent

if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from scripts import seed_questions


class SeedQuestionsNormalizationTests(unittest.TestCase):
    def test_valid_payload_keeps_nullable_text_as_null(self) -> None:
        payload = {
            "tipo_permiso": " b ",
            "temas": [
                {
                    "tema_numero": "1",
                    "tema_nombre": "Definiciones",
                    "preguntas": [
                        {
                            "id_pregunta": "T01_P001",
                            "pregunta": "Pregunta",
                            "opciones": {"b": "Opcion B", "a": "Opcion A"},
                            "respuesta_correcta": "A",
                            "explicacion": "   ",
                            "requiere_imagen": False,
                            "descripcion_imagen": " ",
                            "dificultad": "2",
                            "palabras_clave": ["ignored"],
                        }
                    ],
                }
            ],
        }

        normalized = seed_questions.normalize_payload(payload)

        self.assertEqual(normalized.permit_code, "B")
        self.assertEqual(normalized.permit_name, "Permiso B")
        question = normalized.topics[0].questions[0]
        self.assertEqual(list(question.options.keys()), ["a", "b"])
        self.assertEqual(question.correct_label, "a")
        self.assertIsNone(question.explanation)
        self.assertIsNone(question.image_description)
        self.assertEqual(question.difficulty, 2)

    def test_invalid_difficulty_raises_validation_error(self) -> None:
        with self.assertRaisesRegex(seed_questions.SeedValidationError, "dificultad"):
            seed_questions.normalize_difficulty("9")

    def test_invalid_correct_label_raises_validation_error(self) -> None:
        with self.assertRaisesRegex(seed_questions.SeedValidationError, "respuesta_correcta"):
            seed_questions.normalize_correct_label("d", {"a": "A", "b": "B"})

    def test_missing_required_keys_fail_before_persistence(self) -> None:
        payload = {"tipo_permiso": "B"}

        with self.assertRaisesRegex(seed_questions.SeedValidationError, "missing required keys"):
            seed_questions.normalize_payload(payload)


@unittest.skipUnless(
    all(os.getenv(key) for key in seed_questions.REQUIRED_DB_ENV) and seed_questions.psycopg is not None,
    "Postgres integration env not configured",
)
class SeedQuestionsIntegrationTests(unittest.TestCase):
    permit_code = "ZZTEST"

    def setUp(self) -> None:
        self.connection = seed_questions.connect_db()
        self.addCleanup(self.connection.close)
        self.cleanup_seed_rows()

    def tearDown(self) -> None:
        self.cleanup_seed_rows()

    def cleanup_seed_rows(self) -> None:
        with self.connection.transaction():
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT id FROM permits WHERE code = %s", (self.permit_code,))
                row = cursor.fetchone()
                if row is not None:
                    cursor.execute("DELETE FROM permits WHERE id = %s", (row[0],))

    def test_import_is_idempotent_and_updates_existing_questions(self) -> None:
        initial_payload = {
            "tipo_permiso": self.permit_code,
            "temas": [
                {
                    "tema_numero": 91,
                    "tema_nombre": "Tema Seed",
                    "preguntas": [
                        {
                            "id_pregunta": "ZZTEST_P001",
                            "pregunta": "Texto original",
                            "opciones": {"a": "Uno", "b": "Dos", "c": "Tres"},
                            "respuesta_correcta": "b",
                            "explicacion": "Explicacion base",
                            "requiere_imagen": False,
                            "descripcion_imagen": None,
                            "dificultad": "3",
                        }
                    ],
                }
            ],
        }

        updated_payload = {
            **initial_payload,
            "temas": [
                {
                    **initial_payload["temas"][0],
                    "preguntas": [
                        {
                            **initial_payload["temas"][0]["preguntas"][0],
                            "pregunta": "Texto actualizado",
                        }
                    ],
                }
            ],
        }

        self.run_import(initial_payload)
        self.assert_counts(permits=1, topics=1, questions=1, options=3, correct_answers=1)

        self.run_import(updated_payload)
        self.assert_counts(permits=1, topics=1, questions=1, options=3, correct_answers=1)

        with self.connection.cursor() as cursor:
            cursor.execute(
                "SELECT statement FROM questions WHERE external_id = %s",
                ("ZZTEST_P001",),
            )
            row = cursor.fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(row[0], "Texto actualizado")

    def run_import(self, payload: dict[str, object]) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as handle:
            json.dump(payload, handle)
            temp_path = Path(handle.name)
        self.addCleanup(temp_path.unlink, missing_ok=True)

        normalized = seed_questions.load_payload(temp_path)
        seed_questions.import_payload(self.connection, normalized)

    def assert_counts(
        self,
        *,
        permits: int,
        topics: int,
        questions: int,
        options: int,
        correct_answers: int,
    ) -> None:
        with self.connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM permits WHERE code = %s", (self.permit_code,))
            self.assertEqual(cursor.fetchone()[0], permits)
            cursor.execute(
                "SELECT COUNT(*) FROM topics t JOIN permits p ON p.id = t.permit_id WHERE p.code = %s",
                (self.permit_code,),
            )
            self.assertEqual(cursor.fetchone()[0], topics)
            cursor.execute(
                "SELECT COUNT(*) FROM questions q JOIN permits p ON p.id = q.permit_id WHERE p.code = %s",
                (self.permit_code,),
            )
            self.assertEqual(cursor.fetchone()[0], questions)
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM question_options qo
                JOIN questions q ON q.id = qo.question_id
                JOIN permits p ON p.id = q.permit_id
                WHERE p.code = %s
                """,
                (self.permit_code,),
            )
            self.assertEqual(cursor.fetchone()[0], options)
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM question_correct_options qco
                JOIN questions q ON q.id = qco.question_id
                JOIN permits p ON p.id = q.permit_id
                WHERE p.code = %s
                """,
                (self.permit_code,),
            )
            self.assertEqual(cursor.fetchone()[0], correct_answers)


if __name__ == "__main__":
    unittest.main()
