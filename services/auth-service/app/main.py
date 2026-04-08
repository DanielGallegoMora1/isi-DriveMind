from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.infrastructure.bootstrap import ensure_demo_users
from app.infrastructure.config import settings
from app.infrastructure.database.database import Base, SessionLocal, engine, get_db
from app.presentation.routers import auth_router, school_router, student_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    if settings.bootstrap_demo_users:
        db = SessionLocal()
        try:
            ensure_demo_users(db)
        finally:
            db.close()
    yield


app = FastAPI(title="DriveMind Auth Service", version="1.0.0", lifespan=lifespan)

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
