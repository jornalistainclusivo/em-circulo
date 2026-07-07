from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import timedelta
import uuid

from app.database import get_session
from app.models import CareGroup, CareGroupMember, UserRole, User
from app.schemas import InviteCreate, InviteResponse, InviteAccept
from app.auth.dependencies import get_current_user
from app.auth.security import create_access_token, decode_access_token

router = APIRouter(prefix="/api/v1/invites", tags=["Invites"])


@router.post(
    "",
    response_model=InviteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a secure invite token for a CareGroup"
)
async def create_invite(
    payload: InviteCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Verify that the current user is an ADMIN of the specified CareGroup
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == payload.care_group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_res = await session.execute(member_stmt)
    member = member_res.scalar_one_or_none()

    if not member or member.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only ADMINs can generate invite links for this CareGroup"
        )

    # Generate token with 48h expiration
    token_payload = {
        "sub": "invite",
        "group_id": str(payload.care_group_id),
        "role": UserRole.CAREGIVER.value
    }
    token = create_access_token(token_payload, expires_delta=timedelta(hours=48))

    invite_link = f"http://localhost:3000/convite/{token}"

    return InviteResponse(token=token, invite_link=invite_link)


@router.post(
    "/accept",
    status_code=status.HTTP_200_OK,
    summary="Accept an invite token and join a CareGroup"
)
async def accept_invite(
    payload: InviteAccept,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Decode and validate token
    token_data = decode_access_token(payload.token)
    if token_data is None or token_data.get("sub") != "invite":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invite token"
        )

    group_id_str = token_data.get("group_id")
    role_str = token_data.get("role", UserRole.CAREGIVER.value)

    if not group_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invite token payload"
        )

    group_id = uuid.UUID(group_id_str)

    # Verify if CareGroup exists
    group = await session.get(CareGroup, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CareGroup not found"
        )

    # Verify if user is already a member
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_res = await session.execute(member_stmt)
    member = member_res.scalar_one_or_none()

    if member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já faz parte deste grupo"
        )

    # Add user as member
    new_member = CareGroupMember(
        care_group_id=group_id,
        user_id=current_user.id,
        role=UserRole(role_str)
    )
    session.add(new_member)
    await session.commit()

    return {"detail": "Joined CareGroup successfully"}
