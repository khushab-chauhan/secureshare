from fastapi import APIRouter
from app.api.v1.endpoints import auth, folders, files

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(folders.router, prefix="/folders", tags=["Folders"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
