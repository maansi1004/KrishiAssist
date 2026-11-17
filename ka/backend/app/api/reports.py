from __future__ import annotations

import io
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from app.i18n import humanize_code, localize_criterion, scheme_text_field, translate, vocab
from app.i18n.http import request_language
from app.i18n.messages import FIELD_LABELS, REPORT, YES_NO, message
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib import colors
from sqlalchemy.orm import Session

from app.auth.dependencies import current_user
from app.db.session import get_db
from app.models.profile import FarmProfile
from app.models.user import User
from app.schemas.profile import FarmerProfile
from app.services.scheme_service import get_scheme
from app.engines.eligibility_engine import evaluate_scheme

router = APIRouter(prefix="/api/reports", tags=["reports"])

# Fix 3: use EVERY profile field, exactly like the app's eligibility check does,
# so the PDF can never disagree with what the farmer saw on screen.
PROFILE_FIELDS = list(FarmerProfile.model_fields.keys())

def _profile(row: FarmProfile | None) -> dict:
    if not row:
        return {}
    return {f: getattr(row, f) for f in PROFILE_FIELDS}

def _text(value) -> str:
    if value is None: return "—"
    if isinstance(value, dict):
        return str(value.get("description") or value.get("name") or value.get("benefitType") or value)
    return str(value)

# ReportLab draws Devanagari letter by letter without Indic shaping (vowel signs and conjuncts come
# out wrong, e.g. "किसान" prints as "कसिान"). A broken Hindi PDF is worse than a clear one, so a Hindi
# request is answered in Hinglish (Roman script) and the response says so in X-Report-Language.
PDF_LANGUAGE = {"en": "en", "hi": "hinglish", "hinglish": "hinglish"}


def _shown(field: str, value, lang: str) -> str:
    """A profile value as the farmer should read it in this language."""
    if value is None:
        return "—"
    if isinstance(value, bool):
        return YES_NO[lang][0 if value else 1]
    if isinstance(value, (list, tuple)):
        return ", ".join(str(v) for v in value) or "—"
    if field == "state":
        return vocab("states", str(value), lang) or str(value)
    return str(value)


@router.get("/scheme/{scheme_code}")
def scheme_report(scheme_code: str, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    scheme = get_scheme(scheme_code)
    if not scheme:
        raise HTTPException(404, "Scheme not found")
    requested = request_language(request)
    lang = PDF_LANGUAGE[requested]
    profile_row = db.query(FarmProfile).filter_by(user_id=user.id).first()
    profile = _profile(profile_row)
    result = evaluate_scheme(scheme, profile)
    T = lambda key: message(REPORT, key, lang)  # noqa: E731

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=42, leftMargin=42, topMargin=42, bottomMargin=42)
    styles = getSampleStyleSheet()
    title = ParagraphStyle("KA_Title", parent=styles["Title"], alignment=TA_CENTER, spaceAfter=14)
    heading = ParagraphStyle("KA_Heading", parent=styles["Heading2"], spaceBefore=12, spaceAfter=6)
    body = styles["BodyText"]
    story = [Paragraph("KrishiAssist", title), Paragraph(T("title"), heading)]
    story += [Paragraph(f"{T('scheme')}: {_text(scheme_text_field(scheme, 'name', lang))} ({scheme_code})", body),
              Paragraph(f"{T('generated')}: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", body), Spacer(1, 8)]
    if requested == "hi":
        story.append(Paragraph("Hindi (Devanagari) PDF abhi available nahi hai; ye report Hinglish mein hai.", body))
    story.append(Paragraph(T("farmer_profile"), heading))
    profile_rows = [[message(FIELD_LABELS, k, lang) if k in FIELD_LABELS else humanize_code(k).title(), _shown(k, v, lang)]
                    for k, v in profile.items() if v not in (None, [], {}) and k != "extra_attributes"]
    if profile_rows:
        table = Table(profile_rows, colWidths=[150, 330])
        table.setStyle(TableStyle([("GRID",(0,0),(-1,-1),0.3,colors.grey),("BACKGROUND",(0,0),(0,-1),colors.whitesmoke),("VALIGN",(0,0),(-1,-1),"TOP")]))
        story.append(table)
    else:
        story.append(Paragraph(T("no_profile"), body))

    story.append(Paragraph(T("eligibility_result"), heading))
    story.append(Paragraph(T(result["status"]), body))
    criteria_rows = [[T("criterion"), T("result"), T("actual")]]
    for c in result.get("criteria", [])[:12]:
        c = localize_criterion(c, lang)
        criteria_rows.append([_text(c.get("criterion")), T(c.get("result", "UNKNOWN")), _shown(c.get("field", ""), c.get("actual"), lang)])
    table = Table(criteria_rows, colWidths=[300, 75, 105], repeatRows=1)
    table.setStyle(TableStyle([("GRID",(0,0),(-1,-1),0.3,colors.grey),("BACKGROUND",(0,0),(-1,0),colors.whitesmoke),("VALIGN",(0,0),(-1,-1),"TOP")]))
    story.append(table)

    def item_text(item):
        if isinstance(item, dict):
            return _text({**item, "name": translate(item.get("name"), lang), "description": translate(item.get("description"), lang)})
        return translate(item, lang)

    def step_text(step):
        return f"{translate(step.get('title'), lang)}: {translate(step.get('description'), lang)}"

    sections = [("benefits", [item_text(i) for i in scheme.get("benefits", [])]),
                ("documents", [item_text(i) for i in scheme.get("documents", [])]),
                ("steps", [step_text(i) for i in scheme.get("actionSteps", [])])]
    for key, items in sections:
        story.append(Paragraph(T(key), heading))
        if items:
            for i, item in enumerate(items[:12], 1):
                story.append(Paragraph(f"{i}. {item}", body))
        else:
            story.append(Paragraph(T("verify"), body))

    story.append(Spacer(1, 10))
    story.append(Paragraph(T("important"), body))
    doc.build(story)
    buf.seek(0)
    filename = f"KrishiAssist_{scheme_code}_report.pdf"
    return StreamingResponse(buf, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Language": lang, "X-Report-Language": lang, "X-Report-Language-Requested": requested,
    })
