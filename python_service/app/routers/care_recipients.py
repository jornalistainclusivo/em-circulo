from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid

from app.database import get_session
from app.models import CareRecipient, CareGroupMember, UserRole, User, MedicationProtocol, MedicationLog
from app.schemas import CareRecipientCreate, CareRecipientResponse, CareRecipientUpdate
from app.auth.dependencies import get_current_user, require_role

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

@router.patch("/{recipient_id}", response_model=CareRecipientResponse)
async def update_care_recipient(
    recipient_id: uuid.UUID,
    payload: CareRecipientUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    recipient = await session.get(CareRecipient, recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Care recipient not found")

    # Verify membership in care group
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == recipient.care_group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_result = await session.execute(member_stmt)
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of the CareGroup managing this recipient")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(recipient, key, value)
        
    session.add(recipient)
    await session.commit()
    await session.refresh(recipient)
    return recipient

@router.delete("/{recipient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_care_recipient(
    recipient_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    role_check: CareGroupMember = Depends(require_role([UserRole.ADMIN])),
):
    recipient = await session.get(CareRecipient, recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Care recipient not found")

    # Explicit Cascading Deletions: Protocols and Logs
    prot_stmt = select(MedicationProtocol).where(MedicationProtocol.care_recipient_id == recipient_id)
    prot_res = await session.execute(prot_stmt)
    protocols = prot_res.scalars().all()
    for prot in protocols:
        log_stmt = select(MedicationLog).where(MedicationLog.protocol_id == prot.id)
        log_res = await session.execute(log_stmt)
        logs = log_res.scalars().all()
        for log in logs:
            await session.delete(log)
        await session.delete(prot)

    await session.delete(recipient)
    await session.commit()
