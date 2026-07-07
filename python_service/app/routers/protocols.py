from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from typing import List
from sqlmodel import select
from app.database import get_session
from app.models import MedicationProtocol, MedicationLog, CareRecipient, Task, TaskStatus, utc_now, User, CareGroupMember, UserRole
from app.schemas import ProtocolCreate, MedicationLogCreate, MedicationProtocolResponse, MedicationLogResponse, ProtocolUpdate
from app.auth.dependencies import get_current_user, require_role

router = APIRouter(tags=["Protocols"])

@router.post(
    "/api/v1/care-recipients/{recipient_id}/protocols",
    response_model=MedicationProtocolResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new medication protocol for a care recipient"
)
async def create_protocol(
    recipient_id: uuid.UUID,
    payload: ProtocolCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    recipient = await session.get(CareRecipient, recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Care recipient not found")
        
    # Validate that user is a member of the CareGroup managing this recipient (BR-PRT-01)
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == recipient.care_group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_result = await session.execute(member_stmt)
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a member of the CareGroup managing this recipient"
        )
        
    protocol = MedicationProtocol(
        care_recipient_id=recipient_id,
        **payload.model_dump()
    )
    session.add(protocol)
    await session.commit()
    await session.refresh(protocol)
    return protocol

@router.get("/api/v1/care-recipients/{recipient_id}/protocols", response_model=List[MedicationProtocolResponse])
async def get_protocols(recipient_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    recipient = await session.get(CareRecipient, recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Care recipient not found")
        
    query = select(MedicationProtocol).where(MedicationProtocol.care_recipient_id == recipient_id)
    result = await session.execute(query)
    protocols = result.scalars().all()
    return protocols

async def process_replenish_task(care_recipient_id: uuid.UUID, medication_name: str, stock_count: int):
    from app.database import engine
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db_session:
        care_recipient = await db_session.get(CareRecipient, care_recipient_id)
        if care_recipient:
            replenish_task = Task(
                care_group_id=care_recipient.care_group_id,
                title=f"Repor medicamento: {medication_name}",
                description=f"O estoque do medicamento atingiu o limite crítico. Restam apenas {stock_count} unidades.",
                due_date=utc_now(),
                status=TaskStatus.PENDING
            )
            db_session.add(replenish_task)
            await db_session.commit()

@router.post("/api/v1/protocols/{protocol_id}/logs", response_model=MedicationLogResponse)
async def log_medication(
    protocol_id: uuid.UUID,
    payload: MedicationLogCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    protocol = await session.get(MedicationProtocol, protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
        
    recipient = await session.get(CareRecipient, protocol.care_recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Care recipient not found")

    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == recipient.care_group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_res = await session.execute(member_stmt)
    member = member_res.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only members of the care group can log doses"
        )

    log = MedicationLog(
        protocol_id=protocol_id,
        administered_by=member.id,
        administered_at=payload.administered_at,
        notes=payload.notes
    )
    
    # Deduct stock atomically and check threshold
    stock_alert = False
    if protocol.stock_count > 0:
        protocol.stock_count -= 1
        
    if protocol.stock_count <= protocol.safety_threshold:
        stock_alert = True
        # Injeta task no Background para não bloquear o Event Loop
        background_tasks.add_task(
            process_replenish_task, 
            protocol.care_recipient_id, 
            protocol.medication_name, 
            protocol.stock_count
        )

    session.add(log)
    session.add(protocol)
    await session.commit()
    await session.refresh(log)
    
    return MedicationLogResponse(
        id=log.id,
        protocol_id=log.protocol_id,
        administered_by=log.administered_by,
        administered_at=log.administered_at,
        notes=log.notes,
        stock_alert=stock_alert,
        remaining_balance=protocol.stock_count
    )

@router.patch("/api/v1/protocols/{protocol_id}", response_model=MedicationProtocolResponse)
async def update_protocol(
    protocol_id: uuid.UUID,
    payload: ProtocolUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    protocol = await session.get(MedicationProtocol, protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    # Fetch recipient to get group_id
    recipient = await session.get(CareRecipient, protocol.care_recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Care recipient not found")

    # Verify membership
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == recipient.care_group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_result = await session.execute(member_stmt)
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of the CareGroup managing this protocol")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(protocol, key, value)
        
    protocol.updated_at = utc_now()
    session.add(protocol)
    await session.commit()
    await session.refresh(protocol)
    return protocol

@router.delete("/api/v1/protocols/{protocol_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_protocol(
    protocol_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    role_check: CareGroupMember = Depends(require_role([UserRole.ADMIN])),
):
    protocol = await session.get(MedicationProtocol, protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    # Explicit Cascading Deletions: Logs
    log_stmt = select(MedicationLog).where(MedicationLog.protocol_id == protocol_id)
    log_res = await session.execute(log_stmt)
    logs = log_res.scalars().all()
    for log in logs:
        await session.delete(log)

    await session.delete(protocol)
    await session.commit()
