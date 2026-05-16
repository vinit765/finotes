from datetime import datetime

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    content: str = Field(min_length=1, max_length=20000)


class NoteUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    content: str = Field(min_length=1, max_length=20000)


class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
