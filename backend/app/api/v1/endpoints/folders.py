import uuid
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.folder import FolderCreate, FolderDetail, FolderRead, FolderUpdate
from app.services.folder_service import FolderService

router = APIRouter()


@router.post("/", response_model=FolderRead, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder_in: FolderCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Creates a new folder at root or inside a parent directory."""
    return await FolderService.create_folder(db, current_user.id, folder_in)


@router.get("/", response_model=List[FolderRead])
async def list_folders(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    parent_id: Optional[uuid.UUID] = Query(None, description="Parent folder ID. None for root folders."),
    is_trash: bool = Query(False, description="Filter trash folders"),
):
    """Lists folders for the authenticated user inside a parent directory or root."""
    return await FolderService.list_folders(db, current_user.id, parent_id, is_trash)


@router.get("/{folder_id}", response_model=FolderDetail)
async def get_folder(
    folder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieves a folder's details along with its full breadcrumb path."""
    folder = await FolderService.get_by_id(db, folder_id, current_user.id)
    breadcrumbs = await FolderService.get_breadcrumbs(db, folder, current_user.id)
    
    folder_detail = FolderDetail.model_validate(folder)
    folder_detail.breadcrumbs = breadcrumbs
    return folder_detail


@router.patch("/{folder_id}", response_model=FolderRead)
async def update_folder(
    folder_id: uuid.UUID,
    folder_update: FolderUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Renames or moves a folder, updating its hierarchy safely."""
    return await FolderService.update_folder(db, folder_id, current_user.id, folder_update)


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Soft-deletes a folder and all its subfolders to trash."""
    await FolderService.soft_delete_folder(db, folder_id, current_user.id)
    return None
