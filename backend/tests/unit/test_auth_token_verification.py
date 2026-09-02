import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

import auth
from config import CLIENT_ID, FRONTEND_CLIENT_ID, ISSUER_URI

_PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_PUBLIC_KEY = _PRIVATE_KEY.public_key()


class _FakeSigningKey:
    key = _PUBLIC_KEY


@pytest.fixture(autouse=True)
def _patch_jwks(monkeypatch):
    class _FakeClient:
        def get_signing_key_from_jwt(self, token):
            return _FakeSigningKey()

    monkeypatch.setattr(auth, "_get_jwk_client", lambda: _FakeClient())


def _make_token(**overrides) -> str:
    now = int(time.time())
    payload = {
        "sub": "user-123",
        "iss": ISSUER_URI,
        "azp": CLIENT_ID,
        "iat": now,
        "exp": now + 300,
    }
    payload.update(overrides)
    return jwt.encode(payload, _PRIVATE_KEY, algorithm="RS256")


def test_valid_token_is_accepted():
    payload = auth.verify_token(_make_token())
    assert payload["sub"] == "user-123"


def test_valid_token_via_frontend_client_is_accepted():
    payload = auth.verify_token(_make_token(azp=FRONTEND_CLIENT_ID))
    assert payload["sub"] == "user-123"


def test_audience_via_aud_claim_is_accepted():
    token = _make_token(azp="some-other-client", aud=[CLIENT_ID])
    payload = auth.verify_token(token)
    assert payload["sub"] == "user-123"


def test_expired_token_is_rejected():
    now = int(time.time())
    token = _make_token(iat=now - 600, exp=now - 300)
    with pytest.raises(Exception):
        auth.verify_token(token)


def test_untrusted_issuer_is_rejected():
    token = _make_token(iss="https://evil.example.com/realms/tasks")
    with pytest.raises(Exception):
        auth.verify_token(token)


def test_wrong_audience_is_rejected():
    token = _make_token(azp="attacker-client", aud=["attacker-client"])
    with pytest.raises(Exception):
        auth.verify_token(token)


def test_missing_subject_is_rejected():
    token = _make_token(sub=None)
    with pytest.raises(Exception):
        auth.verify_token(token)


def test_tampered_signature_is_rejected():
    token = _make_token()
    tampered = token[:-3] + ("aaa" if not token.endswith("aaa") else "bbb")
    with pytest.raises(Exception):
        auth.verify_token(tampered)


def test_token_from_query_string_is_ignored():
    """Tokens must never be accepted from the URL (log/history leakage)."""

    class _Conn:
        headers: dict = {}
        cookies: dict = {}
        query_params = {"token": _make_token()}

        class url:
            query = "token=abc"

    assert auth.get_token_source(_Conn()) is None
