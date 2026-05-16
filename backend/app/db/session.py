from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings

settings = get_settings()

engine_kwargs = {
    "connect_args": {"check_same_thread": False} if settings.is_sqlite else {},
}

if settings.database_url in {"sqlite://", "sqlite:///:memory:"}:
    engine_kwargs["poolclass"] = StaticPool
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(
    settings.database_url,
    **engine_kwargs,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
