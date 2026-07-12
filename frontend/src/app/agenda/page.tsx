import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppointmentList } from "@/components/AppointmentList";
import { CreateAppointmentForm } from "@/components/CreateAppointmentForm";
import type { CareGroup } from "@/types";
import { getAppointments } from "../actions/appointments";
import styles from "./page.module.css";

export default async function AgendaPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://127.0.0.1:8000";

  // 1. Fetch care groups
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

  let appointments: import("@/types").AppointmentResponse[] = [];
  try {
    appointments = await getAppointments(activeGroup.id);
  } catch (err) {
    console.error("Erro ao carregar consultas:", err);
  }

  return (
    <article className={styles.container}>
      <header className={styles.pageHeader}>
        <h1>Agenda de Consultas</h1>
        <p>
          Gerencie consultas médicas, retornos e especialistas da sua família.
        </p>
      </header>
      
      <div className={styles.content}>
        <div>
          <h2 className={styles.sectionTitle}>Próximas Consultas</h2>
          <AppointmentList appointments={appointments} />
        </div>
        <div>
          <CreateAppointmentForm groupId={activeGroup.id} />
        </div>
      </div>
    </article>
  );
}
