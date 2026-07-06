from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from typing import List
from app.database import get_session
from sqlmodel import select
from app.models import CareGroup, CareGroupMember, UserRole, User, Task, CareRecipient
from app.schemas import CareGroupCreate, CareGroupResponse, TaskCreate, TaskResponse, CareRecipientResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/care-groups", tags=["Care Groups"])

@router.get("", response_model=List[CareGroupResponse])
async def list_care_groups(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    stmt = select(CareGroup).join(CareGroupMember).where(CareGroupMember.user_id == current_user.id)
    result = await session.execute(stmt)
    groups = result.scalars().all()
    return groups

@router.get("/{group_id}/recipients", response_model=List[CareRecipientResponse])
async def get_care_group_recipients(
    group_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify membership
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_result = await session.execute(member_stmt)
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this care group")
        
    stmt = select(CareRecipient).where(CareRecipient.care_group_id == group_id)
    result = await session.execute(stmt)
    recipients = result.scalars().all()
    return recipients

@router.post(
    "",
    response_model=CareGroupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new care group"
)
async def create_care_group(
    payload: CareGroupCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # 1. Create the care group
    group = CareGroup(name=payload.name)
    session.add(group)
    await session.commit()
    await session.refresh(group)
    
    # 2. Add the creator as ADMIN in CareGroupMember (BR-CG-01)
    member = CareGroupMember(
        care_group_id=group.id,
        user_id=current_user.id,
        role=UserRole.ADMIN
    )
    session.add(member)
    await session.commit()
    await session.refresh(group)
    
    return group

@router.post("/{group_id}/tasks", response_model=TaskResponse)
async def create_task(group_id: uuid.UUID, payload: TaskCreate, session: AsyncSession = Depends(get_session)):
    group = await session.get(CareGroup, group_id)
    if not group:
         raise HTTPException(status_code=404, detail="Care group not found")
         
    task = Task(
        care_group_id=group_id,
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        recurrence_rule=payload.recurrence_rule
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    
    return task

@router.get("/{group_id}/tasks", response_model=List[TaskResponse])
async def get_tasks(group_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    group = await session.get(CareGroup, group_id)
    if not group:
         raise HTTPException(status_code=404, detail="Care group not found")
         
    query = select(Task).where(Task.care_group_id == group_id).order_by(Task.due_date)
    result = await session.execute(query)
    tasks = result.scalars().all()
    
    return tasks
