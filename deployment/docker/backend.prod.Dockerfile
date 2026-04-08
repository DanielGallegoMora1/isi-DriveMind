# Dockerfile genérico para servicios backend FastAPI (Producción)
# Uso: docker build -f deployment/docker/backend.prod.Dockerfile --build-arg SERVICE_PATH=services/auth-service .

FROM python:3.11-slim as builder

WORKDIR /build

# Instalamos dependencias de sistema si fueran necesarias para compilar paquetes
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage final: Runtime
FROM python:3.11-slim as runtime

WORKDIR /app

# Copiamos solo los paquetes instalados del builder (evitamos capas basura)
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/app

# Copiamos la aplicación
COPY app ./app

# Por defecto usamos 8000, configurable por ENV
EXPOSE 8000

# Usuario no-root para mayor seguridad
RUN useradd -m drivemind
USER drivemind

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
