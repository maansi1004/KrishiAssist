"""Language support: the parts that need no web server (run with the rest: pytest -q).

Covers the language chooser, the scheme-text catalog, scheme/evaluation localization, structured
eligibility reasons (rule codes), API error codes and the translation audit itself.
"""
import json
import re
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.engines.eligibility_engine import evaluate_scheme  # noqa: E402
from app.i18n import catalog  # noqa: E402
from app.i18n.errors import error_info  # noqa: E402
from app.i18n.languages import resolve_language  # noqa: E402
from app.i18n.messages import FIELD_LABELS, REPORT  # noqa: E402
from app.i18n.rules import RULE_CODES, RULE_TEXT, render_rule, rule_code  # noqa: E402

SCHEMES = json.loads((ROOT / "data/schemes.json").read_text(encoding="utf-8"))
DEVANAGARI = re.compile(r"[\u0900-\u097F]")
PROFILES = [
    {"state": "Punjab", "farmer_type": "farmer", "land_size_hectares": 1.5, "age": 34, "social_category": "OBC"},
    {"state": "Gujarat", "farmer_type": "tenant_farmer", "land_size_hectares": 0.5, "age": 61},
    {},
]


def test_language_is_read_from_query_or_header():
    assert resolve_language("hi-IN,hi;q=0.9,en;q=0.8") == "hi"
    assert resolve_language("fr, en;q=0.5") == "en"
    assert resolve_language(None, "Hinglish") == "hinglish"
    assert resolve_language("hi", "en") == "en", "an explicit ?lang= wins over the header"
    assert resolve_language("de") == "en" and resolve_language(None, None) == "en"


def test_every_scheme_localizes_without_any_missing_translation():
    catalog.MISSING["hi"].clear()
    catalog.MISSING["hinglish"].clear()
    for lang in ("hi", "hinglish"):
        for s in SCHEMES:
            x = catalog.localize_scheme(s, lang)
            assert x["language"] == lang and x["schemeCode"] == s["schemeCode"]
            assert x["state"] == s["state"] and x["category"] == s["category"], "identifiers are never translated"
            assert x["categoryLabel"] and x["stateLabel"]
    assert catalog.missing_report() == {"hi": [], "hinglish": []}


def test_english_requests_get_the_scheme_untouched():
    s = SCHEMES[0]
    assert catalog.localize_scheme(s, "en") is s
    assert catalog.localize_scheme(s, None) is s


def test_localized_scheme_translates_content_but_keeps_identifiers_and_numbers():
    s = next(x for x in SCHEMES if x["schemeCode"] == "AGR-50")
    hi = catalog.localize_scheme(s, "hi")
    assert DEVANAGARI.search(hi["benefits"][0]) and "45,000" in hi["benefits"][0]
    assert hi["documents"][0]["name"] == s["documents"][0]["name"], "document name is the key of the document plan"
    assert DEVANAGARI.search(hi["documents"][0]["label"])
    first = hi["eligibility"]["conditions"][0]
    assert first["criterion"] == "आवेदक गुजरात का स्थायी निवासी होना चाहिए"
    assert first["fieldName"] == s["eligibility"]["conditions"][0]["fieldName"], "field names are never translated"
    assert hi["categoryLabel"] == "कृषि मशीनीकरण" and hi["stateLabel"] == "गुजरात"
    assert s["benefits"][0] != hi["benefits"][0], "the original scheme must not be modified"


def test_scheme_names_previously_left_in_english_are_translated():
    for code in ("HR-AGRI-PWD-001", "GA-MANURE-001", "GA-VERMICOMPOST-001", "RAD-IFS-001"):
        s = next(x for x in SCHEMES if x["schemeCode"] == code)
        assert DEVANAGARI.search(catalog.localize_scheme(s, "hi")["name"]), code
        assert DEVANAGARI.search(catalog.localize_scheme(s, "hi")["description"]), code
        assert catalog.localize_scheme(s, "hinglish")["description"] != s["description"], code


def test_translate_ignores_trailing_full_stop_and_reports_a_genuine_miss():
    assert catalog.translate("Applicant must be a permanent Gujarat resident.", "hi") == "आवेदक गुजरात का स्थायी निवासी होना चाहिए"
    catalog.MISSING["hi"].clear()
    assert catalog.translate("This sentence is not in the catalog", "hi") == "This sentence is not in the catalog", "falls back to English, never to nothing"
    assert "This sentence is not in the catalog" in catalog.missing_report()["hi"], "and the miss is recorded"
    catalog.MISSING["hi"].clear()


def test_engine_returns_a_rule_code_for_every_criterion_and_keeps_the_old_fields():
    seen = set()
    for s in SCHEMES:
        for p in PROFILES:
            r = evaluate_scheme(s, p)
            for c in r["criteria"] + r["exclusions"] + r["verificationCriteria"]:
                assert c["ruleCode"] in RULE_CODES, c["ruleCode"]
                assert {"field", "operator", "expected", "actual"} <= set(c["params"])
                assert c["explanation"] and c["criterion"] and c["result"] in ("PASS", "FAIL", "UNKNOWN"), "existing fields stay"
                seen.add(c["ruleCode"])
    assert {"RESIDENCY_MISMATCH", "RULE_PASSED", "RULE_UNKNOWN"} <= seen


def test_residency_mismatch_matches_the_documented_shape():
    code, params = rule_code("state", "equals", "FAIL", "Gujarat", "Punjab")
    assert code == "RESIDENCY_MISMATCH" and params["requiredState"] == "Gujarat" and params["providedState"] == "Punjab"
    assert render_rule(code, params, "en") == "This scheme is for Gujarat, but your profile says Punjab."
    assert "Gujarat" in render_rule(code, params, "hi") and DEVANAGARI.search(render_rule(code, params, "hi"))
    assert "Ye scheme Gujarat ke liye hai" in render_rule(code, params, "hinglish")


def test_every_rule_code_has_text_in_all_languages_with_matching_placeholders():
    for code in RULE_CODES:
        names = {lang: set(re.findall(r"\{(\w+)\}", RULE_TEXT[code][lang])) for lang in ("en", "hi", "hinglish")}
        assert names["en"] == names["hi"] == names["hinglish"], code
        assert DEVANAGARI.search(RULE_TEXT[code]["hi"]) and not DEVANAGARI.search(RULE_TEXT[code]["hinglish"]), code


def test_localized_evaluation_keeps_machine_values_and_translates_text():
    s = next(x for x in SCHEMES if x["schemeCode"] == "AGR-2")
    r = evaluate_scheme(s, PROFILES[0])
    hi = catalog.localize_evaluation(r, "hi")
    assert hi["status"] == r["status"] and hi["failedRequirements"] == r["failedRequirements"], "codes are not translated"
    c, c_en = hi["criteria"][0], r["criteria"][0]
    assert c["ruleCode"] == c_en["ruleCode"] == "RESIDENCY_MISMATCH" and c["field"] == "state"
    assert DEVANAGARI.search(c["criterion"]) and DEVANAGARI.search(c["explanation"]) and "गुजरात" in c["explanation"] and "पंजाब" in c["explanation"]
    assert all(DEVANAGARI.search(x) for x in hi["remediation"]), hi["remediation"]
    assert not DEVANAGARI.search(r["criteria"][0]["explanation"]) and not DEVANAGARI.search(r["criteria"][0]["criterion"]), "the original English result is not changed"
    assert catalog.localize_evaluation(r, "en") is r


def test_results_saved_before_rule_codes_existed_are_still_localized():
    old = {"field": "state", "operator": "equals", "expected": "Gujarat", "actual": "Punjab", "result": "FAIL",
           "criterion": "Applicant must be a permanent Gujarat resident", "explanation": "old english"}
    out = catalog.localize_criterion(old, "hi")
    assert out["ruleCode"] == "RESIDENCY_MISMATCH" and "पंजाब" in out["explanation"]


def test_every_backend_error_message_has_a_specific_code():
    import glob
    pat = re.compile(r'HTTPException\(\s*(?:status_code\s*=\s*)?([\w.]+)\s*,\s*(?:detail\s*=\s*)?(f?)(["\'])(.+?)\3', re.S)
    generic = {"NOT_FOUND", "FORBIDDEN", "CONFLICT", "REQUEST_FAILED", "VALIDATION_ERROR", "INTERNAL_ERROR"}
    found = 0
    for f in glob.glob(str(ROOT / "backend/app/**/*.py"), recursive=True):
        for m in pat.finditer(Path(f).read_text(encoding="utf-8")):
            status, is_f, _, text = m.groups()
            if is_f:
                text = re.sub(r"\{[^}]*\}", "5", text)
            status_num = {"HTTP_401_UNAUTHORIZED": 401, "HTTP_403_FORBIDDEN": 403}.get(status, int(status) if status.isdigit() else 400)
            info = error_info(status_num, text)
            found += 1
            if "attempts" not in text:  # rate-limit text is built from variables
                assert info["code"] not in generic, f"{Path(f).name}: {text!r} -> {info['code']}"
    assert found >= 20
    assert error_info(429, "Too many sign-in attempts. Please try again in 3 minutes.") == {"code": "RATE_LIMITED", "params": {"what": "sign-in", "minutes": "3"}}
    assert error_info(413, "The file is larger than 5 MB")["params"] == {"mb": "5"}


def test_need_extraction_notes_come_with_codes():
    stub = types.ModuleType("app.services.llm")
    stub.ask_llm = lambda *a, **k: None
    sys.modules.setdefault("app.services.llm", stub)
    from app.services import need_extraction as ne

    out = ne.extract_need("I have 2 acres in Gujarat and Punjab and need a tractor")
    assert len(out["notes"]) == len(out["noteCodes"]) > 0
    assert {n["code"] for n in out["noteCodes"]} <= {"SEVERAL_STATES", "SEVERAL_LAND_SIZES", "BIGHA_NOT_CONVERTED", "ACRES_CONVERTED", "NOTHING_FOUND"}
    assert all(isinstance(n, str) for n in out["notes"]), "the English sentences stay for older callers"
    assert any(n["code"] == "ACRES_CONVERTED" and n["params"]["hectares"] for n in out["noteCodes"])


def test_report_and_field_label_tables_are_complete():
    for table in (REPORT, FIELD_LABELS):
        for key, langs in table.items():
            assert set(langs) == {"en", "hi", "hinglish"} and all(v.strip() for v in langs.values()), key
            assert DEVANAGARI.search(langs["hi"]) and not DEVANAGARI.search(langs["hinglish"]), key


def test_scheme_data_translation_audit_is_clean():
    from app.scripts.i18n_audit import run

    report = run()
    assert report["problems"] == [], report["problems"][:5]
    assert report["stringsInUse"] >= 500
