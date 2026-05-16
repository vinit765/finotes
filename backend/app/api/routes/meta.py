from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.meta import AboutResponse

router = APIRouter(tags=["meta"])
settings = get_settings()


@router.get("/about", response_model=AboutResponse)
def about():
    features = {
        "note_version_history": (
            "Each note keeps a version history so edits can be reviewed and restored safely."
        )
    }
    return {
        "name": settings.about_name,
        "email": settings.about_email,
        "my_features": features,
        "my_features_display": features,
    }


@router.get("/health")
def health():
    return {"status": "ok"}
