"use server";

import { cookies } from "next/headers";
import type { AppointmentCreate, AppointmentResponse } from "@/types/api";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface FormState {
  success?: boolean;
  error?: string;
  message?: string;
}

/**
 * Server Action: Listar Consultas
 */
export async function getAppointments(groupId: string): Promise<AppointmentResponse[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    throw new Error("Não autorizado");
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/care-groups/${groupId}/appointments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao buscar consultas");
  }

  return response.json();
}

/**
 * Server Action: Criar Consulta
 */
export async function createAppointmentAction(
  groupId: string,
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const title = formData.get("title") as string;
  const scheduled_at = formData.get("scheduled_at") as string;
  const provider_name = formData.get("provider_name") as string;
  const location = formData.get("location") as string;

  if (!title || !scheduled_at) {
    return { success: false, error: "Título e data/hora são obrigatórios." };
  }

  const payload: AppointmentCreate = {
    title,
    scheduled_at: new Date(scheduled_at).toISOString(),
    provider_name: provider_name || undefined,
    location: location || undefined,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/care-groups/${groupId}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Não foi possível agendar a consulta.",
      };
    }

    return { success: true, message: "Consulta agendada com sucesso!" };
  } catch (err) {
    console.error("Erro ao criar consulta:", err);
    return { success: false, error: "Erro de comunicação com o servidor." };
  }
}
