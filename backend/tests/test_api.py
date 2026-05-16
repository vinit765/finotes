from conftest import auth_headers


def test_register_and_login(client):
    register_response = client.post(
        "/register",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert register_response.status_code == 201
    assert register_response.json() == {"message": "User registered successfully"}

    login_response = client.post(
        "/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


def test_login_rejects_invalid_credentials(client):
    client.post("/register", json={"email": "user@example.com", "password": "password123"})
    response = client.post(
        "/login",
        json={"email": "user@example.com", "password": "wrongpass123"},
    )
    assert response.status_code == 401
    assert response.json()["message"] == "Invalid email or password"


def test_notes_crud_and_delete_contract(client):
    headers = auth_headers(client, "owner@example.com", "password123")

    create_response = client.post(
        "/notes",
        json={"title": "Plan", "content": "Ship it"},
        headers=headers,
    )
    assert create_response.status_code == 201
    note_id = create_response.json()["id"]

    list_response = client.get("/notes", headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    detail_response = client.get(f"/notes/{note_id}", headers=headers)
    assert detail_response.status_code == 200
    assert detail_response.json()["title"] == "Plan"

    update_response = client.put(
        f"/notes/{note_id}",
        json={"title": "Updated plan", "content": "Really ship it"},
        headers=headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Updated plan"

    delete_response = client.delete(f"/notes/{note_id}", headers=headers)
    assert delete_response.status_code == 204
    assert delete_response.content == b""


def test_share_allows_target_user_to_access_note(client):
    owner_headers = auth_headers(client, "owner@example.com", "password123")
    recipient_headers = auth_headers(client, "friend@example.com", "password123")

    create_response = client.post(
        "/notes",
        json={"title": "Shared", "content": "Visible to friend"},
        headers=owner_headers,
    )
    note_id = create_response.json()["id"]

    share_response = client.post(
        f"/notes/{note_id}/share",
        json={"share_with_email": "friend@example.com"},
        headers=owner_headers,
    )
    assert share_response.status_code == 200
    assert share_response.json() == {"message": "Note shared successfully"}

    detail_response = client.get(f"/notes/{note_id}", headers=recipient_headers)
    assert detail_response.status_code == 200
    assert detail_response.json()["title"] == "Shared"


def test_user_cannot_access_other_users_unshared_note(client):
    owner_headers = auth_headers(client, "owner@example.com", "password123")
    stranger_headers = auth_headers(client, "stranger@example.com", "password123")

    note_id = client.post(
        "/notes",
        json={"title": "Private", "content": "Do not leak"},
        headers=owner_headers,
    ).json()["id"]

    response = client.get(f"/notes/{note_id}", headers=stranger_headers)
    assert response.status_code == 404


def test_about_and_openapi_are_public(client):
    about_response = client.get("/about")
    assert about_response.status_code == 200
    assert "my_features" in about_response.json()
    assert "my features" in about_response.json()

    openapi_response = client.get("/openapi.json")
    assert openapi_response.status_code == 200
    assert openapi_response.json()["openapi"].startswith("3.")


def test_note_history_and_restore(client):
    headers = auth_headers(client, "owner@example.com", "password123")
    note_id = client.post(
        "/notes",
        json={"title": "Draft", "content": "v1"},
        headers=headers,
    ).json()["id"]

    client.put(
        f"/notes/{note_id}",
        json={"title": "Draft 2", "content": "v2"},
        headers=headers,
    )
    history_response = client.get(f"/notes/{note_id}/history", headers=headers)
    assert history_response.status_code == 200
    assert len(history_response.json()) == 2

    first_version_id = history_response.json()[-1]["id"]
    restore_response = client.post(
        f"/notes/{note_id}/restore/{first_version_id}",
        headers=headers,
    )
    assert restore_response.status_code == 200
    assert restore_response.json()["content"] == "v1"
