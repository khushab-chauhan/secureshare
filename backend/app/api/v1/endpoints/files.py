import uuid
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.file import (
    CompleteUploadRequest,
    FileDownloadResponse,
    FileRead,
    PresignedUploadRequest,
    PresignedUploadResponse,
)
from app.services.file_service import FileService

router = APIRouter()


@router.post(
    "/upload-url",
    response_model=PresignedUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Step 1: Generate a presigned PUT URL for direct browser→MinIO upload",
)
async def initiate_file_upload(
    payload: PresignedUploadRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Creates a pending File record and returns a short-lived presigned PUT URL.
    The frontend uploads the file **directly** to MinIO using this URL,
    bypassing the API server for bandwidth efficiency.
    """
    return await FileService.initiate_upload(db, current_user.id, payload)


@router.post(
    "/complete-upload",
    response_model=FileRead,
    summary="Step 2: Confirm upload success and activate the file record",
)
async def complete_file_upload(
    payload: CompleteUploadRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Verifies the object exists in S3 (HEAD request), records the ETag,
    marks the file as 'active', and debits the user's storage quota.
    """
    return await FileService.complete_upload(db, current_user.id, payload)


@router.get(
    "/",
    response_model=List[FileRead],
    summary="List files in a folder",
)
async def list_files(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    folder_id: Optional[uuid.UUID] = Query(None, description="Filter by folder. None = root level files."),
    include_trash: bool = Query(False),
):
    """Returns all active files owned by the user, optionally filtered by folder."""
    return await FileService.list_files(db, current_user.id, folder_id, include_trash)


@router.get(
    "/{file_id}/download-url",
    response_model=FileDownloadResponse,
    summary="Get a short-lived presigned download URL for a file",
)
async def get_download_url(
    file_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Generates a 5-minute presigned GET URL for the file's current S3 object."""
    return await FileService.get_download_url(db, current_user.id, file_id)


@router.delete(
    "/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a file (move to Trash)",
)
async def delete_file(
    file_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Moves the file to Trash. Data is not immediately removed from S3."""
    await FileService.soft_delete_file(db, current_user.id, file_id)
    return None
