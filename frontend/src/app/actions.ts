"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { MedicationLogTimeline } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://127.0.0.1:8000";

/**
 * Assumir tarefa: Chama PATCH /tasks/{taskId}/claim no FastAPI
 */
export async function claimTaskAction(taskId: string, assigneeId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${taskId}/claim`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assignee_id: assigneeId }),
    });

    if (!res.ok) {
      throw new Error("Failed to claim task");
    }
  } catch (error) {
    console.error("claimTaskAction error:", error);
    throw error;
  }

  revalidatePath("/");
}

/**
 * Concluir tarefa: Chama PATCH /tasks/{taskId}/complete no FastAPI
 */
export async function completeTaskAction(taskId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${taskId}/complete`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to complete task");
    }
  } catch (error) {
    console.error("completeTaskAction error:", error);
    throw error;
  }

  revalidatePath("/");
}

/**
 * Server Action: Log Medication Dose
 */
export async function logMedicationAction(protocolId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cc_access_token")?.value;

    if (!token) {
      return { success: false, error: "Sessão expirada. Faça login novamente." };
    }

    // Retrieve the real user profile to log the correct administrator ID
    let userId = "d4e5f6a7-b8c9-0123-defa-234567890123";
    try {
      const meRes = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: "no-store",
      });
      if (meRes.ok) {
        const user = await meRes.json();
        userId = user.id;
      }
    } catch (e) {
      console.error("Erro ao obter perfil para registrar dose:", e);
    }

    const payload = {
      administered_by: userId,
      administered_at: new Date().toISOString(),
      notes: "Administrado via Painel Web",
    };

    const res = await fetch(`${API_BASE_URL}/api/v1/protocols/${protocolId}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn("FastAPI indisponível ou erro na requisição.");
      return { success: false, error: "Failed to log medication" };
    }

    const data = await res.json();

    // Revalidate the medications page and dashboard to show updated stock count and potential new tasks
    revalidatePath("/medicamentos");
    revalidatePath("/");

    return {
      success: true,
      stock_alert: data.stock_alert,
      remaining_balance: data.remaining_balance,
    };
  } catch (error) {
    console.error(`Erro ao registrar dose para protocolo ${protocolId}:`, error);
    return { success: false, error: "Network error" };
  }
}

export interface FormState {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Server Action: Criar Tarefa
 */
export async function createTaskAction(
  groupId: string,
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDateStr = formData.get("due_date") as string;

  if (!title || !dueDateStr) {
    return { success: false, error: "Título e data de vencimento são obrigatórios." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/care-groups/${groupId}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description: description || null,
        due_date: new Date(dueDateStr).toISOString(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || "Falha ao criar tarefa." };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("createTaskAction error:", error);
    return { success: false, error: "Erro de conexão com o servidor." };
  }
}

/**
 * Server Action: Criar Protocolo de Medicamento
 */
export async function createProtocolAction(
  recipientId: string,
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const medicationName = formData.get("medication_name") as string;
  const dosage = formData.get("dosage") as string;
  const frequencyRaw = formData.get("frequency_interval_hours") as string;
  const stockRaw = formData.get("stock_count") as string;
  const safetyRaw = formData.get("safety_threshold") as string;

  if (!medicationName || !dosage || !frequencyRaw || !stockRaw || !safetyRaw) {
    return { success: false, error: "Todos os campos são obrigatórios." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/care-recipients/${recipientId}/protocols`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        medication_name: medicationName,
        dosage,
        frequency_interval_hours: parseInt(frequencyRaw, 10),
        stock_count: parseInt(stockRaw, 10),
        safety_threshold: parseInt(safetyRaw, 10),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || "Falha ao cadastrar medicamento." };
    }

    revalidatePath("/medicamentos");
    return { success: true };
  } catch (error) {
    console.error("createProtocolAction error:", error);
    return { success: false, error: "Erro de conexão com o servidor." };
  }
}

/**
 * Server Action: Editar Tarefa
 */
export async function updateTaskAction(
  taskId: string,
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDateStr = formData.get("due_date") as string;
  const status = formData.get("status") as string;

  if (!title || !dueDateStr) {
    return { success: false, error: "Título e data de vencimento são obrigatórios." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) return { success: false, error: "Sessão expirada." };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description: description || null,
        due_date: new Date(dueDateStr).toISOString(),
        status: status || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.detail || "Falha ao editar tarefa." };

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateTaskAction error:", error);
    return { success: false, error: "Erro de conexão." };
  }
}

/**
 * Server Action: Excluir Tarefa
 */
export async function deleteTaskAction(taskId: string): Promise<FormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) return { success: false, error: "Sessão expirada." };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.detail || "Falha ao excluir tarefa." };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteTaskAction error:", error);
    return { success: false, error: "Erro de conexão." };
  }
}

/**
 * Server Action: Editar Medicamento (Protocolo)
 */
export async function updateProtocolAction(
  protocolId: string,
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const medicationName = formData.get("medication_name") as string;
  const dosage = formData.get("dosage") as string;
  const frequencyRaw = formData.get("frequency_interval_hours") as string;
  const stockRaw = formData.get("stock_count") as string;
  const safetyRaw = formData.get("safety_threshold") as string;

  if (!medicationName || !dosage || !frequencyRaw || !stockRaw || !safetyRaw) {
    return { success: false, error: "Todos os campos são obrigatórios." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) return { success: false, error: "Sessão expirada." };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/protocols/${protocolId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        medication_name: medicationName,
        dosage,
        frequency_interval_hours: parseInt(frequencyRaw, 10),
        stock_count: parseInt(stockRaw, 10),
        safety_threshold: parseInt(safetyRaw, 10),
      }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.detail || "Falha ao editar medicamento." };

    revalidatePath("/medicamentos");
    return { success: true };
  } catch (error) {
    console.error("updateProtocolAction error:", error);
    return { success: false, error: "Erro de conexão." };
  }
}

/**
 * Server Action: Excluir Medicamento (Protocolo)
 */
export async function deleteProtocolAction(protocolId: string): Promise<FormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) return { success: false, error: "Sessão expirada." };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/protocols/${protocolId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.detail || "Falha ao excluir medicamento." };
    }

    revalidatePath("/medicamentos");
    return { success: true };
  } catch (error) {
    console.error("deleteProtocolAction error:", error);
    return { success: false, error: "Erro de conexão." };
  }
}

/**
 * Server Action: Editar Grupo de Cuidado
 */
export async function updateCareGroupAction(
  groupId: string,
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const name = formData.get("name") as string;
  if (!name) return { success: false, error: "Nome do grupo é obrigatório." };

  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) return { success: false, error: "Sessão expirada." };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/care-groups/${groupId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.detail || "Falha ao editar grupo." };

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateCareGroupAction error:", error);
    return { success: false, error: "Erro de conexão." };
  }
}

/**
 * Server Action: Editar Receptor (Paciente)
 */
export async function updateCareRecipientAction(
  recipientId: string,
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const name = formData.get("name") as string;
  const bloodType = formData.get("blood_type") as string;
  const allergiesRaw = formData.get("allergies") as string;

  if (!name) return { success: false, error: "Nome do paciente é obrigatório." };

  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) return { success: false, error: "Sessão expirada." };

  const allergies = allergiesRaw ? allergiesRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/care-recipients/${recipientId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        blood_type: bloodType || null,
        allergies,
      }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.detail || "Falha ao editar paciente." };

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateCareRecipientAction error:", error);
    return { success: false, error: "Erro de conexão." };
  }
}

/**
 * Server Action: Excluir Grupo de Cuidado
 */
export async function deleteCareGroupAction(groupId: string): Promise<FormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) return { success: false, error: "Sessão expirada." };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/care-groups/${groupId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.detail || "Falha ao excluir grupo." };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteCareGroupAction error:", error);
    return { success: false, error: "Erro de conexão." };
  }
}

/**
 * Server Action: Excluir Paciente
 */
export async function deleteCareRecipientAction(recipientId: string): Promise<FormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) return { success: false, error: "Sessão expirada." };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/care-recipients/${recipientId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.detail || "Falha ao excluir paciente." };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteCareRecipientAction error:", error);
    return { success: false, error: "Erro de conexão." };
  }
}


/**
 * Server Action: Criar Convite para Grupo de Cuidado
 */
export async function createInviteAction(
  groupId: string
): Promise<{ success: boolean; inviteLink?: string; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) return { success: false, error: "Sessão expirada." };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/invites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ care_group_id: groupId }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || "Falha ao criar convite." };
    }

    return { success: true, inviteLink: data.invite_link };
  } catch (error) {
    console.error("createInviteAction error:", error);
    return { success: false, error: "Erro de conexão." };
  }
}


/**
 * Server Action: Aceitar Convite do Grupo de Cuidado
 */
export async function acceptInviteAction(
  inviteToken: string
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) return { success: false, error: "Sessão expirada. Faça login para aceitar o convite." };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/invites/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ token: inviteToken }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || "Falha ao aceitar convite." };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("acceptInviteAction error:", error);
    return { success: false, error: "Erro de conexão." };
  }
}

/**
 * Server Action: Buscar Histórico de Doses (Logs) do Paciente
 */
export async function getMedicationLogsAction(
  recipientId: string
): Promise<{ success: boolean; logs?: MedicationLogTimeline[]; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) return { success: false, error: "Sessão expirada. Faça login novamente." };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/care-recipients/${recipientId}/medication-logs`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store"
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || "Falha ao carregar logs." };
    }

    return { success: true, logs: data as MedicationLogTimeline[] };
  } catch (error) {
    console.error("getMedicationLogsAction error:", error);
    return { success: false, error: "Erro de conexão." };
  }
}
