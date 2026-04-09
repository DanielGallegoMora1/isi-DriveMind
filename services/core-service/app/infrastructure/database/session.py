import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Read Docker Compose env vars or fallback to local SQLite
DB_USER = os.getenv("DB_USER", "core_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "core_password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "core_db")

# If running in Docker (DB_HOST='core-db'), use PostgreSQL. Else, fallback to SQLite.
if DB_HOST == "core-db":
    DATABASE_URL = f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    connect_args = {}
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./core.db")
    connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
