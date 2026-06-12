from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from typing import List
from sqlmodel import select
from app.database import get_session
from app.models import MedicationProtocol, MedicationLog, CareRecipient, Task, TaskStatus, utc_now
from app.schemas import ProtocolCreate, MedicationLogCreate, MedicationProtocolResponse, MedicationLogResponse

router = APIRouter(tags=["Protocols"])

@router.post("/api/v1/care-recipients/{recipient_id}/protocols")
async def create_protocol(recipient_id: uuid.UUID, payload: ProtocolCreate, session: AsyncSession = Depends(get_session)):
    recipient = await session.get(CareRecipient, recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Care recipient not found")
        
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
async def log_medication(protocol_id: uuid.UUID, payload: MedicationLogCreate, background_tasks: BackgroundTasks, session: AsyncSession = Depends(get_session)):
    protocol = await session.get(MedicationProtocol, protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
        
    log = MedicationLog(
        protocol_id=protocol_id,
        **payload.model_dump()
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
