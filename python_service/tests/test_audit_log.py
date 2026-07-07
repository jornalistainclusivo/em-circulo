import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime, timedelta, timezone

from app.models import CareGroup, CareGroupMember, UserRole, User, CareRecipient, MedicationProtocol, MedicationLog
from app.auth.security import create_access_token

async def create_auth_user(client: AsyncClient, email: str, name: str) -> dict:
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
        "name": name,
        "headers": {"Authorization": f"Bearer {token}"}
    }

@pytest.mark.asyncio
async def test_get_medication_logs_success(client: AsyncClient, async_session: AsyncSession):
    # 1. Register admin user and caregiver user
    admin = await create_auth_user(client, "admin_log@example.com", "Admin Logged")
    caregiver = await create_auth_user(client, "caregiver_log@example.com", "Caregiver Logged")
    
    # 2. Admin creates a care group
    group_res = await client.post(
        "/api/v1/care-groups",
        json={"name": "Grupo Logs"},
        headers=admin["headers"]
    )
    assert group_res.status_code == 201
    group_id = uuid.UUID(group_res.json()["id"])
    
    # 3. Add caregiver to care group
    cg_member = CareGroupMember(
        care_group_id=group_id,
        user_id=caregiver["id"],
        role=UserRole.CAREGIVER
    )
    async_session.add(cg_member)
    await async_session.commit()
    
    # 4. Register a patient
    patient_res = await client.post(
        "/api/v1/care-recipients",
        json={"care_group_id": str(group_id), "name": "Paciente Logs"},
        headers=admin["headers"]
    )
    assert patient_res.status_code == 201
    patient_id = uuid.UUID(patient_res.json()["id"])
    
    # 5. Register a medication protocol
    protocol_res = await client.post(
        f"/api/v1/care-recipients/{patient_id}/protocols",
        json={
            "medication_name": "Paracetamol",
            "dosage": "500mg",
            "frequency_interval_hours": 8,
            "stock_count": 50,
            "safety_threshold": 5
        },
        headers=admin["headers"]
    )
    assert protocol_res.status_code == 201
    protocol_id = uuid.UUID(protocol_res.json()["id"])
    
    # 6. Log medication dose via admin
    log_admin_res = await client.post(
        f"/api/v1/protocols/{protocol_id}/logs",
        json={
            "administered_by": str(admin["id"]),
            "administered_at": "2026-07-07T10:00:00Z"
        },
        headers=admin["headers"]
    )
    assert log_admin_res.status_code == 200
    
    # 7. Log medication dose via caregiver (later)
    log_cg_res = await client.post(
        f"/api/v1/protocols/{protocol_id}/logs",
        json={
            "administered_by": str(caregiver["id"]),
            "administered_at": "2026-07-07T18:00:00Z"
        },
        headers=caregiver["headers"]
    )
    assert log_cg_res.status_code == 200
    
    # 8. Query logs via caregiver (should succeed)
    get_logs_res = await client.get(
        f"/api/v1/care-recipients/{patient_id}/medication-logs",
        headers=caregiver["headers"]
    )
    assert get_logs_res.status_code == 200
    logs = get_logs_res.json()
    
    # Check count and sorting (descending)
    assert len(logs) == 2
    assert logs[0]["administered_by"] == "Caregiver Logged"
    assert logs[0]["medication_name"] == "Paracetamol"
    assert logs[0]["dosage"] == "500mg"
    
    assert logs[1]["administered_by"] == "Admin Logged"
    assert logs[1]["medication_name"] == "Paracetamol"
    assert logs[1]["dosage"] == "500mg"

@pytest.mark.asyncio
async def test_get_medication_logs_unauthorized_user(client: AsyncClient):
    admin = await create_auth_user(client, "admin_unauth_log@example.com", "Admin Owner")
    other_user = await create_auth_user(client, "other_log@example.com", "Other User")
    
    group_res = await client.post(
        "/api/v1/care-groups",
        json={"name": "Grupo Privado"},
        headers=admin["headers"]
    )
    group_id = uuid.UUID(group_res.json()["id"])
    
    patient_res = await client.post(
        "/api/v1/care-recipients",
        json={"care_group_id": str(group_id), "name": "Paciente Privado"},
        headers=admin["headers"]
    )
    patient_id = uuid.UUID(patient_res.json()["id"])
    
    # Other user (non-member) tries to get logs
    get_logs_res = await client.get(
        f"/api/v1/care-recipients/{patient_id}/medication-logs",
        headers=other_user["headers"]
    )
    assert get_logs_res.status_code == 403
