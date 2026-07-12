from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid
from typing import List

from app.database import get_session
from app.models import Appointment, CareGroupMember, User, CareRecipient
from app.schemas import AppointmentCreate, AppointmentResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/care-groups", tags=["Appointments"])

@router.post("/{group_id}/appointments", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    group_id: uuid.UUID,
    payload: AppointmentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # RBAC: Verify if current_user is member of group_id
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_result = await session.execute(member_stmt)
    if not member_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this care group")

    # Vinculação de Paciente
    recipient_stmt = select(CareRecipient).where(CareRecipient.care_group_id == group_id)
    recipient_result = await session.execute(recipient_stmt)
    recipient = recipient_result.scalars().first()
    
    if not recipient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado para o grupo especificado.")

    appointment = Appointment(
        care_recipient_id=recipient.id,
        title=payload.title,
        scheduled_at=payload.scheduled_at,
        provider_name=payload.provider_name,
        location=payload.location
    )
    session.add(appointment)
    await session.commit()
    await session.refresh(appointment)
    return appointment

@router.get("/{group_id}/appointments", response_model=List[AppointmentResponse])
async def list_appointments(
    group_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # RBAC: Verify if current_user is member of group_id
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_result = await session.execute(member_stmt)
    if not member_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this care group")
        
    # Validar se o grupo tem paciente
    recipient_stmt = select(CareRecipient).where(CareRecipient.care_group_id == group_id)
    recipient_result = await session.execute(recipient_stmt)
    recipient = recipient_result.scalars().first()
    
    if not recipient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado para o grupo especificado.")

    stmt = select(Appointment).where(
        Appointment.care_recipient_id == recipient.id
    ).order_by(Appointment.scheduled_at.desc())
    
    result = await session.execute(stmt)
    appointments = result.scalars().all()
    return appointments
