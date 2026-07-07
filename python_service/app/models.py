import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from sqlalchemy import DateTime


# Helper for UTC datetime (naive para evitar conflitos com asyncpg em TIMESTAMP WITHOUT TIME ZONE)
def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ---------------------------------------------------------------------------
# User — entidade de identidade (PRD v0.3)
# ---------------------------------------------------------------------------

class User(SQLModel, table=True):
    """Registered user identity. Passwords are stored as bcrypt hashes only."""

    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(max_length=255, unique=True, sa_column_kwargs={"index": True})
    hashed_password: str = Field(max_length=255)
    full_name: str = Field(max_length=255)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))
    updated_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    CAREGIVER = "CAREGIVER"

class TaskStatus(str, Enum):
    PENDING = "PENDING"
    CLAIMED = "CLAIMED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# ---------------------------------------------------------------------------
# Domain models (v0.1 / v0.2)
# ---------------------------------------------------------------------------

class CareGroup(SQLModel, table=True):
    __tablename__ = "care_groups"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255)
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))
    updated_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))

    members: List["CareGroupMember"] = Relationship(back_populates="care_group")
    recipients: List["CareRecipient"] = Relationship(back_populates="care_group")
    tasks: List["Task"] = Relationship(back_populates="care_group")

class CareGroupMember(SQLModel, table=True):
    __tablename__ = "care_group_members"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    care_group_id: uuid.UUID = Field(foreign_key="care_groups.id")
    user_id: uuid.UUID = Field(index=True)
    role: UserRole = Field(default=UserRole.CAREGIVER)
    joined_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))

    care_group: CareGroup = Relationship(back_populates="members")
    assigned_tasks: List["Task"] = Relationship(back_populates="assignee")

class CareRecipient(SQLModel, table=True):
    __tablename__ = "care_recipients"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    care_group_id: uuid.UUID = Field(foreign_key="care_groups.id", unique=True)
    name: str = Field(max_length=255)
    blood_type: Optional[str] = Field(default=None, max_length=10)
    allergies: List[str] = Field(default=[], sa_column=Column(JSON))
    emergency_contacts: List[dict[str, Any]] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))
    updated_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))

    care_group: CareGroup = Relationship(back_populates="recipients")
    protocols: List["MedicationProtocol"] = Relationship(back_populates="care_recipient")

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    care_group_id: uuid.UUID = Field(foreign_key="care_groups.id")
    title: str = Field(max_length=255)
    description: Optional[str] = None
    assignee_id: Optional[uuid.UUID] = Field(default=None, foreign_key="care_group_members.id")
    due_date: datetime = Field(sa_column=Column(DateTime(timezone=True), index=True))
    status: TaskStatus = Field(default=TaskStatus.PENDING)
    recurrence_rule: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))
    updated_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))

    care_group: CareGroup = Relationship(back_populates="tasks")
    assignee: Optional[CareGroupMember] = Relationship(back_populates="assigned_tasks")

class MedicationProtocol(SQLModel, table=True):
    __tablename__ = "medication_protocols"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    care_recipient_id: uuid.UUID = Field(foreign_key="care_recipients.id")
    medication_name: str = Field(max_length=255)
    dosage: str = Field(max_length=100)
    frequency_interval_hours: int = Field(default=12)
    stock_count: int = Field(default=0)
    safety_threshold: int = Field(default=0)
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))
    updated_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))

    care_recipient: CareRecipient = Relationship(back_populates="protocols")
    logs: List["MedicationLog"] = Relationship(back_populates="protocol")

class MedicationLog(SQLModel, table=True):
    __tablename__ = "medication_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    protocol_id: uuid.UUID = Field(foreign_key="medication_protocols.id")
    administered_by: uuid.UUID = Field(foreign_key="care_group_members.id")
    administered_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))
    notes: Optional[str] = None
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=utc_now))

    protocol: MedicationProtocol = Relationship(back_populates="logs")
