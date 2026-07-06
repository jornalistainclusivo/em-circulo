import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MedicationPanel } from "@/components/MedicationPanel";
import type { MedicationProtocol, CareGroup, CareRecipient } from "@/types";
import styles from "./page.module.css";
import { logMedicationAction } from "../actions";

async function fetchProtocols(recipientId: string, token: string): Promise<MedicationProtocol[]> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${API_BASE_URL}/api/v1/care-recipients/${recipientId}/protocols`, {
      cache: "no-store",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (res.ok) {
      return (await res.json()) as MedicationProtocol[];
    }
    console.error("Erro na resposta do FastAPI ao buscar protocolos:", res.status);
  } catch (error) {
    console.error("FastAPI indisponível. Erro ao buscar protocolos reais:", error);
  }
  return [];
}

export default async function MedicamentosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://127.0.0.1:8000";

  // 1. Fetch care groups of the authenticated user
  let groups: CareGroup[] = [];
  try {
    const groupsRes = await fetch(`${API_BASE_URL}/api/v1/care-groups`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });
    if (groupsRes.ok) {
      groups = await groupsRes.json();
    }
  } catch (error) {
    console.error("Erro ao carregar círculos de cuidado:", error);
  }

  // Redirect to Step 1 if user has no care groups
  if (groups.length === 0) {
    redirect("/onboarding");
  }

  const activeGroup = groups[0];

  // 2. Fetch recipients of the active group
  let recipients: CareRecipient[] = [];
  try {
    const recipientsRes = await fetch(`${API_BASE_URL}/api/v1/care-groups/${activeGroup.id}/recipients`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });
    if (recipientsRes.ok) {
      recipients = await recipientsRes.json();
    }
  } catch (error) {
    console.error("Erro ao carregar pacientes:", error);
  }

  // Redirect to Step 2 if group exists but no patient is registered
  if (recipients.length === 0) {
    redirect(`/onboarding?step=2&care_group_id=${activeGroup.id}`);
  }

  const activeRecipient = recipients[0];
  const protocols = await fetchProtocols(activeRecipient.id, token);

  return (
    <article className={styles.container}>
      <header className={styles.pageHeader}>
        <h1>Farmácia</h1>
        <p>
          Controle os medicamentos, registre doses administradas e monitore o estoque da sua família.
        </p>
      </header>
      
      {protocols.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">💊</div>
          <h2 className={styles.emptyTitle}>Farmácia Vazia</h2>
          <p className={styles.emptyText}>
            Não há nenhum medicamento cadastrado para o paciente <strong>{activeRecipient.name}</strong>.
          </p>
        </div>
      ) : (
        <MedicationPanel protocols={protocols} onLogMedication={logMedicationAction} />
      )}
    </article>
  );
}
