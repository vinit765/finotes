from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    actor_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    note_id: Mapped[str] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"))
    message: Mapped[str] = mapped_column(Text())
    is_read: Mapped[bool] = mapped_column(Boolean(), default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )