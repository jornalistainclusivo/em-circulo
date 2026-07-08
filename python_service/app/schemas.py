import uuid
from datetime import datetime
from typing import Optional, Any, List
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import TaskStatus, NotificationType


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
    whatsapp: Optional[str] = None
    profession: Optional[str] = None
    created_at: datetime


class Token(BaseModel):
    """JWT token response from POST /api/v1/auth/login."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Decoded claims extracted from a JWT payload."""
    user_id: Optional[str] = None


class UserUpdate(BaseModel):
    """Payload for PATCH /api/v1/users/me."""
    full_name: Optional[str] = None
    whatsapp: Optional[str] = None
    profession: Optional[str] = None


# ---------------------------------------------------------------------------
# Onboarding Schemas — PRD v0.4
# ---------------------------------------------------------------------------

class CareGroupCreate(BaseModel):
    name: str

class CareGroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    created_at: datetime
    updated_at: datetime

class CareRecipientCreate(BaseModel):
    care_group_id: uuid.UUID
    name: str
    blood_type: Optional[str] = None
    allergies: List[str] = []
    emergency_contacts: List[dict[str, Any]] = []
    medical_conditions: Optional[str] = None
    observations: Optional[str] = None

class CareRecipientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    care_group_id: uuid.UUID
    name: str
    blood_type: Optional[str]
    allergies: List[str]
    emergency_contacts: List[dict[str, Any]]
    medical_conditions: Optional[str] = None
    observations: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    recurrence_rule: Optional[str] = None

class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    care_group_id: uuid.UUID
    title: str
    description: Optional[str] = None
    assignee_id: Optional[uuid.UUID] = None
    due_date: datetime
    status: TaskStatus
    recurrence_rule: Optional[str] = None
    created_at: datetime
    updated_at: datetime

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
    next_due_at: Optional[datetime] = None
    last_delay_alert_sent_at: Optional[datetime] = None
    assignee_id: Optional[uuid.UUID] = None

class MedicationProtocolResponse(BaseModel):
    id: uuid.UUID
    care_recipient_id: uuid.UUID
    medication_name: str
    dosage: str
    frequency_interval_hours: int
    stock_count: int
    safety_threshold: int
    next_due_at: Optional[datetime]
    last_delay_alert_sent_at: Optional[datetime]
    assignee_id: Optional[uuid.UUID]
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

class MedicationLogTimelineResponse(BaseModel):
    id: uuid.UUID
    protocol_id: uuid.UUID
    medication_name: str
    dosage: str
    administered_by: str  # Nome do cuidador (User.full_name)
    administered_at: datetime
    notes: Optional[str] = None

# ---------------------------------------------------------------------------
# Update Schemas — Phase 5 (Full CRUD)
# ---------------------------------------------------------------------------

class CareGroupUpdate(BaseModel):
    name: Optional[str] = None

class CareRecipientUpdate(BaseModel):
    name: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[List[str]] = None
    emergency_contacts: Optional[List[dict[str, Any]]] = None
    medical_conditions: Optional[str] = None
    observations: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[TaskStatus] = None
    recurrence_rule: Optional[str] = None

class ProtocolUpdate(BaseModel):
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency_interval_hours: Optional[int] = None
    stock_count: Optional[int] = None
    safety_threshold: Optional[int] = None
    next_due_at: Optional[datetime] = None
    last_delay_alert_sent_at: Optional[datetime] = None
    assignee_id: Optional[uuid.UUID] = None


# ---------------------------------------------------------------------------
# Invite Schemas — Phase 6 (Collaboration & RBAC)
# ---------------------------------------------------------------------------

class InviteCreate(BaseModel):
    care_group_id: uuid.UUID


class InviteResponse(BaseModel):
    token: str
    invite_link: str


class InviteAccept(BaseModel):
    token: str


class CareGroupMemberResponse(BaseModel):
    id: uuid.UUID
    care_group_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    full_name: str
    email: str


# ---------------------------------------------------------------------------
# Notification Schemas — Fase 10.1 (Real-time group awareness)
# ---------------------------------------------------------------------------

class NotificationResponse(BaseModel):
    """Read-only representation of a group notification."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    care_group_id: uuid.UUID
    title: str
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime
