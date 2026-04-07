from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.infrastructure.database.database import get_db

app = FastAPI()


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
