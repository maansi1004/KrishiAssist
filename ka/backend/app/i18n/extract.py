"""Every piece of user-facing text inside a scheme record: the single definition of
'what needs a translation' used by the catalog and the audit."""
from __future__ import annotations

from typing import Iterator

LIST_FIELDS = ("benefits", "coverageConditions", "targetingNotes", "allocationPolicy", "geographicTargeting",
               "procurementConditions", "applicationChannels", "rawSourceText")


def _rule_texts(node: dict) -> Iterator[tuple[str, str]]:
    if "conditions" in node:
        for child in node["conditions"]:
            yield from _rule_texts(child)
        return
    for key in ("criterion", "explanation", "remediation"):
        if node.get(key):
            yield f"rule.{key}", node[key]


def scheme_strings(scheme: dict) -> Iterator[tuple[str, str]]:
    """(where, English text) for every catalog-translated string of one scheme.

    name / description / shortName / category / state are not here: name and description have
    their own ``translations`` block, category/state/level come from the vocabulary, and
    shortName is an acronym or official name that stays as written."""
    if scheme.get("implementingDepartment"):
        yield "implementingDepartment", scheme["implementingDepartment"]
    for key in ("eligibility", "exclusions"):
        if scheme.get(key):
            yield from _rule_texts(scheme[key])
    for rule in scheme.get("verificationConditions", []):
        yield from _rule_texts(rule)
    for field in LIST_FIELDS:
        for text in scheme.get(field, []):
            yield field, text
    for b in scheme.get("benefitLimits", []):
        for key in ("description", "basis"):
            if b.get(key):
                yield f"benefitLimits.{key}", b[key]
        if b.get("condition"):
            yield from _rule_texts(b["condition"])
    for d in scheme.get("documents", []):
        for key in ("name", "purpose", "verificationNote"):
            if d.get(key):
                yield f"documents.{key}", d[key]
    for a in scheme.get("actionSteps", []):
        for key in ("title", "description", "responsibleParty", "dependency", "source"):
            if a.get(key):
                yield f"actionSteps.{key}", a[key]
    for s in scheme.get("sources", []):
        for key in ("title", "note"):
            if s.get(key):
                yield f"sources.{key}", s[key]
