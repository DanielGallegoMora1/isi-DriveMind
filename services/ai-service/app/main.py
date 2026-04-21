from fastapi import FastAPI, Depends
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.infrastructure.database.database import get_db
from app.presentation.routers import ai
from app.presentation.errors import (
    ProblemException,
    problem_exception_handler,
    validation_exception_handler,
)

app = FastAPI(title="DriveMind AI Service", version="1.0.0")
app.add_exception_handler(ProblemException, problem_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

app.include_router(ai.router)


@app.get("/health")
def health(db: Session = Depends(get_db)) -> dict:
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        db_ok = False
        print(f"DB Error: {e}")

    return {
        "status": "ok",
        "service": "ai",
        "db_connected": db_ok,
    }
