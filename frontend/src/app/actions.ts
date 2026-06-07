"use server";

import { revalidatePath } from "next/cache";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

/**
 * Assumir tarefa: Chama PATCH /tasks/{taskId}/claim no FastAPI
 */
export async function claimTaskAction(taskId: string, assigneeId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/claim`, {
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
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
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
