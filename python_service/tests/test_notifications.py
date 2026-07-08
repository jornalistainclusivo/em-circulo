"""
tests/test_notifications.py — Fase 10.1: Notificações Inteligentes

Suíte TDD que garante:
  FR-NT-01: Não-membros do grupo recebem 403
  FR-NT-02: CAREGIVERs membros podem listar notificações
  FR-NT-03: ADMINs membros podem listar notificações
  FR-NT-04: Registrar dose → notificação DOSE_REGISTERED criada no banco
  FR-NT-05: ?unread=true retorna apenas notificações não-lidas
"""

import uuid
import pytest
import pytest_asyncio
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models import (
    CareGroup, CareGroupMember, CareRecipient, User, UserRole,
    MedicationProtocol, Notification, NotificationType,
)
from app.database import get_session
from app.auth.dependencies import get_current_user

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(suffix: str = "") -> User:
    return User(
        email=f"notif{suffix}_{uuid.uuid4().hex[:6]}@test.com",
        hashed_password="hashed",
        full_name=f"Test User {suffix}",
    )


async def create_full_setup(session: AsyncSession, role: UserRole = UserRole.ADMIN):
    """Minimal setup: User → CareGroup → CareGroupMember → CareRecipient → MedicationProtocol."""
    user = make_user("admin" if role == UserRole.ADMIN else "caregiver")
    session.add(user)

    group = CareGroup(name=f"Test Group {uuid.uuid4().hex[:4]}")
    session.add(group)
    await session.flush()

    member = CareGroupMember(care_group_id=group.id, user_id=user.id, role=role)
    session.add(member)

    recipient = CareRecipient(care_group_id=group.id, name="Patient A")
    session.add(recipient)
    await session.flush()

    protocol = MedicationProtocol(
        care_recipient_id=recipient.id,
        medication_name="Aspirina",
        dosage="100mg",
        frequency_interval_hours=24,
        stock_count=10,
        safety_threshold=2,
    )
    session.add(protocol)
    await session.flush()

    return user, group, member, recipient, protocol


# ---------------------------------------------------------------------------
# Tests — RBAC (FR-NT-01 / FR-NT-02 / FR-NT-03)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_non_member_cannot_list_notifications(client: AsyncClient, async_session: AsyncSession):
    """FR-NT-01: Usuário fora do grupo recebe 403."""
    outsider = make_user("outsider")
    async_session.add(outsider)
    group = CareGroup(name=f"Private Group {uuid.uuid4().hex[:4]}")
    async_session.add(group)
    await async_session.flush()

    app.dependency_overrides[get_current_user] = lambda: outsider

    response = await client.get(f"/api/v1/care-groups/{group.id}/notifications")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_caregiver_can_list_notifications(client: AsyncClient, async_session: AsyncSession):
    """FR-NT-02: CAREGIVER membro pode listar notificações (lista vazia é válido)."""
    user, group, _, _, _ = await create_full_setup(async_session, role=UserRole.CAREGIVER)
    app.dependency_overrides[get_current_user] = lambda: user

    response = await client.get(f"/api/v1/care-groups/{group.id}/notifications")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_admin_can_list_notifications(client: AsyncClient, async_session: AsyncSession):
    """FR-NT-03: ADMIN membro pode listar notificações."""
    user, group, _, _, _ = await create_full_setup(async_session, role=UserRole.ADMIN)
    app.dependency_overrides[get_current_user] = lambda: user

    response = await client.get(f"/api/v1/care-groups/{group.id}/notifications")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ---------------------------------------------------------------------------
# Tests — Dose Registration triggers Notification (FR-NT-04)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_logging_dose_creates_notification(client: AsyncClient, async_session: AsyncSession):
    """FR-NT-04: Registrar dose cria notificação DOSE_REGISTERED atrelada ao grupo."""
    user, group, member, recipient, protocol = await create_full_setup(async_session, role=UserRole.ADMIN)
    app.dependency_overrides[get_current_user] = lambda: user

    payload = {
        "administered_by": str(member.id),
        "administered_at": datetime.now(timezone.utc).isoformat(),
        "notes": "Dose do almoço",
    }

    response = await client.post(f"/api/v1/protocols/{protocol.id}/logs", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    # Verify notification persisted in DB
    # Use a new query after the HTTP call (the route committed a separate transaction)
    stmt = select(Notification).where(
        Notification.care_group_id == group.id,
        Notification.type == NotificationType.DOSE_REGISTERED,
    )
    # Expire cache to see committed rows from the endpoint's separate session
    await async_session.execute(select(Notification).limit(0))  # flush cache
    result = await async_session.execute(stmt)
    notification = result.scalar_one_or_none()

    assert notification is not None, "Notificação DOSE_REGISTERED deve ser criada após registrar dose"
    assert notification.is_read is False
    assert "Aspirina" in notification.message


# ---------------------------------------------------------------------------
# Tests — Unread filter (FR-NT-05)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_unread_filter_returns_only_unread(client: AsyncClient, async_session: AsyncSession):
    """FR-NT-05: ?unread=true filtra apenas notificações não-lidas."""
    user, group, _, _, _ = await create_full_setup(async_session, role=UserRole.ADMIN)

    async_session.add(Notification(
        care_group_id=group.id,
        title="Lida",
        message="Já foi lida",
        type=NotificationType.TASK_COMPLETED,
        is_read=True,
    ))
    async_session.add(Notification(
        care_group_id=group.id,
        title="Não lida",
        message="Ainda não foi lida",
        type=NotificationType.DOSE_REGISTERED,
        is_read=False,
    ))
    await async_session.flush()

    app.dependency_overrides[get_current_user] = lambda: user

    response = await client.get(f"/api/v1/care-groups/{group.id}/notifications?unread=true")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["is_read"] is False
    assert data[0]["title"] == "Não lida"
