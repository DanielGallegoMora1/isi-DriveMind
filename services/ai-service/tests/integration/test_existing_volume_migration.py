from __future__ import annotations

from uuid import UUID

from sqlalchemy import create_engine, text

from app.infrastructure.database.migration_runtime import migrate_existing_volume_sqlite


def _is_uuid(value: str) -> bool:
    try:
        UUID(value)
        return True
    except ValueError:
        return False


def test_existing_volume_migration_path_aligns_legacy_schema_to_contract():
    engine = create_engine("sqlite+pysqlite:///:memory:")

    with engine.begin() as connection:
        connection.execute(text("PRAGMA foreign_keys=ON"))

        connection.execute(
            text(
                """
                CREATE TABLE ai_conversations (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    title TEXT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    deleted_at TEXT NULL
                )
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE TABLE ai_messages (
                    id INTEGER PRIMARY KEY,
                    conversation_id INTEGER NOT NULL,
                    sender TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    CONSTRAINT fk_ai_messages_conversation
                        FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
                    CONSTRAINT chk_ai_messages_sender CHECK (sender IN ('USER','ASSISTANT'))
                )
                """
            )
        )

        connection.execute(
            text(
                """
                INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at)
                VALUES (1, 101, 'legacy-chat', '2026-04-20 12:30:00', '2026-04-20 12:31:00')
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO ai_messages (id, conversation_id, sender, content, created_at)
                VALUES
                    (10, 1, 'USER', 'hola', '2026-04-20 12:30:30'),
                    (11, 1, 'ASSISTANT', 'buenas', '2026-04-20 12:30:31')
                """
            )
        )

        migrate_existing_volume_sqlite(connection)

        conversation_columns = {
            row["name"] for row in connection.execute(text("PRAGMA table_info('ai_conversations')")).mappings()
        }
        assert conversation_columns == {"id", "user_id", "title", "created_at", "updated_at"}

        message_columns = {row["name"] for row in connection.execute(text("PRAGMA table_info('ai_messages')")).mappings()}
        assert message_columns == {"id", "conversation_id", "role", "content", "created_at"}

        conversation = connection.execute(text("SELECT id, user_id, created_at, updated_at FROM ai_conversations"))
        conversation_row = conversation.mappings().one()
        assert _is_uuid(conversation_row["id"])
        assert _is_uuid(conversation_row["user_id"])
        assert conversation_row["created_at"].endswith("+00:00")
        assert conversation_row["updated_at"].endswith("+00:00")

        message_rows = connection.execute(
            text("SELECT id, conversation_id, role, created_at FROM ai_messages ORDER BY created_at")
        ).mappings().all()

        assert len(message_rows) == 2
        assert _is_uuid(message_rows[0]["id"])
        assert _is_uuid(message_rows[1]["id"])
        assert message_rows[0]["conversation_id"] == conversation_row["id"]
        assert message_rows[1]["conversation_id"] == conversation_row["id"]
        assert [row["role"] for row in message_rows] == ["user", "assistant"]
        assert all(row["created_at"].endswith("+00:00") for row in message_rows)
