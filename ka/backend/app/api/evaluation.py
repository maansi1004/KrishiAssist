from fastapi import APIRouter, Depends, HTTPException, Request
from app.i18n import localize_criterion, localize_evaluation, translate
from app.i18n.http import request_language
from sqlalchemy.orm import Session

from app.auth.dependencies import current_user
from app.db.session import get_db
from app.engines.eligibility_engine import evaluate_scheme
from app.models.evaluation import Evaluation
from app.models.user import User
from app.schemas.eligibility import EligibilityRequest
from app.services.audit import log_event
from app.services.scheme_service import get_scheme
from app.services.versioning import rule_fingerprint, scheme_version

router = APIRouter(prefix="/api/eligibility", tags=["eligibility"])


@router.post("/evaluate")
def evaluate(request: EligibilityRequest, http: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    scheme = get_scheme(request.scheme_code)
    if not scheme:
        raise HTTPException(404, "Scheme not found")
    profile = request.profile.model_dump()
    result = evaluate_scheme(scheme, profile)
    version, rules = scheme_version(scheme), rule_fingerprint(scheme)
    ev = Evaluation(
        user_id=user.id,
        scheme_code=request.scheme_code,
        scheme_version=version,
        rule_version=rules,
        overall_result=result["status"],
        profile_snapshot=profile,
        criterion_results=result["criteria"],
        missing_fields=result["missingRequirements"],
        remediation_steps=result["remediation"],
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    result["evaluationId"] = ev.id
    result["schemeVersion"] = version
    result["ruleVersion"] = rules
    log_event(db, user.id, "evaluation_run", {
        "scheme_code": request.scheme_code, "status": result["status"],
        "scheme_version": version, "rule_version": rules, "evaluation_id": result["evaluationId"],
    })
    # Saved and audited in the canonical (English) form above; only the reply is translated.
    return localize_evaluation(result, request_language(http))


@router.get("/history")
def history(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(Evaluation).filter_by(user_id=user.id).order_by(Evaluation.created_at.desc()).all()
    return [
        {
            "id": r.id, "schemeCode": r.scheme_code, "status": r.overall_result, "createdAt": r.created_at,
            "missingRequirements": r.missing_fields, "schemeVersion": r.scheme_version, "ruleVersion": r.rule_version,
        }
        for r in rows
    ]


@router.get("/history/{evaluation_id}")
def history_detail(evaluation_id: int, http: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """One past evaluation, exactly as it was decided: the profile used, every criterion result,
    and which version of the rules was applied."""
    row = db.query(Evaluation).filter_by(id=evaluation_id, user_id=user.id).first()
    if not row:
        raise HTTPException(404, "Evaluation not found")
    scheme = get_scheme(row.scheme_code)
    lang = request_language(http)
    return {
        "id": row.id, "schemeCode": row.scheme_code, "status": row.overall_result, "createdAt": row.created_at,
        "schemeVersion": row.scheme_version, "ruleVersion": row.rule_version,
        # True when the scheme's rules were edited after this evaluation was made.
        "rulesChangedSince": bool(scheme) and rule_fingerprint(scheme) != row.rule_version,
        "profileSnapshot": row.profile_snapshot, "criteria": [localize_criterion(c, lang) if lang != "en" else c for c in row.criterion_results],
        "missingRequirements": row.missing_fields, "remediation": [translate(r, lang) for r in row.remediation_steps] if lang != "en" else row.remediation_steps,
    }
