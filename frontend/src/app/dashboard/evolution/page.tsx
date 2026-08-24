import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import EvolutionLogForm from "@/components/evolution-log/EvolutionLogForm";
import EvolutionLogFeed from "@/components/evolution-log/EvolutionLogFeed";
import type { CareGroup, CareRecipient } from "@/types";
import styles from "./evolution.module.css";

interface UserProfile {
  id: string;
}

export default async function EvolutionPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://127.0.0.1:8000";

  // 1. Fetch current user
  let currentUser: UserProfile | null = null;
  try {
    const meRes = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });
    if (meRes.ok) {
      currentUser = await meRes.json();
    } else {
      redirect("/login");
    }
  } catch (error) {
    redirect("/login");
  }

  if (!currentUser) {
    redirect("/login");
  }

  // 2. Fetch care groups
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

  if (groups.length === 0) {
    redirect("/onboarding");
  }

  const activeGroup = groups[0];

  // 3. Fetch recipients
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

  if (recipients.length === 0) {
    redirect(`/onboarding?step=2&care_group_id=${activeGroup.id}`);
  }

  const activeRecipient = recipients[0];

  // 4. Fetch Evolution Logs (Weekly Reports)
  let logs = [];
  try {
    const logsRes = await fetch(`${API_BASE_URL}/api/v1/care-groups/${activeGroup.id}/recipients/${activeRecipient.id}/weekly-reports`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });
    if (logsRes.ok) {
      logs = await logsRes.json();
    }
  } catch (error) {
    console.error("Erro ao carregar diários de evolução:", error);
  }

  return (
    <article className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Diário de Evolução</h1>
        <p>
          Acompanhe e registre o bem-estar diário e a evolução de {activeRecipient.name}.
        </p>
      </header>

      <section className={styles.newEntrySection} aria-label="Novo registro de evolução">
        <h2>Novo Registro</h2>
        <EvolutionLogForm
          groupId={activeGroup.id}
          recipientId={activeRecipient.id}
          token={token}
        />
      </section>

      <section className={styles.feedSection} aria-label="Histórico de evolução">
        <EvolutionLogFeed logs={logs} />
      </section>
    </article>
  );
}
