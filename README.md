# isi-DriveMind

## Requisitos

- Docker
- Docker Compose

## Arranque base del Sprint 1

```bash
docker compose up --build
```

El entorno base ahora levanta:

- Frontend (Vite): `http://localhost:5173`
- Auth service: `http://localhost:8001`
- Core service: `http://localhost:8002`
- AI service: `http://localhost:8003`

Health checks disponibles:

- `http://localhost:8001/health`
- `http://localhost:8002/health`
- `http://localhost:8003/health`

## Contrato público validado en Sprint 1

La convención pública del sistema usa prefijo global `/api/v1`.

Endpoints mínimos ya alineados en `auth-service`:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/schools`
- `GET /api/v1/auth/students`

El frontend consume `auth-service` vía `/api`, por lo que el login queda accesible desde el navegador contra `/api/v1/auth/login` usando el proxy de Vite.

## Credenciales demo de auth-service

`auth-service` bootstrappea usuarios reutilizables al iniciar por defecto.

- `system.admin@example.com` / `Admin123!`
- `school.admin@example.com` / `School123!`
- `student@example.com` / `Student123!`

Para desactivar ese bootstrap:

```bash
AUTH_BOOTSTRAP_DEMO_USERS=false docker compose up --build
```

## Nota sobre `HF_TOKEN`

En Sprint 1 el entorno base NO requiere integrar HuggingFace en runtime.

- Si `HF_TOKEN` no está definido, `ai-service` sigue levantando igualmente.
- La integración real con HuggingFace queda para el Sprint 4, tal como marca `Planning.md`.

## Smoke checks mínimos de cierre técnico

1. Verificar que la composición Docker sea válida:

   ```bash
   docker compose config
   ```

2. Verificar health de backend:

   - `http://localhost:8001/health`
   - `http://localhost:8002/health`
   - `http://localhost:8003/health`

3. Verificar frontend base:

   - abrir `http://localhost:5173`
   - confirmar que la app carga
   - confirmar que el flujo de login apunta a `/api/v1/auth/login`

4. Verificar contrato público de auth:

   ```bash
   curl -X POST http://localhost:8001/api/v1/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"system.admin@example.com","password":"Admin123!"}'
   ```

## Parada y reset

Detener entorno:

```bash
docker compose down
```

Resetear bases y volumen de frontend:

```bash
docker compose down -v
```
