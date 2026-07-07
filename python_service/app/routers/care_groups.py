from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from typing import List
from app.database import get_session
from sqlmodel import select
from app.models import CareGroup, CareGroupMember, UserRole, User, Task, CareRecipient, MedicationProtocol, MedicationLog
from app.schemas import CareGroupCreate, CareGroupResponse, TaskCreate, TaskResponse, CareRecipientResponse, CareGroupUpdate, CareGroupMemberResponse
from app.auth.dependencies import get_current_user, require_role

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

@router.get("/{group_id}/members", response_model=List[CareGroupMemberResponse])
async def list_care_group_members(
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
        
    # Get all members with user details
    stmt = select(CareGroupMember, User).join(User, CareGroupMember.user_id == User.id).where(CareGroupMember.care_group_id == group_id)
    result = await session.execute(stmt)
    rows = result.all()
    
    return [
        CareGroupMemberResponse(
            id=m.id,
            care_group_id=m.care_group_id,
            user_id=m.user_id,
            role=m.role.value,
            full_name=u.full_name,
            email=u.email
        )
        for m, u in rows
    ]

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

@router.post(
    "/{group_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task for a care group"
)
async def create_task(
    group_id: uuid.UUID,
    payload: TaskCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    group = await session.get(CareGroup, group_id)
    if not group:
         raise HTTPException(status_code=404, detail="Care group not found")
         
    # Validate that user is a member of the care group (BR-TSK-01)
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_result = await session.execute(member_stmt)
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a member of this CareGroup"
        )
         
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

@router.patch("/{group_id}", response_model=CareGroupResponse)
async def update_care_group(
    group_id: uuid.UUID,
    payload: CareGroupUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    group = await session.get(CareGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Care group not found")

    # Verify membership
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_result = await session.execute(member_stmt)
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this care group")

    # Update fields with exclude_unset=True
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(group, key, value)
    
    session.add(group)
    await session.commit()
    await session.refresh(group)
    return group

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_care_group(
    group_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    role_check: CareGroupMember = Depends(require_role([UserRole.ADMIN])),
):
    group = await session.get(CareGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Care group not found")

    # Explicit Cascading Deletions to prevent FK errors
    # 1. Patients, Protocols, Logs
    recipient_stmt = select(CareRecipient).where(CareRecipient.care_group_id == group_id)
    recipient_res = await session.execute(recipient_stmt)
    recipients = recipient_res.scalars().all()
    for rec in recipients:
        prot_stmt = select(MedicationProtocol).where(MedicationProtocol.care_recipient_id == rec.id)
        prot_res = await session.execute(prot_stmt)
        protocols = prot_res.scalars().all()
        for prot in protocols:
            log_stmt = select(MedicationLog).where(MedicationLog.protocol_id == prot.id)
            log_res = await session.execute(log_stmt)
            logs = log_res.scalars().all()
            for log in logs:
                await session.delete(log)
            await session.delete(prot)
        await session.delete(rec)
        
    # 2. Tasks
    task_stmt = select(Task).where(Task.care_group_id == group_id)
    task_res = await session.execute(task_stmt)
    tasks = task_res.scalars().all()
    for t in tasks:
        await session.delete(t)
        
    # 3. Members
    mem_stmt = select(CareGroupMember).where(CareGroupMember.care_group_id == group_id)
    mem_res = await session.execute(mem_stmt)
    members = mem_res.scalars().all()
    for m in members:
        await session.delete(m)
        
    # 4. Group
    await session.delete(group)
    await session.commit()
