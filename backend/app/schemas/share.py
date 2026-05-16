from pydantic import BaseModel, EmailStr
from app.models.note_share import SharePermission

class ShareNoteRequest(BaseModel):
    share_with_email: EmailStr
    permission: SharePermission = SharePermission.read

class SuccessMessage(BaseModel):
    message: str