"""Translations of scheme text, and the helpers that apply them.

``data/i18n/scheme_text.json`` maps the EXACT English text used in ``data/schemes.json`` to its
Hindi and Hinglish versions (plus category/state/level names). The English text in schemes.json
stays the single source of truth, so the eligibility engine never sees translated text.

When a string has no translation the English text is returned (so nothing disappears) AND the
miss is logged once and remembered, so it can be fixed. A fallback is never counted as translated:
``python -m app.scripts.i18n_audit`` fails while any are missing.
"""
from __future__ import annotations

import copy
import json
import logging
import threading
from pathlib import Path
from typing import Any

from .languages import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, normalize_language
from .rules import render_rule, rule_code

log = logging.getLogger("krishiassist.i18n")

CATALOG_FILE = (Path(__file__).resolve().parents[3] / "data/i18n/scheme_text.json").resolve()

_lock = threading.Lock()
_state: dict[str, Any] = {"mtime": None, "entries": {}, "loose": {}, "vocab": {}}
MISSING: dict[str, set[str]] = {"hi": set(), "hinglish": set()}


def _loose(text: str) -> str:
    """Same text ignoring trailing full stops/spaces (some callers trim them)."""
    return text.strip().rstrip(" .")


def _load() -> dict[str, Any]:
    try:
        mtime = CATALOG_FILE.stat().st_mtime
    except FileNotFoundError:
        log.error("Translation catalog not found: %s", CATALOG_FILE)
        return _state
    if _state["mtime"] != mtime:
        with _lock:
            with CATALOG_FILE.open("r", encoding="utf-8") as f:
                raw = json.load(f)
            entries = raw.get("entries", {})
            _state.update(mtime=mtime, entries=entries, vocab=raw.get("vocabulary", {}),
                          loose={_loose(k): v for k, v in entries.items()})
    return _state


def full_catalog() -> dict[str, Any]:
    """Everything the web app needs, in one object (served by GET /api/i18n/catalog)."""
    s = _load()
    return {"languages": list(SUPPORTED_LANGUAGES), "entries": s["entries"], "vocabulary": s["vocab"]}


def translate(text: Any, language: str | None) -> Any:
    """Translate one English scheme string. Non-strings and English pass through unchanged."""
    lang = normalize_language(language) or DEFAULT_LANGUAGE
    if lang == DEFAULT_LANGUAGE or not isinstance(text, str) or not text.strip():
        return text
    s = _load()
    entry = s["entries"].get(text) or s["loose"].get(_loose(text))
    value = (entry or {}).get(lang)
    if value:
        return value
    if text not in MISSING.setdefault(lang, set()):
        MISSING[lang].add(text)
        log.warning("Missing %s translation for scheme text: %r", lang, text[:90])
    return text


def vocab(kind: str, key: str | None, language: str | None) -> str | None:
    """A category / state / level name in a language, or None when the key is unknown."""
    if not key:
        return None
    lang = normalize_language(language) or DEFAULT_LANGUAGE
    item = _load()["vocab"].get(kind, {}).get(key)
    if not item:
        return None
    return item.get(lang) or item.get("en")


def humanize_code(value: str) -> str:
    return str(value).replace("_", " ").strip()


def scheme_text_field(scheme: dict, field: str, language: str | None) -> Any:
    """name / description: the scheme's own curated translation first, then the catalog."""
    lang = normalize_language(language) or DEFAULT_LANGUAGE
    if lang != DEFAULT_LANGUAGE:
        value = ((scheme.get("translations") or {}).get(lang) or {}).get(field)
        if value:
            return value
    return translate(scheme.get(field), lang)


def _rules(node: Any, language: str) -> Any:
    """Translate criterion/remediation texts inside a (nested) rule tree. Returns a copy."""
    if isinstance(node, list):
        return [_rules(n, language) for n in node]
    if not isinstance(node, dict):
        return node
    out = dict(node)
    for key in ("criterion", "remediation", "explanation"):
        if out.get(key):
            out[key] = translate(out[key], language)
    if "conditions" in out:
        out["conditions"] = [_rules(c, language) for c in out["conditions"]]
    if "condition" in out and isinstance(out["condition"], dict):
        out["condition"] = _rules(out["condition"], language)
    return out


_LIST_FIELDS = ("benefits", "coverageConditions", "targetingNotes", "allocationPolicy",
                "geographicTargeting", "procurementConditions", "applicationChannels", "rawSourceText")


def localize_scheme(scheme: dict, language: str | None) -> dict:
    """A copy of one scheme with every user-facing field in ``language``.

    Identifiers are never translated: schemeCode, level, state, category, document ``name``
    (used as a key by the document plan), field names, operators, URLs and numbers.
    Localized labels for state/category/level and documents are added next to them
    (``stateLabel``, ``categoryLabel``, ``levelLabel``, document ``label``).
    English requests get the scheme back untouched.
    """
    lang = normalize_language(language) or DEFAULT_LANGUAGE
    if lang == DEFAULT_LANGUAGE:
        return scheme
    out = copy.deepcopy(scheme)
    out["name"] = scheme_text_field(scheme, "name", lang)
    out["description"] = scheme_text_field(scheme, "description", lang)
    out["implementingDepartment"] = translate(scheme.get("implementingDepartment"), lang)
    out["stateLabel"] = vocab("states", scheme.get("state"), lang) or scheme.get("state")
    out["categoryLabel"] = vocab("categories", scheme.get("category"), lang) or humanize_code(scheme.get("category") or "")
    out["levelLabel"] = vocab("levels", scheme.get("level"), lang) or scheme.get("level")
    for f in _LIST_FIELDS:
        if f in out:
            out[f] = [translate(x, lang) for x in out[f]]
    out["benefitLimits"] = [
        {**b, "description": translate(b.get("description"), lang), "basis": translate(b.get("basis"), lang),
         **({"condition": _rules(b["condition"], lang)} if b.get("condition") else {})}
        for b in scheme.get("benefitLimits", [])
    ]
    out["documents"] = [
        {**d, "label": translate(d.get("name"), lang), "purpose": translate(d.get("purpose"), lang),
         "verificationNote": translate(d.get("verificationNote"), lang)}
        for d in scheme.get("documents", [])
    ]
    out["actionSteps"] = [
        {**a, **{k: translate(a.get(k), lang) for k in ("title", "description", "responsibleParty", "dependency", "source") if a.get(k)}}
        for a in scheme.get("actionSteps", [])
    ]
    out["sources"] = [
        {**s, **{k: translate(s.get(k), lang) for k in ("title", "note") if s.get(k)}} for s in scheme.get("sources", [])
    ]
    for key in ("eligibility", "exclusions"):
        if out.get(key):
            out[key] = _rules(out[key], lang)
    out["verificationConditions"] = [_rules(v, lang) for v in scheme.get("verificationConditions", [])]
    out["language"] = lang
    return out


def _localize_params(params: dict[str, Any] | None, language: str) -> dict[str, Any]:
    p = dict(params or {})
    for key in ("requiredState", "providedState"):
        if p.get(key):
            p[key] = vocab("states", str(p[key]), language) or p[key]
    return p


def localize_criterion(c: dict, language: str) -> dict:
    """One evaluated criterion: translated criterion/remediation and an explanation built from
    its ruleCode. ruleCode/params/result/field etc. are untouched."""
    out = dict(c)
    if not out.get("ruleCode") and out.get("result"):
        # Evaluations saved before ruleCode existed still carry everything needed to derive it.
        out["ruleCode"], out["params"] = rule_code(out.get("field", ""), out.get("operator", ""), out["result"], out.get("expected"), out.get("actual"))
    out["criterion"] = translate(c.get("criterion"), language)
    if c.get("remediation"):
        out["remediation"] = translate(c["remediation"], language)
    if out.get("ruleCode"):
        out["explanation"] = render_rule(out["ruleCode"], _localize_params(out.get("params"), language), language)
    return out


def localize_evaluation(result: dict, language: str | None) -> dict:
    """An eligibility result in one language. Status codes and field names stay as they are."""
    lang = normalize_language(language) or DEFAULT_LANGUAGE
    if lang == DEFAULT_LANGUAGE:
        return result
    out = dict(result)
    for key in ("criteria", "exclusions", "verificationCriteria"):
        out[key] = [localize_criterion(c, lang) for c in result.get(key, [])]
    out["remediation"] = [translate(r, lang) for r in result.get("remediation", [])]
    out["benefits"] = [translate(b, lang) if isinstance(b, str) else b for b in result.get("benefits", [])]
    out["documents"] = [
        {**d, "label": translate(d.get("name"), lang), "purpose": translate(d.get("purpose"), lang)} if isinstance(d, dict) else d
        for d in result.get("documents", [])
    ]
    out["actionPlan"] = [
        {**a, **{k: translate(a.get(k), lang) for k in ("title", "description", "responsibleParty") if a.get(k)}}
        for a in result.get("actionPlan", [])
    ]
    out["language"] = lang
    return out


def missing_report() -> dict[str, list[str]]:
    return {lang: sorted(texts) for lang, texts in MISSING.items()}
