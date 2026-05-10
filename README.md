# DriveMind

DriveMind es una aplicación web para la preparación del examen teórico de conducción. Permite gestionar autoescuelas y alumnos, realizar tests de conducción, consultar estadísticas de progreso y utilizar un asistente de IA con conversaciones persistentes.

## Requisitos

- Git
- Docker
- Docker Compose

## Puesta En Marcha Local

1. Clona el repositorio:

```bash
git clone https://github.com/DanielGallegoMora1/isi-DriveMind.git
cd isi-DriveMind
```

2. Levanta el entorno completo:

```bash
docker compose up --build
```

También puedes usar el Makefile incluido:

```bash
make up
```

3. Accede a la aplicación y servicios:

- Frontend: `http://localhost:5173`
- Auth service: `http://localhost:8001`
- Core service: `http://localhost:8002`
- AI service: `http://localhost:8003`

## Credenciales Demo

El entorno local crea usuarios demo por defecto:

- Administrador del sistema: `system.admin@example.com` / `Admin123!`
- Administrador de autoescuela: `school.admin@example.com` / `School123!`
- Estudiante: `student@example.com` / `Student123!`

## Health Checks

Puedes comprobar que los servicios backend están funcionando con:

- `http://localhost:8001/health`
- `http://localhost:8002/health`
- `http://localhost:8003/health`

## Configuración De HuggingFace

El proyecto puede arrancar en local sin configurar variables de entorno adicionales, ya que Docker Compose define valores por defecto para las bases de datos y servicios.

Sin embargo, para que el asistente de IA genere respuestas reales es necesario disponer de un token de HuggingFace y exponerlo mediante la variable de entorno `HF_TOKEN`.

Puedes arrancar el entorno indicando el token directamente:

```bash
HF_TOKEN=<TU_TOKEN_DE_HUGGINGFACE> docker compose up --build
```

También puedes crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
HF_TOKEN=<TU_TOKEN_DE_HUGGINGFACE>
```

Después, inicia el proyecto normalmente:

```bash
docker compose up --build
```

Si `HF_TOKEN` no está definido, el `ai-service` se levanta igualmente, pero las llamadas al asistente de IA no podrán obtener respuestas reales del proveedor externo.

## Comandos Útiles

El proyecto incluye un `Makefile` para simplificar las operaciones habituales.

Levantar el entorno completo:

```bash
make up
```

Comprobar el estado de los contenedores y sus healthchecks:

```bash
make ps
```

Ejecutar comprobaciones básicas post-despliegue:

```bash
make smoke
```

Ver logs de los servicios:

```bash
make logs
```

Generar historial de tests para la cuenta demo `student@example.com`:

```bash
make seed-stats-demo
```

Puedes ajustar el número de intentos y el rango de fechas (para el correcto funcionamiento de los gráficos que requieren datos actuales):


```bash
make seed-stats-demo STATS_ATTEMPTS=30 STATS_START_DATE=2026-05-03 STATS_END_DATE=2026-05-10
```

Generar historial para todos los alumnos creados por rango (`student1@example.com`, `student2@example.com`, etc.):

```bash
make seed-stats-all
```

Preparar todo el entorno con preguntas, alumnos y simulaciones de historial (incluyendo la cuenta demo):

```bash
make seed-all
```

Detener los contenedores:

```bash
make down
```

Resetear bases de datos y volúmenes:

```bash
make reset
```

Reconstruir y levantar el entorno:

```bash
make up
```

## Desarrollo Y Tests

Los tests pueden ejecutarse desde Docker, sin instalar dependencias directamente en el equipo local.

Ejecutar todos los tests disponibles:

```bash
make test
```

Frontend:

```bash
make test-frontend
```

Backend auth:

```bash
make test-auth
```

Backend core:

```bash
make test-core
```

Backend AI:

```bash
make test-ai
```

Además, `docker-compose.yml` define healthchecks para las bases de datos, servicios backend y frontend. Esto permite detectar rápidamente si un contenedor está levantado pero no responde correctamente.
