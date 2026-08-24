from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid
from typing import List

from app.database import get_session
from app.models import WeeklyReport, CareGroupMember, User, CareRecipient, Notification, NotificationType
from app.schemas import WeeklyReportCreate, WeeklyReportResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/care-groups", tags=["WeeklyReports"])

@router.post("/{group_id}/recipients/{recipient_id}/weekly-reports", response_model=WeeklyReportResponse, status_code=status.HTTP_201_CREATED)
async def create_weekly_report(
    group_id: uuid.UUID,
    recipient_id: uuid.UUID,
    payload: WeeklyReportCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # RBAC: Verify if current_user is member of group_id
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_result = await session.execute(member_stmt)
    member = member_result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this care group")

    # Vinculação de Paciente
    recipient_stmt = select(CareRecipient).where(CareRecipient.id == recipient_id, CareRecipient.care_group_id == group_id)
    recipient_result = await session.execute(recipient_stmt)
    recipient = recipient_result.scalars().first()
    
    if not recipient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado para o grupo especificado.")

    report = WeeklyReport(
        care_recipient_id=recipient.id,
        author_id=member.id,
        report_date=payload.report_date,
        summary_text=payload.summary_text,
        mood=payload.mood,
        diet=payload.diet,
        wellbeing_notes=payload.wellbeing_notes
    )
    session.add(report)
    
    # Criar Notificação
    notification = Notification(
        care_group_id=group_id,
        title="Novo Diário de Evolução",
        message=f"{current_user.full_name} registrou uma nova atualização no Diário.",
        type=NotificationType.REPORT_ADDED
    )
    session.add(notification)
    
    await session.commit()
    await session.refresh(report)
    return report

@router.get("/{group_id}/recipients/{recipient_id}/weekly-reports", response_model=List[WeeklyReportResponse])
async def list_weekly_reports(
    group_id: uuid.UUID,
    recipient_id: uuid.UUID,
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
    recipient_stmt = select(CareRecipient).where(CareRecipient.id == recipient_id, CareRecipient.care_group_id == group_id)
    recipient_result = await session.execute(recipient_stmt)
    recipient = recipient_result.scalars().first()
    
    if not recipient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado para o grupo especificado.")

    stmt = select(WeeklyReport).where(
        WeeklyReport.care_recipient_id == recipient.id
    ).order_by(WeeklyReport.report_date.desc())
    
    result = await session.execute(stmt)
    reports = result.scalars().all()
    return reports
