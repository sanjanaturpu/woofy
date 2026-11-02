"""PostgreSQL connection and SQLAlchemy session management for Woofy."""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    # Safe local default; set DATABASE_URL in .env for your PostgreSQL database.
    DATABASE_URL = "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/woofy"

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
