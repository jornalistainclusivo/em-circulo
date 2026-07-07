import pytest
import uuid
from httpx import AsyncClient

# Helper para criação de usuários e login
async def create_test_user(client: AsyncClient, email: str, name: str) -> dict:
    register_payload = {
        "email": email,
        "password": "SenhaSegura123!",
        "full_name": name,
    }
    await client.post("/api/v1/auth/register", json=register_payload)
    
    login_payload = {
        "username": email,
        "password": "SenhaSegura123!",
    }
    login_res = await client.post("/api/v1/auth/login", data=login_payload)
    token = login_res.json()["access_token"]
    
    return {
        "headers": {"Authorization": f"Bearer {token}"}
    }


@pytest.mark.asyncio
async def test_update_profile_success(client: AsyncClient):
    user = await create_test_user(client, "profile_test@example.com", "João da Silva")
    
    # Verify initial profile
    me_res = await client.get("/api/v1/auth/me", headers=user["headers"])
    assert me_res.status_code == 200
    assert me_res.json()["whatsapp"] is None
    assert me_res.json()["profession"] is None
    
    # Update profile
    update_payload = {
        "full_name": "João Silva Editado",
        "whatsapp": "+5511999999999",
        "profession": "Enfermeiro"
    }
    res = await client.patch(
        "/api/v1/users/me",
        json=update_payload,
        headers=user["headers"]
    )
    assert res.status_code == 200
    data = res.json()
    assert data["full_name"] == "João Silva Editado"
    assert data["whatsapp"] == "+5511999999999"
    assert data["profession"] == "Enfermeiro"
    
    # Verify profile persisted
    me_res2 = await client.get("/api/v1/auth/me", headers=user["headers"])
    assert me_res2.status_code == 200
    assert me_res2.json()["full_name"] == "João Silva Editado"
    assert me_res2.json()["whatsapp"] == "+5511999999999"
    assert me_res2.json()["profession"] == "Enfermeiro"


@pytest.mark.asyncio
async def test_admin_can_update_patient_expanded_fields(client: AsyncClient):
    admin = await create_test_user(client, "patient_admin_test@example.com", "Admin Grupo")
    
    # Create group
    group_res = await client.post(
        "/api/v1/care-groups",
        json={"name": "Grupo Silva"},
        headers=admin["headers"]
    )
    group_id = group_res.json()["id"]

    # Create care recipient
    recipient_res = await client.post(
        "/api/v1/care-recipients",
        json={"care_group_id": group_id, "name": "Vovó Maria"},
        headers=admin["headers"]
    )
    recipient_id = recipient_res.json()["id"]
    
    # Verify initial patient data
    assert recipient_res.json()["medical_conditions"] is None
    assert recipient_res.json()["observations"] is None
    
    # Update patient expanded fields
    update_payload = {
        "medical_conditions": "Diabetes tipo 2 e Hipertensão",
        "observations": "Gosta de tomar o remédio da manhã com suco de laranja."
    }
    res = await client.patch(
        f"/api/v1/care-recipients/{recipient_id}",
        json=update_payload,
        headers=admin["headers"]
    )
    assert res.status_code == 200
    data = res.json()
    assert data["medical_conditions"] == "Diabetes tipo 2 e Hipertensão"
    assert data["observations"] == "Gosta de tomar o remédio da manhã com suco de laranja."
