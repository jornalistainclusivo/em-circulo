/**
 * Domain Types — Source of Truth: specs/Tech_Spec_Orquestracao_v0.1.md
 *
 * These interfaces mirror the PostgreSQL relational schema.
 * All datetime fields use ISO 8601 strings with timezone
 * to guarantee compatibility with TIMESTAMPTZ and asyncpg.
 */

// ── ENUMs (mirrored from PostgreSQL) ──────────────────────────────

export type UserRole = "ADMIN" | "CAREGIVER";

export type TaskStatus =
  | "PENDING"
  | "CLAIMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

// ── Branded Type: ISO 8601 datetime ───────────────────────────────

/**
 * ISO 8601 datetime string with timezone offset.
 * Format: "YYYY-MM-DDTHH:mm:ssZ" or "YYYY-MM-DDTHH:mm:ss±HH:MM"
 *
 * This branded type enforces compile-time awareness that the string
 * carries timezone information, matching the TIMESTAMPTZ column type
 * in PostgreSQL and the asyncpg serialization format.
 */
export type ISODateString = string & { readonly __brand: "ISODateString" };

/** Helper to create an ISODateString from a Date object. */
export function toISODateString(date: Date): ISODateString {
  return date.toISOString() as ISODateString;
}

/** Helper to parse an ISODateString back to a Date. */
export function fromISODateString(iso: ISODateString): Date {
  return new Date(iso);
}

// ── Core Entities (Coordination) ──────────────────────────────────

/** CareGroup — Círculo de Cuidado (care_groups table) */
export interface CareGroup {
  readonly id: string;
  name: string;
  readonly created_at: ISODateString;
  readonly updated_at: ISODateString;
}

/** CareGroupMember — Membership + RBAC (care_group_members table) */
export interface CareGroupMember {
  readonly id: string;
  care_group_id: string;
  user_id: string;
  role: UserRole;
  readonly joined_at: ISODateString;
}

/** CareRecipient — Pessoa Cuidada (care_recipients table) */
export interface CareRecipient {
  readonly id: string;
  care_group_id: string;
  name: string;
  blood_type?: string | null;
  allergies: string[];
  emergency_contacts: Record<string, unknown>[];
  readonly created_at: ISODateString;
  readonly updated_at: ISODateString;
}

/** Task — Tarefa de Cuidado (tasks table) */
export interface Task {
  readonly id: string;
  care_group_id: string;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  due_date: ISODateString;
  status: TaskStatus;
  recurrence_rule?: string | null;
  readonly created_at: ISODateString;
  readonly updated_at: ISODateString;
}

// ── Error Prevention Entities (Pharmacy) ──────────────────────────

/** MedicationProtocol — Protocolo Medicamentoso (medication_protocols table) */
export interface MedicationProtocol {
  readonly id: string;
  care_recipient_id: string;
  medication_name: string;
  dosage: string;
  frequency_interval_hours: number;
  stock_count: number;
  safety_threshold: number;
  readonly created_at: ISODateString;
  readonly updated_at: ISODateString;
}

/** MedicationLog — Registro Imutável de Administração (medication_logs table) */
export interface MedicationLog {
  readonly id: string;
  protocol_id: string;
  administered_by: string;
  administered_at: ISODateString;
  notes?: string | null;
  readonly created_at: ISODateString;
}
