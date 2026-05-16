from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.meta import router as meta_router
from app.api.routes.notes import router as notes_router
# Import the new notifications router
from app.api.routes.notifications import router as notifications_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(meta_router)
api_router.include_router(notes_router)
# Register the router
api_router.include_router(notifications_router)