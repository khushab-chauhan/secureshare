import uuid
import pytest
from httpx import AsyncClient

from app.core.security import verify_password


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test that the application health endpoint returns 200 OK."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "SecureShare"


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test registering a new user."""
    random_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": random_email,
        "password": "StrongPassword123!",
        "full_name": "Test User",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == random_email
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert "password" not in data
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_duplicate_registration_fails(client: AsyncClient):
    """Test that registering the same email twice fails with 400 Bad Request."""
    email = f"duplicate_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": email,
        "password": "StrongPassword123!",
        "full_name": "Original User",
    }
    # First registration
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    # Duplicate registration
    r2 = await client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test logging in with correct credentials returns valid JWT tokens."""
    email = f"login_{uuid.uuid4().hex[:8]}@example.com"
    password = "MySecurePassword123!"
    
    # Register user
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Login Tester"},
    )

    # Login with OAuth2 form data
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert login_response.status_code == 200
    tokens = login_response.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert tokens["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password_fails(client: AsyncClient):
    """Test that login with incorrect password fails."""
    email = f"wrongpw_{uuid.uuid4().hex[:8]}@example.com"
    
    # Register user
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "CorrectPassword123!", "full_name": "Tester"},
    )

    # Attempt login with wrong password
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "WrongPassword!"},
    )
    assert login_response.status_code == 400
    assert "Incorrect email or password" in login_response.json()["detail"]


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient):
    """Test fetching authenticated user profile with Bearer token."""
    email = f"me_{uuid.uuid4().hex[:8]}@example.com"
    password = "ProfilePassword123!"
    full_name = "Jane Doe"
    
    # Register & Login
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    token = login_res.json()["access_token"]

    # Call /me with header
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == email
    assert profile["full_name"] == full_name
    assert profile["role"] == "user"


@pytest.mark.asyncio
async def test_get_me_unauthorized_without_token(client: AsyncClient):
    """Test that accessing protected endpoint without token returns 401."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
