from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.database import get_session
from app.models import User
from app.schemas import UserUpdate, UserResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

@router.patch("/me", response_model=UserResponse)
async def update_profile(
    payload: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Permite que o usuário autenticado atualize seus próprios dados cadastrais.
    """
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
        
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user
