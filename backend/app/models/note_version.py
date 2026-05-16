from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class NoteVersion(Base):
    __tablename__ = "note_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    note_id: Mapped[str] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"), index=True)
    edited_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    version_number: Mapped[int] = mapped_column(Integer())
    title: Mapped[str] = mapped_column(String(160))
    content: Mapped[str] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    note = relationship("Note", back_populates="versions")
