import uuid
import pytest
from httpx import AsyncClient


async def get_authenticated_client(client: AsyncClient):
    """Helper to register and login a fresh test user and return auth headers."""
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPassword123!"
    
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Folder Tester"},
    )
    res = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_root_folder(client: AsyncClient):
    """Test creating a folder at the root level."""
    headers = await get_authenticated_client(client)
    res = await client.post(
        "/api/v1/folders/",
        headers=headers,
        json={"name": "Brand Guidelines", "parent_id": None},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Brand Guidelines"
    assert data["parent_id"] is None
    assert data["depth"] == 0
    assert data["path"] == f"/{data['id']}/"


@pytest.mark.asyncio
async def test_create_nested_subfolder(client: AsyncClient):
    """Test creating a nested folder inside an existing parent."""
    headers = await get_authenticated_client(client)
    
    # 1. Create Parent
    parent_res = await client.post(
        "/api/v1/folders/",
        headers=headers,
        json={"name": "Projects"},
    )
    parent_id = parent_res.json()["id"]

    # 2. Create Child
    child_res = await client.post(
        "/api/v1/folders/",
        headers=headers,
        json={"name": "2026 Pitch Deck", "parent_id": parent_id},
    )
    assert child_res.status_code == 201
    child = child_res.json()
    assert child["parent_id"] == parent_id
    assert child["depth"] == 1
    assert child["path"] == f"/{parent_id}/{child['id']}/"


@pytest.mark.asyncio
async def test_duplicate_folder_fails_in_same_parent(client: AsyncClient):
    """Test that two folders with the same name in the same directory return 400."""
    headers = await get_authenticated_client(client)
    
    # Create first
    r1 = await client.post(
        "/api/v1/folders/",
        headers=headers,
        json={"name": "Financial Audits"},
    )
    assert r1.status_code == 201

    # Attempt duplicate
    r2 = await client.post(
        "/api/v1/folders/",
        headers=headers,
        json={"name": "Financial Audits"},
    )
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"]


@pytest.mark.asyncio
async def test_get_folder_breadcrumbs(client: AsyncClient):
    """Test retrieving ordered breadcrumbs for deep folder hierarchies."""
    headers = await get_authenticated_client(client)
    
    # Level 1: Root
    r1 = await client.post("/api/v1/folders/", headers=headers, json={"name": "Root"})
    root_id = r1.json()["id"]

    # Level 2: Sub
    r2 = await client.post("/api/v1/folders/", headers=headers, json={"name": "Projects", "parent_id": root_id})
    projects_id = r2.json()["id"]

    # Level 3: Leaf
    r3 = await client.post("/api/v1/folders/", headers=headers, json={"name": "2026 Pitch Deck", "parent_id": projects_id})
    deck_id = r3.json()["id"]

    # Fetch leaf with breadcrumbs
    detail_res = await client.get(f"/api/v1/folders/{deck_id}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["breadcrumbs"]) == 3
    assert detail["breadcrumbs"][0]["name"] == "Root"
    assert detail["breadcrumbs"][1]["name"] == "Projects"
    assert detail["breadcrumbs"][2]["name"] == "2026 Pitch Deck"


@pytest.mark.asyncio
async def test_move_folder_with_cycle_prevention(client: AsyncClient):
    """Test cycle prevention: cannot move parent into its own child."""
    headers = await get_authenticated_client(client)
    
    p = (await client.post("/api/v1/folders/", headers=headers, json={"name": "Parent"})).json()
    c = (await client.post("/api/v1/folders/", headers=headers, json={"name": "Child", "parent_id": p["id"]})).json()

    # Attempt to move Parent inside Child
    res = await client.patch(
        f"/api/v1/folders/{p['id']}",
        headers=headers,
        json={"parent_id": c["id"]},
    )
    assert res.status_code == 400
    assert "cycle detected" in res.json()["detail"]


@pytest.mark.asyncio
async def test_soft_delete_folder_cascades(client: AsyncClient):
    """Test soft-deleting a folder marks it as trash."""
    headers = await get_authenticated_client(client)
    
    folder = (await client.post("/api/v1/folders/", headers=headers, json={"name": "Trash Test"})).json()
    f_id = folder["id"]

    # Delete folder
    del_res = await client.delete(f"/api/v1/folders/{f_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify not in active list
    list_res = await client.get("/api/v1/folders/", headers=headers)
    active_ids = [f["id"] for f in list_res.json()]
    assert f_id not in active_ids

    # Verify present in trash list
    trash_res = await client.get("/api/v1/folders/?is_trash=true", headers=headers)
    trash_ids = [f["id"] for f in trash_res.json()]
    assert f_id in trash_ids
