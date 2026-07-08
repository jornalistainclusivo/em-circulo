from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid

from app.database import get_session
from app.models import Task, TaskStatus, CareGroupMember, utc_now, User, UserRole, Notification, NotificationType
from app.schemas import TaskClaimRequest, TaskClaimResponse, TaskResponse, TaskUpdate
from app.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])

@router.patch("/{task_id}/claim", response_model=TaskClaimResponse)
async def claim_task(task_id: uuid.UUID, request: TaskClaimRequest, session: AsyncSession = Depends(get_session)):
    task = await session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status != TaskStatus.PENDING:
        raise HTTPException(status_code=400, detail="Task is not available for claiming")
        
    member = await session.get(CareGroupMember, request.assignee_id)
    if not member or member.care_group_id != task.care_group_id:
         raise HTTPException(status_code=400, detail="Invalid assignee for this task")
         
    task.assignee_id = request.assignee_id
    task.status = TaskStatus.CLAIMED
    session.add(task)
    await session.commit()
    await session.refresh(task)
    
    return task

@router.patch("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    task = await session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status not in [TaskStatus.CLAIMED, TaskStatus.IN_PROGRESS]:
        raise HTTPException(status_code=400, detail="Task cannot be completed from its current state")
        
    task.status = TaskStatus.COMPLETED
    task.updated_at = utc_now()
    session.add(task)
    await session.commit()
    await session.refresh(task)

    # Inline notification — replace stub logging with real DB record
    notification = Notification(
        care_group_id=task.care_group_id,
        title="Tarefa concluída",
        message=f"{current_user.full_name} concluiu a tarefa: {task.title}",
        type=NotificationType.TASK_COMPLETED,
    )
    session.add(notification)
    await session.commit()
    
    return task

@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    task = await session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Verify membership in care group
    member_stmt = select(CareGroupMember).where(
        CareGroupMember.care_group_id == task.care_group_id,
        CareGroupMember.user_id == current_user.id
    )
    member_result = await session.execute(member_stmt)
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of the CareGroup for this task")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    task.updated_at = utc_now()
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    role_check: CareGroupMember = Depends(require_role([UserRole.ADMIN])),
):
    task = await session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await session.delete(task)
    await session.commit()
