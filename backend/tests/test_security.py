"""Unit tests for token handling edge cases."""
from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings
from app.security import create_access_token, decode_access_token, hash_password, verify_password


def test_password_hash_is_not_the_password():
    hashed = hash_password("secret123")
    assert hashed != "secret123"
    assert verify_password("secret123", hashed)
    assert not verify_password("secret124", hashed)


def test_token_round_trip_keeps_user_id_and_role():
    payload = decode_access_token(create_access_token(7, "admin"))
    assert payload["sub"] == "7"
    assert payload["role"] == "admin"


def test_expired_token_is_rejected():
    expired = jwt.encode(
        {"sub": "1", "role": "user", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    assert decode_access_token(expired) is None


def test_token_signed_with_another_secret_is_rejected():
    forged = jwt.encode(
        {"sub": "1", "role": "admin"}, "some-other-secret-that-is-long-enough!!", "HS256"
    )
    assert decode_access_token(forged) is None


def test_valid_token_for_a_user_that_no_longer_exists_is_rejected(client):
    token = create_access_token(12345, "admin")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
