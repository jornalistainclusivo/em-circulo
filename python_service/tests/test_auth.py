"""
TDD — 🔴 RED Phase: Auth endpoint tests for PRD v0.3.

All tests are written BEFORE implementation. They define the
expected behaviour of the authentication system as specified in:
  - specs/PRD_CuidaComigo_v0.3.md
  - specs/Tech_Spec_CuidaComigo_v0.2.md

Follows AAA pattern (Arrange / Act / Assert) and one behaviour per test.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Shared payloads
# ---------------------------------------------------------------------------

VALID_USER = {
    "email": "cuidador@example.com",
    "password": "SenhaSegura123!",
    "full_name": "Ana Cuidadora",
}

LOGIN_FORM = {
    "username": VALID_USER["email"],  # OAuth2PasswordRequestForm uses "username"
    "password": VALID_USER["password"],
}


# ---------------------------------------------------------------------------
# 1. Registro — caminho feliz
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient):
    """POST /register → 201 Created; response contains user data without password."""
    # Arrange
    payload = VALID_USER.copy()

    # Act
    response = await client.post("/api/v1/auth/register", json=payload)

    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == VALID_USER["email"]
    assert data["full_name"] == VALID_USER["full_name"]
    assert "id" in data
    assert "password" not in data
    assert "hashed_password" not in data


# ---------------------------------------------------------------------------
# 2. Registro — e-mail duplicado
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """POST /register with existing email → 409 Conflict."""
    # Arrange
    payload = {
        "email": "duplicado@example.com",
        "password": "SenhaSegura123!",
        "full_name": "Primeiro Usuario",
    }
    await client.post("/api/v1/auth/register", json=payload)

    # Act — same email, second attempt
    response = await client.post("/api/v1/auth/register", json=payload)

    # Assert
    assert response.status_code == 409


# ---------------------------------------------------------------------------
# 3. Login — caminho feliz
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """POST /login with valid credentials → 200 OK + access_token."""
    # Arrange — register first
    await client.post("/api/v1/auth/register", json=VALID_USER)

    # Act
    response = await client.post(
        "/api/v1/auth/login",
        data=LOGIN_FORM,  # OAuth2 form-encoded
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20  # non-trivial token


# ---------------------------------------------------------------------------
# 4. Login — senha errada
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """POST /login with wrong password → 401 Unauthorized."""
    # Arrange
    await client.post("/api/v1/auth/register", json=VALID_USER)

    # Act
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": VALID_USER["email"], "password": "SenhaErrada!99"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    # Assert
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 5. Login — usuário inexistente
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """POST /login with unknown email → 401 Unauthorized (not 404, to avoid user enumeration)."""
    # Act
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "fantasma@example.com", "password": "Qualquer123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    # Assert
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 6. /me — autenticado
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient):
    """GET /me with valid Bearer token → 200 OK + user data."""
    # Arrange — register and login to get a token
    reg_payload = {
        "email": "me_test@example.com",
        "password": "SenhaSegura123!",
        "full_name": "Eu Mesmo",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": reg_payload["email"], "password": reg_payload["password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = login_res.json()["access_token"]

    # Act
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == reg_payload["email"]
    assert "hashed_password" not in data


# ---------------------------------------------------------------------------
# 7. /me — não autenticado
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient):
    """GET /me without token → 401 Unauthorized."""
    # Act
    response = await client.get("/api/v1/auth/me")

    # Assert
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 8. Segurança: senha nunca armazenada em plaintext
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_password_not_stored_in_plaintext(
    client: AsyncClient, async_session: AsyncSession
):
    """DB: hashed_password column must NOT equal the original plaintext password."""
    # Arrange
    payload = {
        "email": "hashcheck@example.com",
        "password": "PlainTextPassword!1",
        "full_name": "Hash Checker",
    }
    await client.post("/api/v1/auth/register", json=payload)

    # Act — query DB directly
    from sqlalchemy import text
    result = await async_session.execute(
        text("SELECT hashed_password FROM users WHERE email = :email"),
        {"email": payload["email"]},
    )
    row = result.fetchone()

    # Assert
    assert row is not None, "User should exist in the database"
    stored_hash = row[0]
    assert stored_hash != payload["password"], "Password must never be stored as plaintext"
    assert stored_hash.startswith("$2b$"), "Password must be a bcrypt hash"
