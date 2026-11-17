"""Machine-readable codes for API errors.

Every error response keeps its English ``detail`` (older callers and tests rely on it) and gains
``code`` and ``params``. The web app shows ``errors.<code>`` from its locale files, so an error
appears in the farmer's language. Codes are part of the API: add new ones, never rename.
"""
from __future__ import annotations

import re
from typing import Any

# (compiled pattern, code, names of the numbered groups -> params)
_PATTERNS: list[tuple[re.Pattern[str], str, tuple[str, ...]]] = [
    (re.compile(r"^Scheme not found$"), "SCHEME_NOT_FOUND", ()),
    (re.compile(r"^Valid login is required$"), "AUTH_REQUIRED", ()),
    (re.compile(r"^Administrator access is required$"), "ADMIN_REQUIRED", ()),
    (re.compile(r"^Email already registered$"), "EMAIL_EXISTS", ()),
    (re.compile(r"^Invalid email or password$"), "INVALID_CREDENTIALS", ()),
    (re.compile(r"^Too many (.+) attempts\. Please try again in (\d+) minutes?\.$"), "RATE_LIMITED", ("what", "minutes")),
    (re.compile(r"^Application not found$"), "APPLICATION_NOT_FOUND", ()),
    (re.compile(r"^Evaluation not found$"), "EVALUATION_NOT_FOUND", ()),
    (re.compile(r"^Document not found$"), "DOCUMENT_NOT_FOUND", ()),
    (re.compile(r"^Unknown document type$"), "DOCUMENT_TYPE_UNKNOWN", ()),
    (re.compile(r"^The file is larger than (\d+) MB$"), "FILE_TOO_LARGE", ("mb",)),
    (re.compile(r"^You can keep up to (\d+) documents\. Delete one first\.$"), "DOCUMENT_LIMIT", ("max",)),
    (re.compile(r"^The file is empty$"), "FILE_EMPTY", ()),
    (re.compile(r"^Only PDF, JPEG or PNG files are accepted$"), "FILE_TYPE_NOT_ALLOWED", ()),
    (re.compile(r"^This would go over your storage limit of (\d+) MB$"), "STORAGE_LIMIT", ("mb",)),
    (re.compile(r"^You have already uploaded this exact file$"), "FILE_DUPLICATE", ()),
    (re.compile(r"^This scheme does not ask for that document$"), "DOCUMENT_NOT_IN_SCHEME", ()),
    (re.compile(r"^The stored file is missing\. Please upload it again\.$"), "FILE_MISSING", ()),
    (re.compile(r"^A scheme needs at least one source before it can be switched on\.$"), "SCHEME_NEEDS_SOURCE", ()),
    (re.compile(r"^This scheme has only one eligibility rule\."), "SCHEME_SINGLE_RULE", ()),
    (re.compile(r"^The verification date cannot be in the future\.$"), "DATE_IN_FUTURE", ()),
    (re.compile(r"^This scheme has no administrator changes$"), "NO_OVERRIDE", ()),
]

_STATUS_FALLBACK = {
    401: "AUTH_REQUIRED", 403: "FORBIDDEN", 404: "NOT_FOUND", 409: "CONFLICT", 413: "FILE_TOO_LARGE",
    415: "FILE_TYPE_NOT_ALLOWED", 422: "VALIDATION_ERROR", 429: "RATE_LIMITED",
}


def error_info(status_code: int, detail: Any) -> dict[str, Any]:
    """{'code': ..., 'params': {...}} for an HTTP error. Unknown messages get a code from the
    status number (or INTERNAL_ERROR) so the app always has something translatable to show."""
    if isinstance(detail, str):
        for pattern, code, names in _PATTERNS:
            m = pattern.match(detail)
            if m:
                return {"code": code, "params": dict(zip(names, m.groups()))}
    code = _STATUS_FALLBACK.get(status_code) or ("INTERNAL_ERROR" if status_code >= 500 else "REQUEST_FAILED")
    return {"code": code, "params": {}}


ERROR_CODES = sorted({c for _, c, _ in _PATTERNS} | set(_STATUS_FALLBACK.values()) | {"INTERNAL_ERROR", "REQUEST_FAILED"})
