"""
File service — orchestrates File and FileVersion database records,
coordinating with S3StorageService for presigned URL generation and
upload verification.
"""
import uuid
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File, FileStatus, FileVersion
from app.models.user import User
from app.schemas.file import (
    CompleteUploadRequest,
    FileDownloadResponse,
    FileRead,
    PresignedUploadRequest,
    PresignedUploadResponse,
)
from app.services.s3_service import PRESIGNED_GET_TTL, PRESIGNED_PUT_TTL, S3StorageService


class FileService:
    """Service for file upload flow, versioning, and retrieval."""

    # ── Upload Flow ───────────────────────────────────────────────────────────

    @staticmethod
    async def initiate_upload(
        db: AsyncSession,
        owner_id: uuid.UUID,
        payload: PresignedUploadRequest,
    ) -> PresignedUploadResponse:
        """
        Step 1 of 2: Create a pending File record and return a presigned PUT URL.
        The client uploads directly to MinIO using this URL.
        """
        # Check user quota
        result = await db.execute(select(User).where(User.id == owner_id))
        user: Optional[User] = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if user.storage_used_bytes + payload.size_bytes > user.storage_quota_bytes:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Storage quota exceeded. Used {user.storage_used_bytes} / {user.storage_quota_bytes} bytes",
            )

        # Create the pending File record
        file_id = uuid.uuid4()
        s3_key = S3StorageService.build_s3_key(owner_id, file_id, payload.file_name, version=1)

        new_file = File(
            id=file_id,
            name=payload.file_name,
            mime_type=payload.content_type,
            owner_id=owner_id,
            folder_id=payload.folder_id,
            status=FileStatus.pending,
            size_bytes=payload.size_bytes,
            current_s3_key=s3_key,
        )
        db.add(new_file)

        # Create version 1 record (still pending)
        version = FileVersion(
            file_id=file_id,
            version_number=1,
            s3_key=s3_key,
            size_bytes=payload.size_bytes,
            mime_type=payload.content_type,
            is_latest=True,
        )
        db.add(version)
        await db.commit()
        await db.refresh(new_file)

        # Generate presigned PUT URL (MinIO)
        upload_url = await S3StorageService.generate_presigned_put_url(
            s3_key=s3_key,
            content_type=payload.content_type,
            size_bytes=payload.size_bytes,
        )

        return PresignedUploadResponse(
            file_id=file_id,
            upload_url=upload_url,
            s3_key=s3_key,
            expires_in_seconds=PRESIGNED_PUT_TTL,
        )

    @staticmethod
    async def complete_upload(
        db: AsyncSession,
        owner_id: uuid.UUID,
        payload: CompleteUploadRequest,
    ) -> FileRead:
        """
        Step 2 of 2: Verify the object exists in S3, record ETag, mark File active,
        and update the user's storage_used_bytes counter.
        """
        # Load the pending file
        result = await db.execute(
            select(File).where(File.id == payload.file_id, File.owner_id == owner_id)
        )
        file: Optional[File] = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File record not found")

        if file.status != FileStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"File is not in pending state (current: {file.status})",
            )

        # Verify object exists in S3
        try:
            head = await S3StorageService.head_object(file.current_s3_key)
        except S3StorageService.ObjectNotFoundError:
            # Mark as error
            file.status = FileStatus.error
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="File not found in storage — upload may have failed",
            )

        s3_etag = head.get("ETag", "").strip('"')
        actual_size = head.get("ContentLength", file.size_bytes)

        # Update FileVersion record with ETag
        await db.execute(
            update(FileVersion)
            .where(FileVersion.file_id == file.id, FileVersion.version_number == 1)
            .values(etag=s3_etag, size_bytes=actual_size)
        )

        # Activate the file
        file.status = FileStatus.active
        file.size_bytes = actual_size

        # Update user storage counter
        await db.execute(
            update(User)
            .where(User.id == owner_id)
            .values(storage_used_bytes=User.storage_used_bytes + actual_size)
        )

        await db.commit()
        await db.refresh(file)
        return FileRead.model_validate(file)

    # ── Retrieval ─────────────────────────────────────────────────────────────

    @staticmethod
    async def list_files(
        db: AsyncSession,
        owner_id: uuid.UUID,
        folder_id: Optional[uuid.UUID] = None,
        include_trash: bool = False,
        only_trash: bool = False,
    ) -> List[FileRead]:
        """List files for the current user, filtered by folder or trash status."""
        if only_trash:
            stmt = select(File).where(
                File.owner_id == owner_id,
                File.status == FileStatus.trash,
            ).order_by(File.updated_at.desc())
            result = await db.execute(stmt)
            files = result.scalars().all()
            return [FileRead.model_validate(f) for f in files]

        statuses = [FileStatus.active, FileStatus.processing]
        if include_trash:
            statuses.append(FileStatus.trash)

        stmt = select(File).where(
            File.owner_id == owner_id,
            File.status.in_(statuses),
            File.folder_id == folder_id,
        ).order_by(File.updated_at.desc())
        result = await db.execute(stmt)
        files = result.scalars().all()
        return [FileRead.model_validate(f) for f in files]

    @staticmethod
    async def get_download_url(
        db: AsyncSession,
        owner_id: uuid.UUID,
        file_id: uuid.UUID,
    ) -> FileDownloadResponse:
        """Generate a short-lived presigned GET URL for downloading the file."""
        result = await db.execute(
            select(File).where(
                File.id == file_id,
                File.owner_id == owner_id,
                File.status == FileStatus.active,
            )
        )
        file: Optional[File] = result.scalar_one_or_none()

        if not file or not file.current_s3_key:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        download_url = await S3StorageService.generate_presigned_get_url(
            s3_key=file.current_s3_key,
            file_name=file.name,
        )

        return FileDownloadResponse(
            file_id=file.id,
            file_name=file.name,
            download_url=download_url,
            expires_in_seconds=PRESIGNED_GET_TTL,
        )

    @staticmethod
    async def soft_delete_file(
        db: AsyncSession,
        owner_id: uuid.UUID,
        file_id: uuid.UUID,
    ) -> None:
        """Move a file to trash (soft delete)."""
        result = await db.execute(
            select(File).where(File.id == file_id, File.owner_id == owner_id)
        )
        file: Optional[File] = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        file.status = FileStatus.trash
        await db.commit()

    @staticmethod
    async def restore_file(
        db: AsyncSession,
        owner_id: uuid.UUID,
        file_id: uuid.UUID,
    ) -> FileRead:
        """Restore a soft-deleted file from trash back to active."""
        result = await db.execute(
            select(File).where(File.id == file_id, File.owner_id == owner_id)
        )
        file: Optional[File] = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        file.status = FileStatus.active
        await db.commit()
        await db.refresh(file)
        return FileRead.model_validate(file)

    @staticmethod
    async def permanent_delete_file(
        db: AsyncSession,
        owner_id: uuid.UUID,
        file_id: uuid.UUID,
    ) -> None:
        """Permanently delete a file from database and update quota."""
        result = await db.execute(
            select(File).where(File.id == file_id, File.owner_id == owner_id)
        )
        file: Optional[File] = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        # Reduce storage usage
        if file.size_bytes:
            await db.execute(
                update(User)
                .where(User.id == owner_id)
                .values(storage_used_bytes=User.storage_used_bytes - file.size_bytes)
            )

        await db.delete(file)
        await db.commit()

    @staticmethod
    async def update_file(
        db: AsyncSession,
        owner_id: uuid.UUID,
        file_id: uuid.UUID,
        name: Optional[str] = None,
        folder_id: Optional[uuid.UUID] = None,
    ) -> FileRead:
        """Rename a file or move it to another folder."""
        result = await db.execute(
            select(File).where(File.id == file_id, File.owner_id == owner_id)
        )
        file: Optional[File] = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        if name is not None and name.strip():
            file.name = name.strip()
        if folder_id is not None:
            file.folder_id = folder_id

        await db.commit()
        await db.refresh(file)
        return FileRead.model_validate(file)

