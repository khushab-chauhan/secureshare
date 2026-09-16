from typing import List
from pydantic import AnyHttpUrl, EmailStr, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # App Basics
    APP_NAME: str = "SecureShare"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change-this-in-production-use-a-strong-random-secret-key-32-chars"
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Security & JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Database (PostgreSQL)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5433
    POSTGRES_USER: str = "secureshare"
    POSTGRES_PASSWORD: str = "secureshare_secret"
    POSTGRES_DB: str = "secureshare_db"
    DATABASE_URL: str = "postgresql+asyncpg://secureshare:secureshare_secret@localhost:5433/secureshare_db"

    # Redis Cache & Token Blacklist
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6380
    REDIS_URL: str = "redis://localhost:6380/0"

    # Celery & RabbitMQ
    CELERY_BROKER_URL: str = "amqp://guest:guest@localhost:5672//"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6380/1"

    # Object Storage (AWS S3 or Local MinIO)
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "secureshare-files"
    S3_REGION: str = "us-east-1"
    S3_USE_SSL: bool = False

    # Default user quota (5 GB in bytes)
    DEFAULT_STORAGE_QUOTA_BYTES: int = 5 * 1024 * 1024 * 1024


settings = Settings()
