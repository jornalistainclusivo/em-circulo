"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

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
