
from fastapi import APIRouter, Depends, HTTPException, Request
from app.i18n import localize_evaluation
from app.i18n.http import request_language
from app.auth.dependencies import optional_current_user
from app.models.user import User
from app.schemas.eligibility import EligibilityRequest
from app.services.scheme_service import get_scheme
from app.engines.eligibility_engine import evaluate_scheme

router = APIRouter(prefix="/api/eligibility", tags=["eligibility"])


@router.post("/evaluate")
def evaluate(
    request: EligibilityRequest,
    http: Request,
    user: User | None = Depends(optional_current_user),
):
    scheme = get_scheme(request.scheme_code)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    return localize_evaluation(evaluate_scheme(scheme, request.profile.model_dump()), request_language(http))
