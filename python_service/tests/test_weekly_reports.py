import pytest
import pytest_asyncio
from httpx import AsyncClient
from datetime import datetime, timezone
from app.models import User, CareGroup, CareRecipient, CareGroupMember, UserRole
import uuid
from app.auth.security import hash_password

@pytest_asyncio.fixture(loop_scope="function")
async def setup_entities(async_session):
    # Criar user
    user = User(
        email=f"test_weekly_reports_{uuid.uuid4().hex}@example.com",
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
    await async_session.refresh(member)
    
    return group, recipient, user, member

@pytest.mark.asyncio
async def test_create_weekly_report_success(client: AsyncClient, setup_entities):
    group, recipient, user, member = setup_entities
    
    login_response = await client.post("/api/v1/auth/login", data={
        "username": user.email,
        "password": "test"
    })
    token = login_response.json()["access_token"]
    
    payload = {
        "report_date": datetime.now(timezone.utc).isoformat(),
        "summary_text": "Paciente passou bem durante a noite",
        "mood": "BOM",
        "diet": "COMEU_BEM",
        "wellbeing_notes": "Dormiu a noite toda sem interrupções."
    }
    
    response = await client.post(
        f"/api/v1/care-groups/{group.id}/recipients/{recipient.id}/weekly-reports",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["mood"] == "BOM"
    assert data["care_recipient_id"] == str(recipient.id)
    assert data["author_id"] == str(member.id)

@pytest.mark.asyncio
async def test_create_weekly_report_rbac_forbidden(
    client: AsyncClient, setup_entities, async_session
):
    group, recipient, _, _ = setup_entities
    
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
        "report_date": datetime.now(timezone.utc).isoformat(),
        "mood": "RUIM"
    }
    
    response = await client.post(
        f"/api/v1/care-groups/{group.id}/recipients/{recipient.id}/weekly-reports",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_list_weekly_reports_success(client: AsyncClient, setup_entities):
    group, recipient, user, member = setup_entities
    
    login_response = await client.post("/api/v1/auth/login", data={
        "username": user.email,
        "password": "test"
    })
    token = login_response.json()["access_token"]
    
    # Create two reports
    await client.post(
        f"/api/v1/care-groups/{group.id}/recipients/{recipient.id}/weekly-reports",
        json={
            "report_date": datetime.now(timezone.utc).isoformat(),
            "mood": "BOM"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    await client.post(
        f"/api/v1/care-groups/{group.id}/recipients/{recipient.id}/weekly-reports",
        json={
            "report_date": datetime.now(timezone.utc).isoformat(),
            "mood": "REGULAR"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    response = await client.get(
        f"/api/v1/care-groups/{group.id}/recipients/{recipient.id}/weekly-reports",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Check if the ordering works (latest first depending on how we implement)
