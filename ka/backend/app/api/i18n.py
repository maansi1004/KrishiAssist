"""Translation data for the web app."""
from fastapi import APIRouter, Response

from app.i18n import full_catalog

router = APIRouter(prefix="/api/i18n", tags=["i18n"])


@router.get("/catalog")
def catalog(response: Response):
    """Scheme-text translations (English text -> Hindi/Hinglish) and category/state names.
    The web app loads this once so a language change updates scheme content instantly."""
    response.headers["Cache-Control"] = "public, max-age=300"
    return full_catalog()
