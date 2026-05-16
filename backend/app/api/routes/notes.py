from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.note import Note
from app.models.note_share import NoteShare, SharePermission
from app.models.note_version import NoteVersion
from app.models.notification import Notification
from app.models.user import User
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate
from app.schemas.share import ShareNoteRequest, SuccessMessage
from app.schemas.version import NoteVersionResponse

router = APIRouter(tags=["notes"])

def get_owner_note_or_404(db: Session, note_id: str, user_id: str) -> Note:
    note = db.scalar(select(Note).where(Note.id == note_id, Note.owner_id == user_id))
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note

def get_accessible_note_or_404(db: Session, note_id: str, user_id: str) -> Note:
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    if note.owner_id == user_id:
        return note

    share = db.scalar(
        select(NoteShare).where(
            NoteShare.note_id == note_id,
            NoteShare.shared_with_user_id == user_id,
        )
    )
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note

def get_editable_note_or_403(db: Session, note_id: str, user_id: str) -> Note:
    """Checks if user is owner OR has write permission."""
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    if note.owner_id == user_id:
        return note

    share = db.scalar(
        select(NoteShare).where(
            NoteShare.note_id == note_id,
            NoteShare.shared_with_user_id == user_id,
            NoteShare.permission == SharePermission.write
        )
    )
    if not share:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You only have view access to this note.")
    return note

def next_version_number(db: Session, note_id: str) -> int:
    current_max = db.scalar(
        select(func.max(NoteVersion.version_number)).where(NoteVersion.note_id == note_id)
    )
    return (current_max or 0) + 1

def create_version_snapshot(db: Session, note: Note, edited_by_user_id: str):
    db.add(
        NoteVersion(
            note_id=note.id,
            edited_by_user_id=edited_by_user_id,
            version_number=next_version_number(db, note.id),
            title=note.title,
            content=note.content,
        )
    )

@router.get("/notes", response_model=list[NoteResponse])
def get_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Fetch notes owned by the user OR shared with the user
    notes = db.scalars(
        select(Note)
        .outerjoin(NoteShare, Note.id == NoteShare.note_id)
        .where(
            or_(
                Note.owner_id == current_user.id,
                NoteShare.shared_with_user_id == current_user.id
            )
        )
        .order_by(Note.updated_at.desc())
        .distinct()
    ).all()
    return notes

@router.get("/notes/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_accessible_note_or_404(db, note_id, current_user.id)

@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    note = Note(
        owner_id=current_user.id,
        title=payload.title.strip(),
        content=payload.content.strip(),
        created_at=now,
        updated_at=now,
    )
    db.add(note)
    db.flush()
    create_version_snapshot(db, note, current_user.id)
    db.commit()
    db.refresh(note)
    return note

@router.put("/notes/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: str,
    payload: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Now uses the new RBAC check (Owner or Write Access)
    note = get_editable_note_or_403(db, note_id, current_user.id)
    
    note.title = payload.title.strip()
    note.content = payload.content.strip()
    note.updated_at = datetime.now(timezone.utc)
    db.flush()
    create_version_snapshot(db, note, current_user.id)
    db.commit()
    db.refresh(note)
    return note

@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = get_owner_note_or_404(db, note_id, current_user.id)
    db.delete(note)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/notes/{note_id}/share", response_model=SuccessMessage)
def share_note(
    note_id: str,
    payload: ShareNoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = get_owner_note_or_404(db, note_id, current_user.id)
    recipient = db.scalar(select(User).where(User.email == payload.share_with_email.lower()))
    
    if not recipient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if recipient.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot share note with yourself")

    # Upsert the share (Update permission if it already exists, otherwise create)
    existing_share = db.scalar(
        select(NoteShare).where(
            NoteShare.note_id == note.id,
            NoteShare.shared_with_user_id == recipient.id,
        )
    )
    
    if existing_share:
        existing_share.permission = payload.permission
    else:
        db.add(NoteShare(note_id=note.id, shared_with_user_id=recipient.id, permission=payload.permission))
        
    # Create the Notification for the recipient
    notification_msg = f"{current_user.email} shared a note with you as {payload.permission.value}r."
    new_notification = Notification(
        user_id=recipient.id,
        actor_id=current_user.id,
        note_id=note.id,
        message=notification_msg
    )
    db.add(new_notification)
    db.commit()

    return {"message": f"Note shared successfully with {payload.permission.value} access."}

@router.get("/notes/{note_id}/history", response_model=list[NoteVersionResponse])
def get_note_history(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_accessible_note_or_404(db, note_id, current_user.id)
    versions = db.scalars(
        select(NoteVersion)
        .where(NoteVersion.note_id == note_id)
        .order_by(NoteVersion.version_number.desc())
    ).all()
    return versions

@router.post("/notes/{note_id}/restore/{version_id}", response_model=NoteResponse)
def restore_note_version(
    note_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = get_owner_note_or_404(db, note_id, current_user.id)
    version = db.scalar(
        select(NoteVersion).where(
            NoteVersion.id == version_id,
            NoteVersion.note_id == note_id,
        )
    )
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")

    note.title = version.title
    note.content = version.content
    note.updated_at = datetime.now(timezone.utc)
    db.flush()
    create_version_snapshot(db, note, current_user.id)
    db.commit()
    db.refresh(note)
    return note