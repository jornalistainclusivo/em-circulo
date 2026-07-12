/**
 * API Contract Types — Source of Truth: specs/Tech_Spec_Orquestracao_v0.1.md §3
 *
 * Request/Response DTOs that mirror the FastAPI async route contracts.
 * All date fields serialize as ISO 8601 with timezone (ISODateString).
 */

import type { ISODateString, TaskStatus } from "./domain";

// ── Task Flow (§3.1) ─────────────────────────────────────────────

/** POST /api/v1/care-groups/{group_id}/tasks — Request Body */
export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  due_date: ISODateString;
  recurrence_rule?: string | null;
}

/** POST /api/v1/care-groups/{group_id}/tasks — Response 201 */
export interface CreateTaskResponse {
  readonly id: string;
  status: TaskStatus;
  due_date: ISODateString;
}

/** PATCH /api/v1/tasks/{task_id}/claim — Request Body */
export interface ClaimTaskRequest {
  assignee_member_id: string;
}

/** PATCH /api/v1/tasks/{task_id}/claim — Response 200 */
export interface ClaimTaskResponse {
  readonly id: string;
  status: "CLAIMED";
  assignee_id: string;
}

/** PATCH /api/v1/tasks/{task_id}/complete — Response 200 */
export interface CompleteTaskResponse {
  readonly id: string;
  status: "COMPLETED";
}

// ── Medication Flow (§3.2) ────────────────────────────────────────

/** POST /api/v1/care-recipients/{recipient_id}/protocols — Request Body */
export interface CreateProtocolRequest {
  medication_name: string;
  dosage: string;
  frequency_interval_hours: number;
  stock_count: number;
  safety_threshold: number;
}

/** POST /api/v1/care-recipients/{recipient_id}/protocols — Response 201 */
export interface CreateProtocolResponse {
  readonly id: string;
}

/** POST /api/v1/protocols/{protocol_id}/logs — Request Body */
export interface CreateMedicationLogRequest {
  administered_by: string;
  administered_at: ISODateString;
  notes?: string | null;
}

/** POST /api/v1/protocols/{protocol_id}/logs — Response 201 */
export interface CreateMedicationLogResponse {
  readonly id: string;
}

// ── CareGroup Management ──────────────────────────────────────────

/** POST /api/v1/care-groups — Request Body */
export interface CreateCareGroupRequest {
  name: string;
}

/** POST /api/v1/care-groups — Response 201 */
export interface CreateCareGroupResponse {
  readonly id: string;
  name: string;
  readonly created_at: ISODateString;
  readonly updated_at: ISODateString;
}

// ── Generic Error Response ────────────────────────────────────────

/** Standard error envelope returned by the API on 4xx/5xx */
export interface ApiErrorResponse {
  detail: string;
}

// ── Appointments Flow (v2.0) ──────────────────────────────────────────

export interface AppointmentCreate {
  title: string;
  scheduled_at: string; // ISODateString
  provider_name?: string;
  location?: string;
}

export interface AppointmentResponse {
  id: string;
  care_recipient_id: string;
  title: string;
  scheduled_at: string;
  provider_name: string | null;
  location: string | null;
  created_at: string;
}

// ── Documents Flow (v2.1) ──────────────────────────────────────────

export interface DocumentCreate {
  title: string;
  document_type: "RECEITA" | "LAUDO" | "EXAME" | "OUTROS";
}

export interface DocumentResponse {
  id: string;
  care_recipient_id: string;
  title: string;
  document_type: "RECEITA" | "LAUDO" | "EXAME" | "OUTROS";
  uploaded_at: string;
  uploaded_by_id: string;
}

export interface PresignedUrlResponse {
  url: string;
  expires_in: number;
}

