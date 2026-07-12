"use server";

import { cookies } from "next/headers";
import type { DocumentResponse, PresignedUrlResponse } from "@/types/api";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface FormState {
  success?: boolean;
  error?: string;
  message?: string;
}

export async function getDocuments(groupId: string): Promise<DocumentResponse[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) throw new Error("Não autorizado");

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/v1/care-groups/${groupId}/documents`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Erro ao buscar documentos");
    }

    return await response.json();
  } catch (err: any) {
    console.error("Erro em getDocuments:", err);
    throw new Error("Falha de comunicação com o servidor. O backend pode estar offline.");
  }
}

export async function getPresignedUrl(groupId: string, documentId: string): Promise<PresignedUrlResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) throw new Error("Não autorizado");

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/v1/care-groups/${groupId}/documents/${documentId}/download`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Erro ao gerar link de download");
    }

    return await response.json();
  } catch (err: any) {
    console.error("Erro em getPresignedUrl:", err);
    throw new Error("Falha de comunicação com o servidor. O backend pode estar offline.");
  }
}

export async function uploadDocumentAction(
  groupId: string,
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/v1/care-groups/${groupId}/documents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // FormData is passed directly; Next.js fetch polyfill handles multipart/form-data boundary
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Não foi possível enviar o documento.",
      };
    }

    return { success: true, message: "Documento enviado com sucesso!" };
  } catch (err) {
    console.error("Erro ao enviar documento:", err);
    return { success: false, error: "Falha de comunicação com o servidor. O backend pode estar offline." };
  }
}
