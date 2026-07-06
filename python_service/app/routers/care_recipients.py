from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid

from app.database import get_session
from app.models import CareRecipient, CareGroupMember, UserRole, User
from app.schemas import CareRecipientCreate, CareRecipientResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/care-recipients", tags=["Care Recipients"])

@router.post(
    "",
    response_model=CareRecipientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new care recipient for a care group"
)
async def create_care_recipient(
    payload: CareRecipientCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # 1. Validate that current_user is an ADMIN of the specified CareGroup (BR-CR-01)
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == payload.care_group_id,
        CareGroupMember.user_id == current_user.id,
        CareGroupMember.role == UserRole.ADMIN
    )
    member_result = await session.execute(member_stmt)
    member = member_result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not an ADMIN of the specified CareGroup"
        )
        
    # 2. Validate that the CareGroup does not already have a CareRecipient (BR-CR-02)
    recipient_stmt = select(CareRecipient).where(
        CareRecipient.care_group_id == payload.care_group_id
    )
    recipient_result = await session.execute(recipient_stmt)
    existing_recipient = recipient_result.scalar_one_or_none()
    
    if existing_recipient:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="CareGroup already has a CareRecipient"
        )
        
    # 3. Create the care recipient
    recipient = CareRecipient(
        care_group_id=payload.care_group_id,
        name=payload.name,
        blood_type=payload.blood_type,
        allergies=payload.allergies,
        emergency_contacts=payload.emergency_contacts
    )
    session.add(recipient)
    await session.commit()
    await session.refresh(recipient)
    
    return recipient
