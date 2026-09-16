from datetime import datetime
import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BreadcrumbItem(BaseModel):
    id: uuid.UUID
    name: str

    model_config = ConfigDict(from_attributes=True)


class FolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class FolderCreate(FolderBase):
    parent_id: Optional[uuid.UUID] = None


class FolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    parent_id: Optional[uuid.UUID] = None


class FolderRead(FolderBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    parent_id: Optional[uuid.UUID]
    path: str
    depth: int
    is_trash: bool
    created_at: datetime
    updated_at: datetime
    files_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class FolderDetail(FolderRead):
    breadcrumbs: List[BreadcrumbItem] = []
