"""Translation audit for scheme data (run from the backend folder):

    python -m app.scripts.i18n_audit            # print the report, exit 1 if anything is wrong
    python -m app.scripts.i18n_audit --write    # also write docs/translation-audit-report.md

Checks: every scheme string has a non-empty Hindi and Hinglish text; Hindi is in Devanagari and
Hinglish is not; nothing is silently identical to English; amounts, percentages, numbers and
acronyms survived; name/description translations exist for every scheme; category, state and level
names exist; rule codes have text in all languages; the catalog has no stale entries.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

from app.i18n.catalog import CATALOG_FILE
from app.i18n.extract import scheme_strings
from app.i18n.languages import SUPPORTED_LANGUAGES
from app.i18n.rules import RULE_CODES, RULE_TEXT

ROOT = CATALOG_FILE.parents[2]
SCHEMES = ROOT / "data/schemes.json"
DEVANAGARI = re.compile(r"[\u0900-\u097F]")
TOKENS = re.compile(r"₹[\d,]*\d|\d+(?:\.\d+)?%|\d+(?:,\d+)*(?:\.\d+)?|\b[A-Z][A-Z0-9\-]{2,}\b")
# Text that is correct unchanged: acronyms, portal names, file names, a lone number.
KEEP_AS_IS = re.compile(r"^[A-Za-z0-9 .\-/&()%₹]*$")


def _identical_ok(text: str, lang: str, keep: dict) -> bool:
    """Identical to English is fine for acronym-only text and for strings someone reviewed
    and listed in the catalog's _meta.keep_as_is."""
    return not re.search(r"[a-z]", text) or text in keep.get(lang, [])


def run() -> dict:
    catalog = json.loads(CATALOG_FILE.read_text(encoding="utf-8"))
    entries, vocab = catalog["entries"], catalog.get("vocabulary", {})
    keep = catalog.get("_meta", {}).get("keep_as_is", {})
    schemes = json.loads(SCHEMES.read_text(encoding="utf-8"))
    problems: list[dict] = []
    warnings: list[dict] = []

    def problem(kind, where, text, lang=None):
        problems.append({"kind": kind, "where": where, "lang": lang, "text": text})

    used: set[str] = set()
    for s in schemes:
        for where, text in scheme_strings(s):
            used.add(text)
            e = entries.get(text)
            if not e:
                problem("missing_entry", f"{s['schemeCode']} · {where}", text)
    for text in sorted(used):
        e = entries.get(text)
        if not e:
            continue
        for lang in ("hi", "hinglish"):
            v = (e.get(lang) or "").strip()
            if not v:
                problem("empty_translation", "catalog", text, lang)
                continue
            if lang == "hi" and not DEVANAGARI.search(v) and not _identical_ok(text, "hi", keep):
                problem("hindi_not_devanagari", "catalog", text, lang)
            if lang == "hinglish" and DEVANAGARI.search(v):
                problem("hinglish_has_devanagari", "catalog", text, lang)
            if v == text and not _identical_ok(text, lang, keep):
                problem("identical_to_english", "catalog", text, lang)
            for token in set(TOKENS.findall(text)):
                if token.rstrip(",") not in v:
                    problem("token_not_preserved", f"{token}", text, lang)
    for text in sorted(set(entries) - used):
        warnings.append({"kind": "stale_entry", "text": text})

    for s in schemes:
        tr = s.get("translations", {})
        for lang in ("hi", "hinglish"):
            block = tr.get(lang) or {}
            for field in ("name", "description"):
                v = (block.get(field) or "").strip()
                if not v:
                    problem("missing_scheme_translation", f"{s['schemeCode']}.{field}", s[field], lang)
                elif lang == "hi" and not DEVANAGARI.search(v) and field == "description":
                    problem("hindi_not_devanagari", f"{s['schemeCode']}.{field}", v[:80], lang)
                elif lang == "hinglish" and DEVANAGARI.search(v):
                    problem("hinglish_has_devanagari", f"{s['schemeCode']}.{field}", v[:80], lang)
                elif lang == "hinglish" and field == "description" and v == s[field]:
                    problem("identical_to_english", f"{s['schemeCode']}.{field}", v[:80], lang)
            if lang == "hi" and block.get("name") and not DEVANAGARI.search(block["name"]):
                problem("hindi_name_not_devanagari", s["schemeCode"], block["name"], lang)

    for kind, field in (("categories", "category"), ("states", "state"), ("levels", "level")):
        for s in schemes:
            item = vocab.get(kind, {}).get(s[field])
            if not item or not all(item.get(l) for l in SUPPORTED_LANGUAGES):
                problem("missing_vocabulary", f"{kind}.{s[field]}", s[field])

    for code in RULE_CODES:
        for lang in SUPPORTED_LANGUAGES:
            if not (RULE_TEXT.get(code, {}).get(lang) or "").strip():
                problem("missing_rule_text", code, code, lang)

    # The web app's locale files must agree with the vocabulary above.
    locales = ROOT / "frontend/src/i18n/locales"
    if locales.exists():
        for lang in SUPPORTED_LANGUAGES:
            f = locales / f"{lang}.json"
            if not f.exists():
                continue
            loc = json.loads(f.read_text(encoding="utf-8"))
            for kind in ("categories", "states"):
                for key, item in vocab.get(kind, {}).items():
                    if (loc.get(kind) or {}).get(key) != item.get(lang):
                        problem("frontend_vocabulary_mismatch", f"{lang}.{kind}.{key}", item.get(lang) or key, lang)

    return {
        "date": date.today().isoformat(), "schemes": len(schemes), "catalogEntries": len(entries),
        "stringsInUse": len(used), "problems": problems, "warnings": warnings,
    }


def to_markdown(r: dict) -> str:
    by_kind: dict[str, list[dict]] = {}
    for p in r["problems"]:
        by_kind.setdefault(p["kind"], []).append(p)
    lines = [
        "# Scheme data translation audit", "",
        f"Generated {r['date']} by `python -m app.scripts.i18n_audit --write`.", "",
        f"* Schemes checked: **{r['schemes']}**",
        f"* Translatable strings in use: **{r['stringsInUse']}** (catalog entries: {r['catalogEntries']})",
        f"* Problems: **{len(r['problems'])}**   Warnings: **{len(r['warnings'])}**", "",
    ]
    if not r["problems"]:
        lines.append("Every scheme string has a Hindi and a Hinglish translation, and amounts, percentages, "
                     "numbers and acronyms are preserved. No English fallback is needed.")
    for kind, items in sorted(by_kind.items()):
        lines += ["", f"## {kind} ({len(items)})", ""]
        lines += [f"* `{p['where']}`{' [' + p['lang'] + ']' if p['lang'] else ''}: {p['text'][:110]}" for p in items[:60]]
    if r["warnings"]:
        lines += ["", f"## Warnings ({len(r['warnings'])})", ""]
        lines += [f"* {w['kind']}: {w['text'][:110]}" for w in r["warnings"][:40]]
    return "\n".join(lines) + "\n"


def main(argv: list[str]) -> int:
    r = run()
    text = to_markdown(r)
    print(text)
    if "--write" in argv:
        out = ROOT / "docs/translation-audit-report.md"
        out.parent.mkdir(exist_ok=True)
        existing = out.read_text(encoding="utf-8") if out.exists() else ""
        # Keep the frontend section (written by the web app's audit) when refreshing this one.
        marker = "\n<!-- FRONTEND-AUDIT -->"
        tail = existing[existing.index(marker):] if marker in existing else ""
        out.write_text(text + tail, encoding="utf-8")
    return 1 if r["problems"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
