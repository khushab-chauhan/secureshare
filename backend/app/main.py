from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine
# Import all models so SQLAlchemy registers them for create_all
from app.models import user, folder, file  # noqa: F401
from app.services.s3_service import S3StorageService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes database tables on startup (and teardown on shutdown)."""
    async with engine.begin() as conn:
        # Creates all declared tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
    # Ensure MinIO bucket exists
    await S3StorageService.ensure_bucket_exists()
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise Document Management & Secure File Sharing Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }

# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)
