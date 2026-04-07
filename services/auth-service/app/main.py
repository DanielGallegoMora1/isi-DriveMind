from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Annotated

from app.infrastructure.database.database import get_db
from app.presentation.routers import auth_router, school_router, student_router

app = FastAPI(title="DriveMind Auth Service", version="1.0.0")

app.include_router(auth_router.router)
app.include_router(school_router.router)
app.include_router(student_router.router)

DbDep = Annotated[Session, Depends(get_db)]


@app.get("/health")
def health(db: DbDep) -> dict:
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        db_ok = False
        print(f"DB Error: {e}")
    return {"status": "ok", "service": "auth", "db_connected": db_ok}
