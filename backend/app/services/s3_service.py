"""
S3StorageService — async wrapper around boto3 for MinIO / AWS S3 operations.

All boto3 calls are blocking. We run them in a ThreadPoolExecutor via
asyncio.get_event_loop().run_in_executor() so they don't block the async
event loop.
"""
import asyncio
import hashlib
import io
import uuid
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Optional

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings

# Module-level thread pool for blocking boto3 I/O
_executor = ThreadPoolExecutor(max_workers=4)

# Presigned URL TTL (seconds)
PRESIGNED_PUT_TTL = 900   # 15 min – client must start upload within this window
PRESIGNED_GET_TTL = 300   # 5 min  – short-lived download link


def _make_s3_client():
    """Create a synchronous boto3 S3 client configured for MinIO."""
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION,
        config=Config(
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "standard"},
        ),
        use_ssl=settings.S3_USE_SSL,
    )


async def _run_in_executor(fn, *args, **kwargs):
    """Run a blocking function in the thread pool and return a coroutine."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, partial(fn, *args, **kwargs))


class S3StorageService:
    """High-level async service for S3 / MinIO operations."""

    # ── S3 Key Generation ──────────────────────────────────────────────────

    @staticmethod
    def build_s3_key(owner_id: uuid.UUID, file_id: uuid.UUID, file_name: str, version: int = 1) -> str:
        """
        Deterministic, collision-resistant S3 key.
        Pattern: uploads/{owner_id}/{file_id}/v{version}_{original_name}
        """
        safe_name = file_name.replace(" ", "_")
        return f"uploads/{owner_id}/{file_id}/v{version}_{safe_name}"

    # ── Presigned URL Generation ────────────────────────────────────────────

    @staticmethod
    async def generate_presigned_put_url(
        s3_key: str,
        content_type: str,
        size_bytes: int,
    ) -> str:
        """
        Generate a presigned PUT URL so the browser can upload directly to MinIO
        without routing through the application server.
        """
        client = _make_s3_client()

        def _generate():
            return client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": settings.S3_BUCKET_NAME,
                    "Key": s3_key,
                    "ContentType": content_type,
                    "ContentLength": size_bytes,
                },
                ExpiresIn=PRESIGNED_PUT_TTL,
            )

        return await _run_in_executor(_generate)

    @staticmethod
    async def generate_presigned_get_url(s3_key: str, file_name: str) -> str:
        """Generate a short-lived GET URL for downloading a file."""
        client = _make_s3_client()

        def _generate():
            return client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": settings.S3_BUCKET_NAME,
                    "Key": s3_key,
                    "ResponseContentDisposition": f'attachment; filename="{file_name}"',
                },
                ExpiresIn=PRESIGNED_GET_TTL,
            )

        return await _run_in_executor(_generate)

    # ── Object Introspection ────────────────────────────────────────────────

    @staticmethod
    async def head_object(s3_key: str) -> dict:
        """
        Fetch the ETag and content-length of an S3 object.
        Raises S3StorageService.ObjectNotFoundError if the object doesn't exist.
        """
        client = _make_s3_client()

        def _head():
            try:
                return client.head_object(Bucket=settings.S3_BUCKET_NAME, Key=s3_key)
            except ClientError as e:
                if e.response["Error"]["Code"] in ("404", "NoSuchKey"):
                    raise S3StorageService.ObjectNotFoundError(s3_key)
                raise

        return await _run_in_executor(_head)

    @staticmethod
    async def compute_sha256(s3_key: str) -> str:
        """
        Stream the object from S3 and compute its SHA-256 hex digest.
        Used by the post-upload verification / Celery task.
        """
        client = _make_s3_client()

        def _download_and_hash():
            response = client.get_object(Bucket=settings.S3_BUCKET_NAME, Key=s3_key)
            sha256 = hashlib.sha256()
            for chunk in response["Body"].iter_chunks(chunk_size=8 * 1024 * 1024):
                sha256.update(chunk)
            return sha256.hexdigest()

        return await _run_in_executor(_download_and_hash)

    @staticmethod
    async def delete_object(s3_key: str) -> None:
        """Permanently delete an object from S3 (used for cleanup on error)."""
        client = _make_s3_client()

        def _delete():
            client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=s3_key)

        await _run_in_executor(_delete)

    @staticmethod
    async def ensure_bucket_exists() -> None:
        """Create the configured bucket if it doesn't already exist."""
        client = _make_s3_client()

        def _create():
            try:
                client.head_bucket(Bucket=settings.S3_BUCKET_NAME)
            except ClientError as e:
                code = e.response["Error"]["Code"]
                if code in ("404", "NoSuchBucket"):
                    client.create_bucket(Bucket=settings.S3_BUCKET_NAME)
                else:
                    raise

        await _run_in_executor(_create)

    # ── Custom Exceptions ───────────────────────────────────────────────────

    class ObjectNotFoundError(Exception):
        def __init__(self, key: str):
            super().__init__(f"S3 object not found: {key}")
            self.key = key
