from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.infrastructure.database.session import get_db, engine
from app.infrastructure.database.models import Base

from app.presentation.routers import catalog, tests, stats

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DriveMind Core Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog.router, prefix="/api/v1")
app.include_router(tests.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")


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
        "service": "core",
        "db_connected": db_ok,
    }
