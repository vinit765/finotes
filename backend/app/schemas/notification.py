from datetime import datetime
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    id: str
    message: str
    note_id: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}