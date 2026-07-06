"""
TDD — Onboarding (v0.4) Endpoint Tests

Cenários de teste para as rotas:
  - POST /api/v1/care-groups
  - POST /api/v1/care-recipients

Garante que os endpoints exijam autenticação JWT e respeitem as regras de negócio:
  - BR-CG-01 (Criador do grupo é cadastrado como ADMIN na tabela care_group_members).
  - BR-CR-01 (Apenas ADMIN do grupo pode cadastrar o paciente).
  - BR-CR-02 (Apenas 1 paciente por grupo de cuidado).
"""

import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import CareGroup, CareGroupMember, CareRecipient, UserRole

# ---------------------------------------------------------------------------
# Helpers para Autenticação nos Testes
# ---------------------------------------------------------------------------

async def create_test_user(client: AsyncClient, email: str, name: str) -> dict:
    """Registra e faz login de um usuário de teste para retornar o token e dados."""
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
        "email": email,
        "full_name": name,
        "headers": {"Authorization": f"Bearer {token}"}
    }


# ---------------------------------------------------------------------------
# 1. POST /api/v1/care-groups (Fundação do Grupo)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_care_group_unauthorized(client: AsyncClient):
    """POST /api/v1/care-groups sem token JWT retorna 401 Unauthorized."""
    # Act
    response = await client.post("/api/v1/care-groups", json={"name": "Grupo de Teste"})
    
    # Assert
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_care_group_success(client: AsyncClient, async_session: AsyncSession):
    """POST /api/v1/care-groups com token cria o grupo e define o criador como ADMIN."""
    # Arrange
    user = await create_test_user(client, "criador@example.com", "Criador Silva")
    payload = {"name": "Família Silva"}
    
    # Act
    response = await client.post(
        "/api/v1/care-groups",
        json=payload,
        headers=user["headers"]
    )
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Família Silva"
    assert "id" in data
    
    # Validar side-effect no banco (BR-CG-01)
    group_id = uuid.UUID(data["id"])
    
    # Buscar associação de membros do grupo
    stmt = select(CareGroupMember).where(CareGroupMember.care_group_id == group_id)
    result = await async_session.execute(stmt)
    members = result.scalars().all()
    
    assert len(members) == 1
    member = members[0]
    assert member.role == UserRole.ADMIN


# ---------------------------------------------------------------------------
# 2. POST /api/v1/care-recipients (Cadastro do Paciente)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_care_recipient_unauthorized(client: AsyncClient):
    """POST /api/v1/care-recipients sem token JWT retorna 401 Unauthorized."""
    # Act
    payload = {
        "care_group_id": str(uuid.uuid4()),
        "name": "Maria Silva",
    }
    response = await client.post("/api/v1/care-recipients", json=payload)
    
    # Assert
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_care_recipient_success(client: AsyncClient, async_session: AsyncSession):
    """POST /api/v1/care-recipients com token (ADMIN) cria o paciente com sucesso."""
    # Arrange
    user = await create_test_user(client, "admin_paciente@example.com", "Admin Silva")
    
    # Criar grupo de cuidado
    group_res = await client.post(
        "/api/v1/care-groups",
        json={"name": "Família Silva"},
        headers=user["headers"]
    )
    group_id = group_res.json()["id"]
    
    payload = {
        "care_group_id": group_id,
        "name": "Maria Silva",
        "blood_type": "O+",
        "allergies": ["Dipirona"],
        "emergency_contacts": [{"name": "Filho", "phone": "99999-9999"}]
    }
    
    # Act
    response = await client.post(
        "/api/v1/care-recipients",
        json=payload,
        headers=user["headers"]
    )
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Maria Silva"
    assert data["blood_type"] == "O+"
    assert data["allergies"] == ["Dipirona"]
    assert data["emergency_contacts"] == [{"name": "Filho", "phone": "99999-9999"}]
    assert data["care_group_id"] == group_id


@pytest.mark.asyncio
async def test_create_care_recipient_forbidden_non_member(client: AsyncClient):
    """POST /api/v1/care-recipients por usuário que não pertence ao grupo retorna 403 Forbidden."""
    # Arrange
    user_admin = await create_test_user(client, "admin_grupo@example.com", "Admin Grupo")
    user_other = await create_test_user(client, "intruso@example.com", "Intruso Silva")
    
    # Criar grupo
    group_res = await client.post(
        "/api/v1/care-groups",
        json={"name": "Família Silva"},
        headers=user_admin["headers"]
    )
    group_id = group_res.json()["id"]
    
    payload = {
        "care_group_id": group_id,
        "name": "Maria Silva",
    }
    
    # Act
    response = await client.post(
        "/api/v1/care-recipients",
        json=payload,
        headers=user_other["headers"]
    )
    
    # Assert
    assert response.status_code == 403
    assert response.json()["detail"] == "User is not an ADMIN of the specified CareGroup"


@pytest.mark.asyncio
async def test_create_care_recipient_duplicate_conflict(client: AsyncClient):
    """POST /api/v1/care-recipients retorna 409 Conflict se o grupo já possui um paciente cadastrado."""
    # Arrange
    user = await create_test_user(client, "admin_dup@example.com", "Admin Dup")
    
    # Criar grupo
    group_res = await client.post(
        "/api/v1/care-groups",
        json={"name": "Família Silva"},
        headers=user["headers"]
    )
    group_id = group_res.json()["id"]
    
    # Cadastrar primeiro paciente
    await client.post(
        "/api/v1/care-recipients",
        json={"care_group_id": group_id, "name": "Maria Silva"},
        headers=user["headers"]
    )
    
    # Act - Tentar cadastrar segundo paciente para o mesmo grupo
    response = await client.post(
        "/api/v1/care-recipients",
        json={"care_group_id": group_id, "name": "Carlos Silva"},
        headers=user["headers"]
    )
    
    # Assert
    assert response.status_code == 409
    assert response.json()["detail"] == "CareGroup already has a CareRecipient"
