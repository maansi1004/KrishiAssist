"""Reading the requested language from an HTTP request."""
from __future__ import annotations

from typing import Any

from .languages import resolve_language


def request_language(request: Any, explicit: str | None = None) -> str:
    """``?lang=hi`` (or an explicit value) wins, then the Accept-Language header, then English."""
    return resolve_language(
        request.headers.get("accept-language"),
        explicit or request.query_params.get("lang"),
    )
