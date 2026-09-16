import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator

from app.models.file import FileStatus


# ─── Upload Flow Schemas ──────────────────────────────────────────────────────

class PresignedUploadRequest(BaseModel):
    """Request body to generate a presigned PUT URL for direct-to-S3 upload."""
    file_name: str
    content_type: str
    size_bytes: int
    folder_id: Optional[uuid.UUID] = None

    @field_validator("size_bytes")
    @classmethod
    def check_size(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("size_bytes must be positive")
        # Max 2 GB per upload
        if v > 2 * 1024 * 1024 * 1024:
            raise ValueError("File size exceeds the 2 GB single-upload limit")
        return v

    @field_validator("content_type")
    @classmethod
    def check_content_type(cls, v: str) -> str:
        # Allowlist MIME types supported for upload
        ALLOWED = {
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "video/mp4",
            "video/quicktime",
            "text/plain",
            "application/zip",
        }
        if v not in ALLOWED:
            raise ValueError(f"Content type '{v}' is not allowed")
        return v


class PresignedUploadResponse(BaseModel):
    """Response with presigned URL and the pending file record ID."""
    file_id: uuid.UUID
    upload_url: str
    s3_key: str
    expires_in_seconds: int


class CompleteUploadRequest(BaseModel):
    """Confirms that the client successfully PUT the file to MinIO."""
    file_id: uuid.UUID
    etag: str          # ETag header returned by MinIO after upload


class FileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    mime_type: Optional[str]
    owner_id: uuid.UUID
    folder_id: Optional[uuid.UUID]
    status: FileStatus
    size_bytes: int
    current_s3_key: Optional[str]
    created_at: datetime
    updated_at: datetime


class FileVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_id: uuid.UUID
    version_number: int
    s3_key: str
    etag: Optional[str]
    sha256_hash: Optional[str]
    size_bytes: int
    mime_type: Optional[str]
    is_latest: bool
    created_at: datetime


class FileDownloadResponse(BaseModel):
    """Short-lived presigned GET URL for downloading a file."""
    file_id: uuid.UUID
    file_name: str
    download_url: str
    expires_in_seconds: int


class FileUpdateRequest(BaseModel):
    """Request body to rename or move a file."""
    name: Optional[str] = None
    folder_id: Optional[uuid.UUID] = None

