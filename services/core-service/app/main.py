import os

from fastapi import FastAPI

REQUIRED_DB_ENV = ("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD")
DB_CONFIGURED = all(os.getenv(key) for key in REQUIRED_DB_ENV)

app = FastAPI()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "core",
        "db_configured": DB_CONFIGURED,
    }
