# DriveMind AI Service

## Environment

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `SECRET_KEY`, `ALGORITHM`
- `HF_TOKEN`
- `HF_MODEL` (default: `openai/gpt-oss-120b:cerebras`)
- `HF_TIMEOUT_SECONDS` (default: `20`)
- `HF_MAX_RETRIES` (default: `2`)
- `AI_CONTEXT_WINDOW_MESSAGES` (default: `10`)

## Contract notes

- All public endpoints are under `/api/v1/ai`.
- All endpoints require `Authorization: Bearer <token>` and accept roles: `student`, `school_admin`, `system_admin`.
- `GET /api/v1/ai/conversations/{conversation_id}` returns `{conversation, messages}`.
- `POST /api/v1/ai/messages` is strict-atomic: if provider fails, no user/assistant messages are persisted.

## Migrations for persistent volumes

When upgrading an existing DB initialized with `001_schema.sql`, apply:

1. `001_schema.sql` (baseline)
2. `002_contract_alignment.sql` (UUID/timestamptz/role alignment)

Example:

```bash
psql "$DATABASE_URL" -f db/init/001_schema.sql
psql "$DATABASE_URL" -f db/init/002_contract_alignment.sql
```

## Tests

```bash
PYTHONPATH=. pytest tests/unit tests/integration
```
