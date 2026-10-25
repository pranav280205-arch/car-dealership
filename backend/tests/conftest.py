"""Shared test fixtures.

Every test gets a fresh SQLite database file in a temp folder, so tests never
touch the dev database and never depend on each other.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db, make_engine
from app.main import app


@pytest.fixture
def db_session_factory(tmp_path):
    engine = make_engine(f"sqlite:///{tmp_path / 'test.db'}")
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, autoflush=False)
    yield factory
    engine.dispose()


@pytest.fixture
def client(db_session_factory):
    def override_get_db():
        db = db_session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _login_headers(client, email, password="secret123"):
    token = client.post(
        "/api/auth/login", json={"email": email, "password": password}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_headers(client):
    client.post(
        "/api/auth/register",
        json={"name": "Normal User", "email": "user@example.com", "password": "secret123"},
    )
    return _login_headers(client, "user@example.com")


@pytest.fixture
def admin_headers(client, db_session_factory):
    from app.services.auth_service import AuthService

    with db_session_factory() as db:
        AuthService(db).register("Admin", "admin@example.com", "secret123", role="admin")
    return _login_headers(client, "admin@example.com")


SAMPLE_VEHICLE = {
    "make": "Toyota",
    "model": "Corolla",
    "category": "Sedan",
    "year": 2023,
    "price": 1850000,
    "quantity": 5,
}


@pytest.fixture
def make_vehicle(client, admin_headers):
    """Creates a vehicle through the API and returns its JSON."""

    def _make(**overrides):
        res = client.post(
            "/api/vehicles", json={**SAMPLE_VEHICLE, **overrides}, headers=admin_headers
        )
        assert res.status_code == 201, res.text
        return res.json()

    return _make
