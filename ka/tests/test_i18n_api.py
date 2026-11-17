"""Language support through the real API (needs the web stack, like the other API tests).

Rules checked here:
  * English stays the default and the old response fields do not change (backward compatible);
  * ?lang= / Accept-Language return every user-facing field in that language;
  * eligibility results carry structured rule codes; errors carry codes while `detail` stays English;
  * server-built output (PDF report, assistant reply) follows the language.
"""
import re
import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
DEV = re.compile(r"[\u0900-\u097F]")
GUJARAT_FARMER = {"farmer_name": "Test", "state": "Gujarat", "farmer_type": "farmer", "land_size_hectares": 1.0, "age": 40}


def farmer(profile=None):
    email = f"{uuid.uuid4().hex[:8]}@example.com"
    token = client.post("/api/auth/register", json={"name": "Test Farmer", "email": email, "password": "StrongPass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    if profile is not None:
        assert client.post("/api/profile", json=profile, headers=headers).status_code in (200, 201)
    return headers


def test_schemes_are_english_by_default_and_localized_on_request():
    english = client.get("/api/schemes").json()
    assert english[0]["name"] and not DEV.search(english[0]["benefits"][0])
    by_query = client.get("/api/schemes?lang=hi").json()
    by_header = client.get("/api/schemes", headers={"Accept-Language": "hi-IN,hi;q=0.9"}).json()
    assert len(by_query) == len(by_header) == len(english)
    for scheme in by_query:
        assert DEV.search(scheme["name"]) and DEV.search(scheme["description"]) and scheme["language"] == "hi"
        assert all(DEV.search(b) or not re.search(r"[a-z]{4,} [a-z]{4,}", b) for b in scheme["benefits"])
    assert [s["schemeCode"] for s in by_query] == [s["schemeCode"] for s in english], "identifiers do not change"


def test_one_scheme_in_hinglish_is_roman_script_and_keeps_amounts():
    s = client.get("/api/schemes/AGR-50?lang=hinglish").json()
    assert not DEV.search(s["description"]) and "45,000" in " ".join(s["benefits"])
    assert s["eligibility"]["conditions"][0]["criterion"] == "Applicant Gujarat ka sthayi niwasi hona chahiye"


def test_catalog_endpoint_serves_the_translations():
    data = client.get("/api/i18n/catalog").json()
    assert data["languages"] == ["en", "hi", "hinglish"] and len(data["entries"]) > 400
    assert data["entries"]["Aadhaar"]["hi"] == "आधार" and "categories" in data["vocabulary"]


def test_evaluation_returns_rule_codes_and_localizes_on_request():
    headers = farmer({**GUJARAT_FARMER, "state": "Punjab"})
    body = {"scheme_code": "AGR-2", "profile": {**GUJARAT_FARMER, "state": "Punjab"}}
    en = client.post("/api/eligibility/evaluate", json=body, headers=headers).json()
    first = en["criteria"][0]
    assert first["ruleCode"] == "RESIDENCY_MISMATCH" and first["params"]["requiredState"] == "Gujarat" and first["params"]["providedState"] == "Punjab"
    assert first["result"] == "FAIL" and first["explanation"] and not DEV.search(first["criterion"]), "old fields unchanged"
    hi = client.post("/api/eligibility/evaluate", json=body, headers={**headers, "Accept-Language": "hi"}).json()
    assert hi["status"] == en["status"] and hi["criteria"][0]["ruleCode"] == "RESIDENCY_MISMATCH"
    assert DEV.search(hi["criteria"][0]["criterion"]) and DEV.search(hi["criteria"][0]["explanation"])
    assert all(DEV.search(r) for r in hi["remediation"])


def test_history_detail_is_stored_canonical_and_localized_on_read():
    headers = farmer({**GUJARAT_FARMER, "state": "Punjab"})
    client.post("/api/eligibility/evaluate", json={"scheme_code": "AGR-2", "profile": {**GUJARAT_FARMER, "state": "Punjab"}}, headers=headers)
    row = client.get("/api/eligibility/history", headers=headers).json()[0]
    en = client.get(f"/api/eligibility/history/{row['id']}", headers=headers).json()
    hi = client.get(f"/api/eligibility/history/{row['id']}", headers={**headers, "Accept-Language": "hi"}).json()
    assert not DEV.search(en["criteria"][0]["criterion"]) and DEV.search(hi["criteria"][0]["criterion"])
    assert hi["criteria"][0]["ruleCode"], "a code exists in every language"


def test_errors_keep_english_detail_and_add_a_code():
    dup = {"name": "A Farmer", "email": f"{uuid.uuid4().hex[:8]}@example.com", "password": "StrongPass123"}
    assert client.post("/api/auth/register", json=dup).status_code == 200
    r = client.post("/api/auth/register", json=dup)
    assert r.status_code == 409 and r.json()["detail"] == "Email already registered" and r.json()["code"] == "EMAIL_EXISTS"
    r = client.get("/api/profile")
    assert r.status_code == 401 and r.json()["code"] == "AUTH_REQUIRED" and r.json()["detail"] == "Valid login is required"
    r = client.get("/api/schemes/NOPE")
    assert r.status_code == 404 and r.json()["code"] == "SCHEME_NOT_FOUND" and r.json()["detail"] == "Scheme not found"
    r = client.post("/api/auth/login", json={"email": "nobody@example.com"})  # incomplete body
    assert r.status_code == 422 and r.json()["code"] == "VALIDATION_ERROR" and isinstance(r.json()["detail"], list)


def test_rate_limit_error_carries_its_parameters():
    codes = []
    for _ in range(8):
        r = client.post("/api/auth/login", json={"email": "limit@example.com", "password": "wrong-password"})
        codes.append(r.json().get("code"))
    assert "RATE_LIMITED" in codes
    limited = next(c for c in codes if c == "RATE_LIMITED")
    r = client.post("/api/auth/login", json={"email": "limit@example.com", "password": "wrong-password"})
    assert r.json()["params"]["what"] == "sign-in" and r.json()["params"]["minutes"].isdigit() and limited


def test_match_summary_carries_the_exact_failed_rule_text():
    headers = farmer({**GUJARAT_FARMER, "state": "Punjab"})
    data = client.get("/api/matches", headers=headers).json()
    failed = [m for group in data["groups"].values() for m in group if m.get("reason")]
    assert failed, "a Punjab farmer fails at least one state-specific scheme"
    for m in failed:
        assert m["reasonCriterion"] and m["reasonCriterion"].rstrip(" .") == m["reason"], "reason keeps its old value; reasonCriterion is the translatable text"


def test_need_extraction_notes_have_codes():
    headers = farmer(GUJARAT_FARMER)
    r = client.post("/api/need/extract", json={"text": "I have 2 acres of land in Gujarat and need a tractor", "language": "hi"}, headers=headers).json()
    assert len(r["notes"]) == len(r["noteCodes"]) and any(n["code"] == "ACRES_CONVERTED" for n in r["noteCodes"])


def test_document_plan_labels_follow_the_language():
    headers = farmer(GUJARAT_FARMER)
    en = client.get("/api/documents/plan/AGR-2", headers=headers).json()
    hi = client.get("/api/documents/plan/AGR-2", headers={**headers, "Accept-Language": "hi"}).json()
    assert [i["name"] for i in en["items"]] == [i["name"] for i in hi["items"]], "the English name stays the identifier"
    assert all(DEV.search(i["label"]) for i in hi["items"]) and en["items"][0]["label"] == en["items"][0]["name"]


def test_report_follows_the_language_and_says_when_hindi_falls_back():
    headers = farmer(GUJARAT_FARMER)
    en = client.get("/api/reports/scheme/AGR-2", headers=headers)
    assert en.status_code == 200 and en.content.startswith(b"%PDF") and en.headers["X-Report-Language"] == "en"
    hl = client.get("/api/reports/scheme/AGR-2", headers={**headers, "Accept-Language": "hinglish"})
    assert hl.headers["X-Report-Language"] == "hinglish" and hl.headers["X-Report-Language-Requested"] == "hinglish"
    hi = client.get("/api/reports/scheme/AGR-2", headers={**headers, "Accept-Language": "hi"})
    # ReportLab cannot shape Devanagari, so a Hindi request is answered in Hinglish, and the response says so.
    assert hi.status_code == 200 and hi.headers["X-Report-Language"] == "hinglish" and hi.headers["X-Report-Language-Requested"] == "hi"


def test_assistant_reply_has_no_untranslated_scheme_text_in_hindi_and_keeps_canonical_eligibility():
    headers = farmer(GUJARAT_FARMER)
    data = client.post("/api/assistant/chat", json={"message": "Am I eligible for tractor subsidy?", "language": "hi"}, headers=headers).json()
    assert "Pre-approval must be obtained" not in data["reply"] and "पूर्व-स्वीकृति" in data["reply"]
    assert data["eligibility"]["criteria"][0]["ruleCode"] and not DEV.search(data["eligibility"]["criteria"][0]["criterion"]), "embedded result stays canonical for the app to translate"
