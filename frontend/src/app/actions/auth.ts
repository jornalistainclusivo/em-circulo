"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://127.0.0.1:8000";

export interface FormState {
  success?: boolean;
  error?: string;
  message?: string;
}

/**
 * Server Action: Login
 */
export async function loginAction(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "E-mail e senha são obrigatórios." };
  }

  try {
    const params = new URLSearchParams();
    params.append("username", email); // OAuth2 expects username
    params.append("password", password);

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Credenciais inválidas. Verifique seus dados.",
      };
    }

    const { access_token } = data;
    if (!access_token) {
      return { success: false, error: "Token de acesso não fornecido." };
    }

    // Set HttpOnly cookie using next/headers API
    const cookieStore = await cookies();
    cookieStore.set("cc_access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

  } catch (error) {
    console.error("Login action error:", error);
    return {
      success: false,
      error: "Erro de conexão com o servidor. Tente novamente mais tarde.",
    };
  }

  // Redirect after cookie is set (redirect must be called outside try/catch or rethrown)
  redirect("/");
}

/**
 * Server Action: Register
 */
export async function registerAction(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!fullName || !email || !password) {
    return { success: false, error: "Todos os campos são obrigatórios." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "As senhas não coincidem." };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || "Falha ao registrar conta. E-mail já cadastrado?",
      };
    }

    // Auto-login after successful registration
    const loginParams = new URLSearchParams();
    loginParams.append("username", email);
    loginParams.append("password", password);

    const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: loginParams.toString(),
      cache: "no-store",
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const { access_token } = loginData;

      if (access_token) {
        const cookieStore = await cookies();
        cookieStore.set("cc_access_token", access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });
      }
    } else {
      // If login fails for some reason, redirect to login page with a success message
      return {
        success: true,
        message: "Conta criada com sucesso! Por favor, faça login.",
      };
    }

  } catch (error) {
    console.error("Register action error:", error);
    return {
      success: false,
      error: "Erro de conexão com o servidor. Tente novamente mais tarde.",
    };
  }

  redirect("/");
}

/**
 * Server Action: Logout
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("cc_access_token");
  redirect("/login");
}

/**
 * Server Action: Create Care Group (Onboarding Step 1)
 */
export async function createCareGroupAction(
  prevState: (FormState & { group_id?: string }) | null,
  formData: FormData
): Promise<FormState & { group_id?: string }> {
  const name = formData.get("name") as string;
  if (!name) {
    return { success: false, error: "Nome do Círculo de Cuidado é obrigatório." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/care-groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || "Falha ao criar círculo de cuidado." };
    }

    return { success: true, group_id: data.id };
  } catch (error) {
    console.error("createCareGroupAction error:", error);
    return { success: false, error: "Erro de conexão com o servidor." };
  }
}

/**
 * Server Action: Create Care Recipient (Onboarding Step 2)
 */
export async function createCareRecipientAction(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const careGroupId = formData.get("care_group_id") as string;
  const name = formData.get("name") as string;
  const bloodType = formData.get("blood_type") as string;
  const allergiesRaw = formData.get("allergies") as string;
  const contactName = formData.get("contact_name") as string;
  const contactPhone = formData.get("contact_phone") as string;

  if (!careGroupId || !name) {
    return { success: false, error: "Dados inválidos ou incompletos." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const allergies = allergiesRaw
    ? allergiesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const emergencyContacts = contactName && contactPhone
    ? [{ name: contactName, phone: contactPhone }]
    : [];

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/care-recipients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        care_group_id: careGroupId,
        name,
        blood_type: bloodType || null,
        allergies,
        emergency_contacts: emergencyContacts
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || "Falha ao cadastrar paciente." };
    }

  } catch (error) {
    console.error("createCareRecipientAction error:", error);
    return { success: false, error: "Erro de conexão com o servidor." };
  }

  redirect("/");
}
