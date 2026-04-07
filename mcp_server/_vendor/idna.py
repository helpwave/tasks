from __future__ import annotations


class IDNAError(UnicodeError):
    """Compatibility error type matching the third-party idna package API."""


def encode(value: str, uts46: bool = False, std3_rules: bool = False) -> bytes:
    """
    Lightweight fallback for environments where the external `idna` package
    is unavailable. Uses Python's built-in IDNA codec.
    """
    if not isinstance(value, str):
        raise TypeError("idna.encode() argument must be str")

    try:
        normalized = value.lower() if uts46 else value
        return normalized.encode("idna")
    except UnicodeError as exc:
        raise IDNAError(str(exc)) from exc


def decode(value: str | bytes, uts46: bool = False, std3_rules: bool = False) -> str:
    if isinstance(value, str):
        data = value.encode("ascii")
    elif isinstance(value, bytes):
        data = value
    else:
        raise TypeError("idna.decode() argument must be str or bytes")

    try:
        decoded = data.decode("idna")
        return decoded.lower() if uts46 else decoded
    except UnicodeError as exc:
        raise IDNAError(str(exc)) from exc
