from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid

from app.database import get_session
from app.models import Task, TaskStatus, CareGroupMember, utc_now
from app.schemas import TaskClaimRequest, TaskClaimResponse, TaskResponse

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

async def notify_group_task_completed(task_id: uuid.UUID):
    import logging
    logging.info(f"Notification Triggered: Task {task_id} foi concluída pelo membro responsável.")

@router.patch("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(task_id: uuid.UUID, background_tasks: BackgroundTasks, session: AsyncSession = Depends(get_session)):
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
    
    # Injeta side effect de notificação no Background
    background_tasks.add_task(notify_group_task_completed, task.id)
    
    return task
