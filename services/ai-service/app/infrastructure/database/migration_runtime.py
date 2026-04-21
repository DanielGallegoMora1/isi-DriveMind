from __future__ import annotations

from datetime import datetime, timezone
from uuid import NAMESPACE_URL, uuid4, uuid5

from sqlalchemy import text
from sqlalchemy.engine import Connection


def _to_utc_iso8601(value: str | datetime) -> str:
    dt = datetime.fromisoformat(value) if isinstance(value, str) else value
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.isoformat()


def _column_names(connection: Connection, table_name: str) -> set[str]:
    rows = connection.execute(text(f"PRAGMA table_info('{table_name}')")).mappings().all()
    return {row["name"] for row in rows}


def _sender_to_role(sender: str) -> str:
    if sender == "USER":
        return "user"
    if sender == "ASSISTANT":
        return "assistant"
    return "system"


def migrate_existing_volume_sqlite(connection: Connection) -> None:
    """Runtime migration smoke for existing-volume upgrade path in tests.

    Mirrors additive → backfill → cutover semantics for legacy ai-service schemas
    in SQLite-backed test environments.
    """

    conversation_columns = _column_names(connection, "ai_conversations")
    if "id_v2" not in conversation_columns:
        connection.execute(text("ALTER TABLE ai_conversations ADD COLUMN id_v2 TEXT"))
    if "user_id_v2" not in conversation_columns:
        connection.execute(text("ALTER TABLE ai_conversations ADD COLUMN user_id_v2 TEXT"))
    if "created_at_v2" not in conversation_columns:
        connection.execute(text("ALTER TABLE ai_conversations ADD COLUMN created_at_v2 TEXT"))
    if "updated_at_v2" not in conversation_columns:
        connection.execute(text("ALTER TABLE ai_conversations ADD COLUMN updated_at_v2 TEXT"))

    message_columns = _column_names(connection, "ai_messages")
    if "id_v2" not in message_columns:
        connection.execute(text("ALTER TABLE ai_messages ADD COLUMN id_v2 TEXT"))
    if "conversation_id_v2" not in message_columns:
        connection.execute(text("ALTER TABLE ai_messages ADD COLUMN conversation_id_v2 TEXT"))
    if "role" not in message_columns:
        connection.execute(text("ALTER TABLE ai_messages ADD COLUMN role TEXT"))
    if "created_at_v2" not in message_columns:
        connection.execute(text("ALTER TABLE ai_messages ADD COLUMN created_at_v2 TEXT"))

    conversation_rows = connection.execute(
        text("SELECT id, user_id, created_at, updated_at FROM ai_conversations")
    ).mappings().all()

    conversation_id_map: dict[int, str] = {}
    for row in conversation_rows:
        new_conversation_id = str(uuid4())
        conversation_id_map[int(row["id"])] = new_conversation_id
        new_user_id = str(uuid5(NAMESPACE_URL, f"legacy-user:{row['user_id']}"))

        connection.execute(
            text(
                """
                UPDATE ai_conversations
                SET id_v2 = :id_v2,
                    user_id_v2 = :user_id_v2,
                    created_at_v2 = :created_at_v2,
                    updated_at_v2 = :updated_at_v2
                WHERE id = :legacy_id
                """
            ),
            {
                "id_v2": new_conversation_id,
                "user_id_v2": new_user_id,
                "created_at_v2": _to_utc_iso8601(row["created_at"]),
                "updated_at_v2": _to_utc_iso8601(row["updated_at"]),
                "legacy_id": row["id"],
            },
        )

    message_rows = connection.execute(
        text("SELECT id, conversation_id, sender, created_at FROM ai_messages")
    ).mappings().all()

    for row in message_rows:
        connection.execute(
            text(
                """
                UPDATE ai_messages
                SET id_v2 = :id_v2,
                    conversation_id_v2 = :conversation_id_v2,
                    role = :role,
                    created_at_v2 = :created_at_v2
                WHERE id = :legacy_id
                """
            ),
            {
                "id_v2": str(uuid4()),
                "conversation_id_v2": conversation_id_map[int(row["conversation_id"])],
                "role": _sender_to_role(row["sender"]),
                "created_at_v2": _to_utc_iso8601(row["created_at"]),
                "legacy_id": row["id"],
            },
        )

    connection.execute(
        text(
            """
            CREATE TABLE ai_conversations_v2 (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
    )
    connection.execute(
        text(
            """
            INSERT INTO ai_conversations_v2 (id, user_id, title, created_at, updated_at)
            SELECT id_v2, user_id_v2, title, created_at_v2, updated_at_v2
            FROM ai_conversations
            """
        )
    )

    connection.execute(
        text(
            """
            CREATE TABLE ai_messages_v2 (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id)
                    REFERENCES ai_conversations_v2(id)
                    ON DELETE CASCADE
            )
            """
        )
    )
    connection.execute(
        text(
            """
            INSERT INTO ai_messages_v2 (id, conversation_id, role, content, created_at)
            SELECT id_v2, conversation_id_v2, role, content, created_at_v2
            FROM ai_messages
            """
        )
    )

    connection.execute(text("DROP TABLE ai_messages"))
    connection.execute(text("DROP TABLE ai_conversations"))
    connection.execute(text("ALTER TABLE ai_conversations_v2 RENAME TO ai_conversations"))
    connection.execute(text("ALTER TABLE ai_messages_v2 RENAME TO ai_messages"))

    connection.execute(text("CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_updated_v2 ON ai_conversations(user_id, updated_at)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created_v2 ON ai_messages(conversation_id, created_at)"))
