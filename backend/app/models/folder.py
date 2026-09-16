import uuid
from typing import Optional
from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin


class Folder(Base, TimestampMixin):
    __tablename__ = "folders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    # Materialized Path: e.g. "/{root_id}/{child_id}/"
    path: Mapped[str] = mapped_column(
        String(1024),
        nullable=False,
        index=True,
    )
    depth: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    is_trash: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    # Relationships
    children: Mapped[list["Folder"]] = relationship(
        "Folder",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
    parent: Mapped[Optional["Folder"]] = relationship(
        "Folder",
        back_populates="children",
        remote_side=[id],
    )

    __table_args__ = (
        # Ensure no duplicate active folder names inside the same parent directory for a user
        UniqueConstraint("owner_id", "parent_id", "name", "is_trash", name="uq_owner_parent_name_trash"),
        Index("idx_folders_path_pattern", "path"),
    )

    def __repr__(self) -> str:
        return f"<Folder {self.name} (id={self.id}, depth={self.depth})>"
