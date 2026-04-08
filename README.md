# isi-DriveMind

## Prerequisites

- Docker
- Docker Compose

## Bootstrap (Docker only)

```bash
docker compose up --build
```

The local `auth-service` bootstraps reusable demo credentials on startup by default.

Demo users:

- `system.admin@example.com` / `Admin123!`
- `school.admin@example.com` / `School123!`
- `student@example.com` / `Student123!`

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

To disable the local auth bootstrap:

```bash
AUTH_BOOTSTRAP_DEMO_USERS=false docker compose up --build
```
