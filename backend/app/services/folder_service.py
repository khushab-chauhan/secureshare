import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.folder import Folder
from app.schemas.folder import BreadcrumbItem, FolderCreate, FolderUpdate


class FolderService:
    @staticmethod
    async def get_by_id(
        db: AsyncSession, folder_id: uuid.UUID, user_id: uuid.UUID
    ) -> Folder:
        """Fetch folder by ID, ensuring user ownership and not in trash."""
        result = await db.execute(
            select(Folder).where(
                Folder.id == folder_id,
                Folder.owner_id == user_id,
                Folder.is_trash == False,
            )
        )
        folder = result.scalar_one_or_none()
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found or has been moved to trash.",
            )
        return folder

    @staticmethod
    async def create_folder(
        db: AsyncSession, user_id: uuid.UUID, folder_in: FolderCreate
    ) -> Folder:
        """Creates a new folder and computes its indexed materialized path."""
        new_id = uuid.uuid4()
        depth = 0
        path = f"/{new_id}/"

        if folder_in.parent_id:
            # Validate parent folder
            parent = await FolderService.get_by_id(db, folder_in.parent_id, user_id)
            depth = parent.depth + 1
            path = f"{parent.path}{new_id}/"

        # Check for duplicate folder name in same parent
        query = select(Folder).where(
            Folder.owner_id == user_id,
            Folder.parent_id == folder_in.parent_id,
            Folder.name == folder_in.name,
            Folder.is_trash == False,
        )
        existing = (await db.execute(query)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A folder named '{folder_in.name}' already exists in this directory.",
            )

        new_folder = Folder(
            id=new_id,
            name=folder_in.name,
            owner_id=user_id,
            parent_id=folder_in.parent_id,
            path=path,
            depth=depth,
            is_trash=False,
        )
        db.add(new_folder)
        await db.commit()
        await db.refresh(new_folder)
        return new_folder

    @staticmethod
    async def list_folders(
        db: AsyncSession,
        user_id: uuid.UUID,
        parent_id: Optional[uuid.UUID] = None,
        is_trash: bool = False,
    ) -> List[Folder]:
        """Lists folders in the specified parent directory."""
        query = select(Folder).where(
            Folder.owner_id == user_id,
            Folder.parent_id == parent_id,
            Folder.is_trash == is_trash,
        ).order_by(Folder.name.asc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_breadcrumbs(
        db: AsyncSession, folder: Folder, user_id: uuid.UUID
    ) -> List[BreadcrumbItem]:
        """Parses the materialized path and returns ordered breadcrumbs in a single query."""
        # path format: "/{id1}/{id2}/{id3}/"
        path_ids = [uuid.UUID(part) for part in folder.path.strip("/").split("/") if part]
        
        result = await db.execute(
            select(Folder).where(Folder.id.in_(path_ids), Folder.owner_id == user_id)
        )
        folders_dict = {f.id: f for f in result.scalars().all()}
        
        breadcrumbs = []
        for pid in path_ids:
            if pid in folders_dict:
                breadcrumbs.append(
                    BreadcrumbItem(id=folders_dict[pid].id, name=folders_dict[pid].name)
                )
        return breadcrumbs

    @staticmethod
    async def update_folder(
        db: AsyncSession,
        folder_id: uuid.UUID,
        user_id: uuid.UUID,
        folder_update: FolderUpdate,
    ) -> Folder:
        """Renames or moves a folder, safely updating all child paths with cycle detection."""
        folder = await FolderService.get_by_id(db, folder_id, user_id)
        old_path = folder.path

        # 1. Handle Rename
        if folder_update.name and folder_update.name != folder.name:
            # Verify uniqueness in parent
            dup = await db.execute(
                select(Folder).where(
                    Folder.owner_id == user_id,
                    Folder.parent_id == folder.parent_id,
                    Folder.name == folder_update.name,
                    Folder.is_trash == False,
                    Folder.id != folder.id,
                )
            )
            if dup.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A folder named '{folder_update.name}' already exists in this directory.",
                )
            folder.name = folder_update.name

        # 2. Handle Move (Changing parent_id)
        if folder_update.parent_id is not None and folder_update.parent_id != folder.parent_id:
            # Cycle detection: You cannot move a folder inside itself or its descendants!
            if str(folder.id) in f"/{folder_update.parent_id}/":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot move a folder into itself.",
                )

            new_parent = await FolderService.get_by_id(db, folder_update.parent_id, user_id)
            if new_parent.path.startswith(old_path):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot move a folder into one of its own subfolders (cycle detected).",
                )

            new_path = f"{new_parent.path}{folder.id}/"
            new_depth = new_parent.depth + 1
            depth_delta = new_depth - folder.depth

            # Update child folders' materialized paths and depths in batch
            # Any child starts with old_path
            children_query = select(Folder).where(
                Folder.owner_id == user_id,
                Folder.path.startswith(old_path),
                Folder.id != folder.id,
            )
            children = (await db.execute(children_query)).scalars().all()
            for child in children:
                child.path = child.path.replace(old_path, new_path, 1)
                child.depth = child.depth + depth_delta

            folder.parent_id = new_parent.id
            folder.path = new_path
            folder.depth = new_depth

        await db.commit()
        await db.refresh(folder)
        return folder

    @staticmethod
    async def soft_delete_folder(
        db: AsyncSession, folder_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        """Soft-deletes a folder and all its descendant subfolders to trash."""
        folder = await FolderService.get_by_id(db, folder_id, user_id)
        
        # Mark this folder and all subfolders as is_trash=True
        await db.execute(
            update(Folder)
            .where(
                Folder.owner_id == user_id,
                Folder.path.startswith(folder.path),
            )
            .values(is_trash=True)
        )
        await db.commit()
