"""
routers/notifications.py — Fase 10.1

GET /api/v1/care-groups/{group_id}/notifications
  - Protegido: apenas membros do grupo (ADMIN ou CAREGIVER)
  - Query param opcional: ?unread=true — retorna apenas não-lidas
  - Ordenação: created_at DESC (mais recente primeiro)
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models import CareGroup, CareGroupMember, Notification, User, UserRole
from app.schemas import NotificationResponse
from app.auth.dependencies import get_current_user

router = APIRouter(tags=["Notifications"])


@router.get(
    "/api/v1/care-groups/{group_id}/notifications",
    response_model=List[NotificationResponse],
    summary="List notifications for a care group",
)
async def list_notifications(
    group_id: uuid.UUID,
    unread: Optional[bool] = Query(default=None, description="Filter by unread status"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Returns notifications for a care group, ordered by created_at DESC.

    RBAC: Only members of the group (ADMIN or CAREGIVER) can access.
    """
    # Verify the group exists
    group = await session.get(CareGroup, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care group not found")

    # Verify current user is a member of the group (RBAC — any role)
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == group_id,
        CareGroupMember.user_id == current_user.id,
    )
    member_result = await session.execute(member_stmt)
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this care group",
        )

    # Build query with optional unread filter
    query = select(Notification).where(Notification.care_group_id == group_id)

    if unread is True:
        query = query.where(Notification.is_read == False)  # noqa: E712

    # Order newest-first
    query = query.order_by(Notification.created_at.desc())

    result = await session.execute(query)
    notifications = result.scalars().all()
    return notifications
