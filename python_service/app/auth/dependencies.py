"""
FastAPI dependency: resolve the current authenticated user from JWT.

Usage in route:
    @router.get("/me")
    async def get_me(current_user: User = Depends(get_current_user)):
        ...
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List, Optional
import uuid

from app.database import get_session
from app.models import User, UserRole, CareGroupMember, CareRecipient, Task, MedicationProtocol
from app.auth.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    """
    Validate the Bearer token and return the corresponding User.
    Raises HTTP 401 if the token is invalid or the user is not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_role(allowed_roles: List[UserRole]):
    """
    Dependency factory to enforce role-based access control (RBAC).
    Resolves the CareGroup ID from path parameters (group_id, recipient_id, task_id, protocol_id)
    and verifies if the current user has the correct role in that group.
    """
    async def dependency(
        group_id: Optional[uuid.UUID] = None,
        recipient_id: Optional[uuid.UUID] = None,
        task_id: Optional[uuid.UUID] = None,
        protocol_id: Optional[uuid.UUID] = None,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
    ) -> CareGroupMember:
        resolved_group_id = group_id
        
        if not resolved_group_id:
            if recipient_id:
                recipient = await session.get(CareRecipient, recipient_id)
                if recipient:
                    resolved_group_id = recipient.care_group_id
            elif task_id:
                task = await session.get(Task, task_id)
                if task:
                    resolved_group_id = task.care_group_id
            elif protocol_id:
                protocol = await session.get(MedicationProtocol, protocol_id)
                if protocol:
                    recipient = await session.get(CareRecipient, protocol.care_recipient_id)
                    if recipient:
                        resolved_group_id = recipient.care_group_id

        if not resolved_group_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CareGroup context could not be resolved from path parameters."
            )

        member_stmt = select(CareGroupMember).where(
            CareGroupMember.care_group_id == resolved_group_id,
            CareGroupMember.user_id == current_user.id
        )
        member_res = await session.execute(member_stmt)
        member = member_res.scalar_one_or_none()

        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of the CareGroup managing this resource."
            )

        if member.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions. Role ADMIN is required."
            )

        return member

    return dependency
