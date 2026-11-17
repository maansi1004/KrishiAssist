"""Machine-readable reasons for eligibility results.

The rule engine never writes a finished sentence for the farmer. For every criterion it returns a
``ruleCode`` and ``params``. The web app turns those into a sentence in the selected language
(``eligibility.rules.<ruleCode>`` in the locale files). ``render_rule`` below does the same for
server-made output (PDF report, assistant) and for API callers that send ``?lang=``.

These codes are part of the API. Add new ones; do not rename existing ones.
"""
from __future__ import annotations

from typing import Any

RULE_CODES = (
    "RULE_PASSED", "RESIDENCY_MATCH", "RESIDENCY_MISMATCH",
    "RULE_FAILED_EQUALS", "RULE_FAILED_NOT_EQUALS", "RULE_FAILED_GT", "RULE_FAILED_GTE",
    "RULE_FAILED_LT", "RULE_FAILED_LTE", "RULE_FAILED_IN", "RULE_FAILED_NOT_IN", "RULE_UNKNOWN",
)

_FAIL_CODE = {
    "equals": "RULE_FAILED_EQUALS", "not_equals": "RULE_FAILED_NOT_EQUALS", "gt": "RULE_FAILED_GT",
    "gte": "RULE_FAILED_GTE", "lt": "RULE_FAILED_LT", "lte": "RULE_FAILED_LTE", "in": "RULE_FAILED_IN",
    "not_in": "RULE_FAILED_NOT_IN",
}


def rule_code(field: str, operator: str, result: str, expected: Any, actual: Any) -> tuple[str, dict[str, Any]]:
    """(ruleCode, params) for one evaluated criterion. ``result`` is PASS, FAIL or UNKNOWN."""
    params: dict[str, Any] = {"field": field, "operator": operator, "expected": expected, "actual": actual}
    if field == "state" and operator == "equals" and result in ("PASS", "FAIL"):
        params.update(requiredState=expected, providedState=actual)
        return ("RESIDENCY_MATCH" if result == "PASS" else "RESIDENCY_MISMATCH"), params
    if result == "PASS":
        return "RULE_PASSED", params
    if result == "FAIL":
        return _FAIL_CODE.get(operator, "RULE_FAILED_EQUALS"), params
    return "RULE_UNKNOWN", params


# Sentences for server-made output. The web app has its own copy in locales/*.json
# (checked against this table by the translation audit).
RULE_TEXT: dict[str, dict[str, str]] = {
    "RULE_PASSED": {
        "en": "Your information meets this requirement ({actual}).",
        "hi": "आपकी जानकारी इस शर्त को पूरा करती है ({actual})।",
        "hinglish": "Aapki information is requirement ko poora karti hai ({actual}).",
    },
    "RESIDENCY_MATCH": {
        "en": "Your state ({providedState}) matches the required state.",
        "hi": "आपका राज्य ({providedState}) आवश्यक राज्य से मेल खाता है।",
        "hinglish": "Aapka state ({providedState}) required state se match karta hai.",
    },
    "RESIDENCY_MISMATCH": {
        "en": "This scheme is for {requiredState}, but your profile says {providedState}.",
        "hi": "यह योजना {requiredState} के लिए है, लेकिन आपकी प्रोफाइल में {providedState} दर्ज है।",
        "hinglish": "Ye scheme {requiredState} ke liye hai, lekin aapki profile mein {providedState} likha hai.",
    },
    "RULE_FAILED_EQUALS": {
        "en": "Your value ({actual}) does not match the required value ({expected}).",
        "hi": "आपका मान ({actual}) आवश्यक मान ({expected}) से मेल नहीं खाता।",
        "hinglish": "Aapki value ({actual}) required value ({expected}) se match nahi karti.",
    },
    "RULE_FAILED_NOT_EQUALS": {
        "en": "Your value ({actual}) is not allowed for this scheme.",
        "hi": "इस योजना के लिए आपका मान ({actual}) मान्य नहीं है।",
        "hinglish": "Is scheme ke liye aapki value ({actual}) allowed nahi hai.",
    },
    "RULE_FAILED_GT": {
        "en": "Your value ({actual}) must be more than {expected}.",
        "hi": "आपका मान ({actual}) {expected} से अधिक होना चाहिए।",
        "hinglish": "Aapki value ({actual}) {expected} se zyada honi chahiye.",
    },
    "RULE_FAILED_GTE": {
        "en": "Your value ({actual}) must be at least {expected}.",
        "hi": "आपका मान ({actual}) कम से कम {expected} होना चाहिए।",
        "hinglish": "Aapki value ({actual}) kam se kam {expected} honi chahiye.",
    },
    "RULE_FAILED_LT": {
        "en": "Your value ({actual}) must be less than {expected}.",
        "hi": "आपका मान ({actual}) {expected} से कम होना चाहिए।",
        "hinglish": "Aapki value ({actual}) {expected} se kam honi chahiye.",
    },
    "RULE_FAILED_LTE": {
        "en": "Your value ({actual}) must be at most {expected}.",
        "hi": "आपका मान ({actual}) अधिकतम {expected} होना चाहिए।",
        "hinglish": "Aapki value ({actual}) zyada se zyada {expected} honi chahiye.",
    },
    "RULE_FAILED_IN": {
        "en": "Your value ({actual}) is not one of the allowed values ({expected}).",
        "hi": "आपका मान ({actual}) मान्य मानों ({expected}) में शामिल नहीं है।",
        "hinglish": "Aapki value ({actual}) allowed values ({expected}) mein shamil nahi hai.",
    },
    "RULE_FAILED_NOT_IN": {
        "en": "Your value ({actual}) falls in a group this scheme excludes ({expected}).",
        "hi": "आपका मान ({actual}) उस वर्ग में आता है जिसे यह योजना शामिल नहीं करती ({expected})।",
        "hinglish": "Aapki value ({actual}) us group mein aati hai jise ye scheme exclude karti hai ({expected}).",
    },
    "RULE_UNKNOWN": {
        "en": "We cannot tell from the information provided so far.",
        "hi": "अब तक दी गई जानकारी से यह तय नहीं हो सकता।",
        "hinglish": "Ab tak di gayi information se ye tay nahi ho sakta.",
    },
}


def _show(value: Any) -> str:
    if isinstance(value, (list, tuple)):
        return ", ".join(str(v) for v in value)
    if isinstance(value, bool):
        return "Yes" if value else "No"
    return "—" if value is None else str(value)


def render_rule(code: str, params: dict[str, Any] | None, language: str = "en") -> str:
    """The sentence for a rule code in one language (English if the language has no entry)."""
    table = RULE_TEXT.get(code) or RULE_TEXT["RULE_UNKNOWN"]
    template = table.get(language) or table["en"]
    shown = {k: _show(v) for k, v in (params or {}).items()}

    class _Safe(dict):
        def __missing__(self, key):  # a missing value must never crash a response
            return "—"

    return template.format_map(_Safe(shown))
