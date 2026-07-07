import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime, timedelta, timezone

from app.models import CareGroup, CareGroupMember, UserRole, User, Task, CareRecipient, MedicationProtocol
from app.auth.security import create_access_token

async def create_auth_user(client: AsyncClient, email: str, name: str) -> dict:
    """Helper to register and log in a user, returning email, name, headers, and id."""
    register_payload = {
        "email": email,
        "password": "Password123!",
        "full_name": name,
    }
    await client.post("/api/v1/auth/register", json=register_payload)
    
    login_payload = {
        "username": email,
        "password": "Password123!",
    }
    login_res = await client.post("/api/v1/auth/login", data=login_payload)
    token = login_res.json()["access_token"]
    
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    user_id = me_res.json()["id"]
    
    return {
        "id": uuid.UUID(user_id),
        "email": email,
        "headers": {"Authorization": f"Bearer {token}"}
    }

@pytest.mark.asyncio
async def test_invite_generation_and_accept_success(client: AsyncClient, async_session: AsyncSession):
    # 1. Register admin user and caregiver user
    admin = await create_auth_user(client, "admin_collab@example.com", "Admin User")
    caregiver = await create_auth_user(client, "caregiver_collab@example.com", "Caregiver User")
    
    # 2. Admin creates a care group (admin becomes ADMIN member automatically)
    group_res = await client.post(
        "/api/v1/care-groups",
        json={"name": "Círculo Compartilhado"},
        headers=admin["headers"]
    )
    assert group_res.status_code == 201
    group_id = group_res.json()["id"]
    
    # 3. Admin generates an invite token
    invite_res = await client.post(
        "/api/v1/invites",
        json={"care_group_id": group_id},
        headers=admin["headers"]
    )
    assert invite_res.status_code == 201
    invite_data = invite_res.json()
    assert "token" in invite_data
    assert "invite_link" in invite_data
    token = invite_data["token"]
    
    # 4. Caregiver accepts the invite
    accept_res = await client.post(
        "/api/v1/invites/accept",
        json={"token": token},
        headers=caregiver["headers"]
    )
    assert accept_res.status_code == 200
    
    # 5. Verify database: Caregiver is now a CAREGIVER member of the group
    stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == uuid.UUID(group_id),
        CareGroupMember.user_id == caregiver["id"]
    )
    db_res = await async_session.execute(stmt)
    member = db_res.scalar_one_or_none()
    assert member is not None
    assert member.role == UserRole.CAREGIVER

@pytest.mark.asyncio
async def test_invite_generation_forbidden_for_caregiver(client: AsyncClient, async_session: AsyncSession):
    # 1. Admin and Caregiver setup
    admin = await create_auth_user(client, "admin_forb@example.com", "Admin")
    caregiver = await create_auth_user(client, "caregiver_forb@example.com", "Caregiver")
    
    # Create group
    group_res = await client.post(
        "/api/v1/care-groups",
        json={"name": "Grupo Teste"},
        headers=admin["headers"]
    )
    group_id = group_res.json()["id"]
    
    # Add caregiver as CAREGIVER to group
    cg_member = CareGroupMember(
        care_group_id=uuid.UUID(group_id),
        user_id=caregiver["id"],
        role=UserRole.CAREGIVER
    )
    async_session.add(cg_member)
    await async_session.commit()
    
    # 2. Caregiver tries to generate invite (should fail with 403)
    invite_res = await client.post(
        "/api/v1/invites",
        json={"care_group_id": group_id},
        headers=caregiver["headers"]
    )
    assert invite_res.status_code == 403

@pytest.mark.asyncio
async def test_invite_accept_expired_rejected(client: AsyncClient):
    caregiver = await create_auth_user(client, "caregiver_exp@example.com", "Caregiver User")
    group_id = str(uuid.uuid4())
    
    # Create an expired token (using our secret key but expired time)
    expired_payload = {
        "sub": "invite",
        "group_id": group_id,
        "role": "CAREGIVER",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1)
    }
    expired_token = create_access_token(expired_payload)
    
    # Try to accept expired invite
    accept_res = await client.post(
        "/api/v1/invites/accept",
        json={"token": expired_token},
        headers=caregiver["headers"]
    )
    assert accept_res.status_code == 400

@pytest.mark.asyncio
async def test_rbac_exclusions_forbidden_for_caregiver(client: AsyncClient, async_session: AsyncSession):
    # 1. Admin and Caregiver setup
    admin = await create_auth_user(client, "admin_rbac@example.com", "Admin")
    caregiver = await create_auth_user(client, "caregiver_rbac@example.com", "Caregiver")
    
    # Create group and patient
    group_res = await client.post(
        "/api/v1/care-groups",
        json={"name": "Grupo Real"},
        headers=admin["headers"]
    )
    group_id = uuid.UUID(group_res.json()["id"])
    
    # Add caregiver as CAREGIVER to group
    cg_member = CareGroupMember(
        care_group_id=group_id,
        user_id=caregiver["id"],
        role=UserRole.CAREGIVER
    )
    async_session.add(cg_member)
    await async_session.commit()
    
    # Create Patient, Task, and Protocol
    patient_res = await client.post(
        "/api/v1/care-recipients",
        json={"care_group_id": str(group_id), "name": "Paciente X"},
        headers=admin["headers"]
    )
    patient_id = patient_res.json()["id"]
    
    task_res = await client.post(
        f"/api/v1/care-groups/{group_id}/tasks",
        json={"title": "Fazer comida", "due_date": "2026-08-10T12:00:00Z"},
        headers=admin["headers"]
    )
    task_id = task_res.json()["id"]
    
    protocol_res = await client.post(
        f"/api/v1/care-recipients/{patient_id}/protocols",
        json={
            "medication_name": "Aspirina",
            "dosage": "100mg",
            "frequency_interval_hours": 12,
            "stock_count": 30,
            "safety_threshold": 5
        },
        headers=admin["headers"]
    )
    protocol_id = protocol_res.json()["id"]
    
    # 2. Caregiver tries to delete CareGroup (should fail with 403)
    del_group = await client.delete(f"/api/v1/care-groups/{group_id}", headers=caregiver["headers"])
    assert del_group.status_code == 403
    
    # 3. Caregiver tries to delete CareRecipient (should fail with 403)
    del_patient = await client.delete(f"/api/v1/care-recipients/{patient_id}", headers=caregiver["headers"])
    assert del_patient.status_code == 403
    
    # 4. Caregiver tries to delete Task (should fail with 403)
    del_task = await client.delete(f"/api/v1/tasks/{task_id}", headers=caregiver["headers"])
    assert del_task.status_code == 403
    
    # 5. Caregiver tries to delete Protocol (should fail with 403)
    del_protocol = await client.delete(f"/api/v1/protocols/{protocol_id}", headers=caregiver["headers"])
    assert del_protocol.status_code == 403


@pytest.mark.asyncio
async def test_list_care_group_members(client: AsyncClient, async_session: AsyncSession):
    # Register admin and caregiver
    admin = await create_auth_user(client, "admin_list@example.com", "Admin List")
    caregiver = await create_auth_user(client, "caregiver_list@example.com", "Caregiver List")
    
    # Create group
    group_res = await client.post(
        "/api/v1/care-groups",
        json={"name": "Grupo Lista"},
        headers=admin["headers"]
    )
    group_id = group_res.json()["id"]
    
    # Add caregiver as CAREGIVER to group
    cg_member = CareGroupMember(
        care_group_id=uuid.UUID(group_id),
        user_id=caregiver["id"],
        role=UserRole.CAREGIVER
    )
    async_session.add(cg_member)
    await async_session.commit()
    
    # List members
    members_res = await client.get(
        f"/api/v1/care-groups/{group_id}/members",
        headers=admin["headers"]
    )
    assert members_res.status_code == 200
    members = members_res.json()
    assert len(members) == 2
    
    # Check roles and details
    roles = {m["user_id"]: m["role"] for m in members}
    assert roles[str(admin["id"])] == "ADMIN"
    assert roles[str(caregiver["id"])] == "CAREGIVER"
