import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import TaskStatus


# ---------------------------------------------------------------------------
# Auth Schemas — PRD v0.3
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    """Payload for POST /api/v1/auth/register."""
    email: EmailStr
    password: str
    full_name: str


class UserResponse(BaseModel):
    """Safe user representation — hashed_password is never included."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    """JWT token response from POST /api/v1/auth/login."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Decoded claims extracted from a JWT payload."""
    user_id: Optional[str] = None




class CareGroupCreate(BaseModel):
    name: str
    recipient_name: str

class CareGroupResponse(BaseModel):
    id: uuid.UUID
    name: str

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    recurrence_rule: Optional[str] = None

class TaskResponse(BaseModel):
    id: uuid.UUID
    status: TaskStatus
    due_date: datetime

class TaskClaimRequest(BaseModel):
    assignee_id: uuid.UUID

class TaskClaimResponse(BaseModel):
    id: uuid.UUID
    status: TaskStatus
    assignee_id: uuid.UUID

class ProtocolCreate(BaseModel):
    medication_name: str
    dosage: str
    frequency_interval_hours: int
    stock_count: int
    safety_threshold: int

class MedicationProtocolResponse(BaseModel):
    id: uuid.UUID
    care_recipient_id: uuid.UUID
    medication_name: str
    dosage: str
    frequency_interval_hours: int
    stock_count: int
    safety_threshold: int
    created_at: datetime
    updated_at: datetime

class MedicationLogCreate(BaseModel):
    administered_by: uuid.UUID
    administered_at: datetime
    notes: Optional[str] = None

class MedicationLogResponse(BaseModel):
    id: uuid.UUID
    protocol_id: uuid.UUID
    administered_by: uuid.UUID
    administered_at: datetime
    notes: Optional[str] = None
    stock_alert: bool = False
    remaining_balance: int
