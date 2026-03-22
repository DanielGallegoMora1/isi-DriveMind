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

## Stop

```bash
docker compose down
```

To reset databases:

```bash
docker compose down -v
```
