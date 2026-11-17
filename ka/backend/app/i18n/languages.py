"""Which languages KrishiAssist speaks, and how a request says which one it wants.

The three codes are the same ones the web app stores in localStorage (``ka_lang``):
``en`` (English), ``hi`` (Hindi, Devanagari) and ``hinglish`` (Hindi in Roman script).
"""
from __future__ import annotations

SUPPORTED_LANGUAGES = ("en", "hi", "hinglish")
DEFAULT_LANGUAGE = "en"

# Words people (and browsers) use for each language. Compared in lower case.
_ALIASES = {
    "en": "en", "en-in": "en", "en-us": "en", "en-gb": "en", "english": "en",
    "hi": "hi", "hi-in": "hi", "hindi": "hi", "हिंदी": "hi", "हिन्दी": "hi",
    "hinglish": "hinglish", "hi-latn": "hinglish", "hi-en": "hinglish", "hi-latn-in": "hinglish",
}


def normalize_language(value: str | None) -> str | None:
    """'HI', 'hi-IN', 'Hinglish' -> the supported code, or None when unknown/empty."""
    if not value:
        return None
    key = value.strip().lower()
    if key in _ALIASES:
        return _ALIASES[key]
    return _ALIASES.get(key.split("-")[0])


def resolve_language(accept_language: str | None = None, explicit: str | None = None) -> str:
    """Pick the language for one request.

    Order: an explicit ``?lang=`` / body value, then the ``Accept-Language`` header
    (first listed language we support, honouring q-values), then English.
    """
    chosen = normalize_language(explicit)
    if chosen:
        return chosen
    if accept_language:
        ranked: list[tuple[float, int, str]] = []
        for position, part in enumerate(accept_language.split(",")):
            piece = part.strip()
            if not piece:
                continue
            tag, _, params = piece.partition(";")
            quality = 1.0
            params = params.strip()
            if params.startswith("q="):
                try:
                    quality = float(params[2:])
                except ValueError:
                    quality = 0.0
            code = normalize_language(tag)
            if code and quality > 0:
                ranked.append((-quality, position, code))
        if ranked:
            return sorted(ranked)[0][2]
    return DEFAULT_LANGUAGE
