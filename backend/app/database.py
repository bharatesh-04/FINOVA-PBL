"""
Database configuration and connection setup
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from config import settings


# Helper to create an engine with sensible defaults and a fallback
def _create_engine_with_fallback(db_url: str):
    """Create SQLAlchemy engine, attempting the configured DB first.
    If a non-SQLite DB fails to connect, fall back to a local SQLite file.
    """
    try:
        if "sqlite" in db_url:
            return create_engine(
                db_url,
                connect_args={"check_same_thread": False},
                echo=False,
            )

        # Non-sqlite engines (Postgres) - use connection health checks
        eng = create_engine(
            db_url,
            echo=False,
            pool_pre_ping=True,
            pool_recycle=3600,
        )

        # Try a short connection to validate availability
        conn = eng.connect()
        conn.close()
        return eng

    except Exception as exc:
        # If the configured DB is unreachable, fall back to SQLite.
        # Use a local file so the app remains functional for demos/dev.
        fallback_path = "sqlite:///./finance_tracker_fallback.db"
        print("WARNING: primary database unavailable, falling back to SQLite:", exc)
        return create_engine(
            fallback_path,
            connect_args={"check_same_thread": False},
            echo=False,
        )


# Create database engine (with fallback behaviour)
engine = _create_engine_with_fallback(settings.DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db():
    """
    Dependency to get database session
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database by creating all tables"""
    Base.metadata.create_all(bind=engine)
