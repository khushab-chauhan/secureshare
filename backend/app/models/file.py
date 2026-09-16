import enum
import uuid
from typing import Optional
from sqlalchemy import BigInteger, Enum, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin


class FileStatus(str, enum.Enum):
    pending = "pending"       # upload-url generated, awaiting upload
    active = "active"         # fully uploaded & verified
    processing = "processing" # Celery thumbnail/virus-scan job running
    error = "error"           # upload failed / hash mismatch
    trash = "trash"           # soft-deleted


class File(Base, TimestampMixin):
    """Represents a logical file owned by a user, living in a folder."""
    __tablename__ = "files"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    mime_type: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    # Owning user
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Parent folder (nullable → root level)
    folder_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Current status
    status: Mapped[FileStatus] = mapped_column(
        Enum(FileStatus, name="file_status_enum"),
        default=FileStatus.pending,
        nullable=False,
        index=True,
    )
    # Aggregate size tracked from latest version
    size_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    # S3 object key of the latest active version
    current_s3_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    folder = relationship("Folder", foreign_keys=[folder_id])
    versions: Mapped[list["FileVersion"]] = relationship(
        "FileVersion",
        back_populates="file",
        cascade="all, delete-orphan",
        order_by="FileVersion.version_number",
    )

    __table_args__ = (
        # Prevent duplicate active filenames in the same folder for a user
        UniqueConstraint("owner_id", "folder_id", "name", "status", name="uq_owner_folder_name_status"),
        Index("idx_files_owner_status", "owner_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<File {self.name} (id={self.id}, status={self.status})>"


class FileVersion(Base, TimestampMixin):
    """One immutable version snapshot of a File (S3 object + metadata)."""
    __tablename__ = "file_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(nullable=False, default=1)
    # S3 key e.g. "uploads/{owner_id}/{file_id}/v1_{original_name}"
    s3_key: Mapped[str] = mapped_column(Text, nullable=False)
    # AWS ETag returned after upload (used to verify integrity)
    etag: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # SHA-256 hex digest of the uploaded content (computed by Celery)
    sha256_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    size_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    mime_type: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    is_latest: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Back-reference to parent file
    file: Mapped["File"] = relationship("File", back_populates="versions")

    __table_args__ = (
        UniqueConstraint("file_id", "version_number", name="uq_file_version"),
        Index("idx_file_versions_file_id_latest", "file_id", "is_latest"),
    )

    def __repr__(self) -> str:
        return f"<FileVersion v{self.version_number} of file_id={self.file_id}>"
