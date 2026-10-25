"""Tests for /api/auth/register and /api/auth/login."""

NEW_USER = {"name": "Asha Rao", "email": "asha@example.com", "password": "secret123"}


def register(client, **overrides):
    return client.post("/api/auth/register", json={**NEW_USER, **overrides})


# ---------- register ----------

def test_register_creates_user_and_hides_password(client):
    res = register(client)

    assert res.status_code == 201
    body = res.json()
    assert body["email"] == "asha@example.com"
    assert body["name"] == "Asha Rao"
    assert body["role"] == "user"
    assert "password" not in body
    assert "password_hash" not in body


def test_register_rejects_duplicate_email(client):
    register(client)
    res = register(client)
    assert res.status_code == 409


def test_register_email_is_case_insensitive(client):
    register(client)
    res = register(client, email="ASHA@example.com")
    assert res.status_code == 409


def test_register_rejects_invalid_email(client):
    res = register(client, email="not-an-email")
    assert res.status_code == 422


def test_register_rejects_short_password(client):
    res = register(client, password="123")
    assert res.status_code == 422


def test_register_cannot_make_yourself_admin(client):
    res = register(client, role="admin")
    assert res.status_code == 201
    assert res.json()["role"] == "user"


# ---------- login ----------

def test_login_returns_bearer_token(client):
    register(client)
    res = client.post(
        "/api/auth/login",
        json={"email": "asha@example.com", "password": "secret123"},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and body["access_token"]
    assert body["user"]["email"] == "asha@example.com"


def test_login_with_wrong_password_fails(client):
    register(client)
    res = client.post(
        "/api/auth/login",
        json={"email": "asha@example.com", "password": "wrongpass"},
    )
    assert res.status_code == 401


def test_login_with_unknown_email_fails(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "secret123"},
    )
    assert res.status_code == 401


# ---------- current user ----------

def test_me_returns_current_user_when_token_is_valid(client):
    register(client)
    token = client.post(
        "/api/auth/login",
        json={"email": "asha@example.com", "password": "secret123"},
    ).json()["access_token"]

    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 200
    assert res.json()["email"] == "asha@example.com"


def test_me_without_token_is_unauthorized(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_me_with_garbage_token_is_unauthorized(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer abc.def.ghi"})
    assert res.status_code == 401
