import pytest
import pytest_asyncio
from httpx import AsyncClient
from datetime import datetime, timezone, timedelta
from app.models import User, CareGroup, CareRecipient, CareGroupMember, UserRole
import uuid
from app.auth.security import hash_password

@pytest_asyncio.fixture(loop_scope="function")
async def setup_entities(async_session):
    # Criar user
    user = User(
        email=f"test_appointments_{uuid.uuid4().hex}@example.com",
        hashed_password=hash_password("test"),
        full_name="Test User",
        is_active=True
    )
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    
    # Criar group
    group = CareGroup(name="Grupo Teste")
    async_session.add(group)
    await async_session.commit()
    await async_session.refresh(group)
    
    # Criar membro
    member = CareGroupMember(care_group_id=group.id, user_id=user.id, role=UserRole.ADMIN)
    async_session.add(member)
    
    # Criar recipient
    recipient = CareRecipient(care_group_id=group.id, name="Paciente Teste")
    async_session.add(recipient)
    await async_session.commit()
    await async_session.refresh(recipient)
    
    return group, recipient, user

@pytest.mark.asyncio
async def test_create_appointment_success(client: AsyncClient, setup_entities):
    group, recipient, user = setup_entities
    
    login_response = await client.post("/api/v1/auth/login", data={
        "username": user.email,
        "password": "test"
    })
    token = login_response.json()["access_token"]
    
    payload = {
        "title": "Consulta Oftalmologista",
        "scheduled_at": datetime.now(timezone.utc).isoformat(),
        "provider_name": "Dr. Silva",
        "location": "Clínica Visão"
    }
    
    response = await client.post(
        f"/api/v1/care-groups/{group.id}/appointments",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Consulta Oftalmologista"
    assert data["care_recipient_id"] == str(recipient.id)

@pytest.mark.asyncio
async def test_create_appointment_rbac_forbidden(
    client: AsyncClient, setup_entities, async_session
):
    group, _, _ = setup_entities
    
    # Criar um usuário que não é do grupo
    other_user = User(
        email=f"forasteiro_{uuid.uuid4().hex}@example.com",
        hashed_password=hash_password("test"),
        full_name="Forasteiro",
        is_active=True
    )
    async_session.add(other_user)
    await async_session.commit()
    
    # Login com forasteiro
    login_response = await client.post("/api/v1/auth/login", data={
        "username": other_user.email,
        "password": "test"
    })
    token = login_response.json()["access_token"]
    
    payload = {
        "title": "Consulta Invalida",
        "scheduled_at": datetime.now(timezone.utc).isoformat()
    }
    
    response = await client.post(
        f"/api/v1/care-groups/{group.id}/appointments",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_list_appointments_success(client: AsyncClient, setup_entities):
    group, recipient, user = setup_entities
    
    login_response = await client.post("/api/v1/auth/login", data={
        "username": user.email,
        "password": "test"
    })
    token = login_response.json()["access_token"]
    
    # Criar via API
    await client.post(
        f"/api/v1/care-groups/{group.id}/appointments",
        json={"title": "A1", "scheduled_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()},
        headers={"Authorization": f"Bearer {token}"}
    )
    await client.post(
        f"/api/v1/care-groups/{group.id}/appointments",
        json={"title": "A2", "scheduled_at": datetime.now(timezone.utc).isoformat()},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    response = await client.get(
        f"/api/v1/care-groups/{group.id}/appointments",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # O mais recente/futuro deve vir primeiro devido ao desc()
    assert data[0]["title"] == "A2"
    assert data[1]["title"] == "A1"

@pytest.mark.asyncio
async def test_list_appointments_rbac_forbidden(
    client: AsyncClient, setup_entities, async_session
):
    group, _, _ = setup_entities
    
    # Criar um usuário forasteiro
    other_user = User(
        email=f"forasteiro_{uuid.uuid4().hex}@example.com",
        hashed_password=hash_password("test"),
        full_name="Forasteiro",
        is_active=True
    )
    async_session.add(other_user)
    await async_session.commit()
    
    # Login com forasteiro
    login_response = await client.post("/api/v1/auth/login", data={
        "username": other_user.email,
        "password": "test"
    })
    token = login_response.json()["access_token"]
    
    response = await client.get(
        f"/api/v1/care-groups/{group.id}/appointments",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 403
