# isi-DriveMind

## Prerequisites

- Docker
- Docker Compose

## Bootstrap (Docker only)

```bash
docker compose up --build
```

This starts:

- Auth service on `http://localhost:8001`
- Core service on `http://localhost:8002`
- AI service on `http://localhost:8003`

Health checks:

- `http://localhost:8001/health`
- `http://localhost:8002/health`
- `http://localhost:8003/health`

## Seed Questions From JSON

The core service includes `services/core-service/scripts/seed_questions.py` to import the question bank from `services/core-service/scripts/preguntas.json` into `core-db`.

### Prerequisites

- Docker
- Docker Compose
- `core-db` running in Docker Compose

Start only the database if needed:

```bash
docker compose up -d core-db
```

### Run Against `core-db`

From the repository root:

```bash
docker compose run --rm core-service python scripts/seed_questions.py
```

This uses the default bundled source file at `services/core-service/scripts/preguntas.json`.

To import a different JSON file that already exists inside the container image:

```bash
docker compose run --rm core-service python scripts/seed_questions.py scripts/another_questions.json
```

To import any local JSON file from the host machine instead of the bundled Docker image:

```bash
cd services/core-service
DB_HOST=localhost DB_PORT=5432 DB_NAME=core_db DB_USER=core_user DB_PASSWORD=core_password python3 scripts/seed_questions.py /absolute/path/to/questions.json
```

The script validates the JSON payload before writing to the database and then upserts permits, topics, questions, options, and correct answers in a single transaction.

### Expected Output

On success, the command prints:

```text
Imported permit B with 17 topics, 1700 questions, and 5100 options.
```

If the JSON structure is invalid or required database environment variables are missing, the command exits with an error message.

You can also run the importer test suite without building containers:

```bash
cd services/core-service
python3 -m unittest tests.test_seed_questions
```

### Verification

Check the imported permit:

```bash
docker compose exec core-db psql -U core_user -d core_db -c "SELECT code, name FROM permits ORDER BY code;"
```

Check topic and question totals for permit `B`:

```bash
docker compose exec core-db psql -U core_user -d core_db -c "SELECT p.code, COUNT(DISTINCT t.id) AS topics, COUNT(DISTINCT q.id) AS questions FROM permits p LEFT JOIN topics t ON t.permit_id = p.id LEFT JOIN questions q ON q.permit_id = p.id WHERE p.code = 'B' GROUP BY p.code;"
```

Check answer option totals for permit `B`:

```bash
docker compose exec core-db psql -U core_user -d core_db -c "SELECT p.code, COUNT(qo.id) AS options, COUNT(qco.question_id) AS correct_answers FROM permits p JOIN questions q ON q.permit_id = p.id LEFT JOIN question_options qo ON qo.question_id = q.id LEFT JOIN question_correct_options qco ON qco.question_id = q.id WHERE p.code = 'B' GROUP BY p.code;"
```

### Rerun Behavior

The script is idempotent for the same dataset:

- existing permits are updated by `code`
- existing topics are updated by `permit_id` + `topic_number`
- existing questions are updated by `external_id`
- question options are replaced on each run to match the JSON source

Rerunning the import with the same file should keep the same permit/topic/question counts while refreshing changed question content.

## Stop

```bash
docker compose down
```

To reset databases:

```bash
docker compose down -v
```
