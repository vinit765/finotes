from datetime import datetime, timezone
from enum import Enum as PyEnum
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

# Added the Enum for RBAC
class SharePermission(PyEnum):
    read = "read"
    write = "write"

class NoteShare(Base):
    __tablename__ = "note_shares"
    __table_args__ = (UniqueConstraint("note_id", "shared_with_user_id", name="uq_note_share"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    note_id: Mapped[str] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"), index=True)
    shared_with_user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    
    # The new permission column
    permission: Mapped[SharePermission] = mapped_column(
        Enum(SharePermission),
        default=SharePermission.read,
        nullable=False,
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    note = relationship("Note", back_populates="shares")
    shared_with_user = relationship("User", back_populates="shared_notes")