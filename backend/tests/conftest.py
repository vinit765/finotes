import os

import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-secret"

from app.core.config import get_settings  # noqa: E402
from app.db.session import Base, engine  # noqa: E402
from app.main import app  # noqa: E402

get_settings.cache_clear()


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def auth_headers(client: TestClient, email: str, password: str) -> dict[str, str]:
    client.post("/register", json={"email": email, "password": password})
    response = client.post("/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
