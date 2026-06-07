/**
 * Dashboard Page — Server Component
 *
 * Initial landing page showing the CareGroup panel and Task panel
 * with demo data for structural validation.
 */

import { CareGroupPanel } from "@/components/CareGroupPanel";
import { TaskPanel } from "@/components/TaskPanel";
import type {
  CareGroup,
  CareGroupMember,
  CareRecipient,
  Task,
  ISODateString,
} from "@/types";
import { claimTaskAction, completeTaskAction } from "./actions";
import styles from "./page.module.css";

/* ── Demo Data (structural validation only) ──────────────────── */
const DEMO_GROUP: CareGroup = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  name: "Família Silva",
  created_at: "2026-06-01T10:00:00Z" as ISODateString,
  updated_at: "2026-06-01T10:00:00Z" as ISODateString,
};

const DEMO_RECIPIENT: CareRecipient = {
  id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  care_group_id: DEMO_GROUP.id,
  name: "Maria Silva",
  blood_type: "O+",
  allergies: ["Dipirona", "Penicilina"],
  emergency_contacts: [{ name: "SAMU", phone: "192" }],
  created_at: "2026-06-01T10:00:00Z" as ISODateString,
  updated_at: "2026-06-01T10:00:00Z" as ISODateString,
};

const DEMO_MEMBERS: CareGroupMember[] = [
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    care_group_id: DEMO_GROUP.id,
    user_id: "d4e5f6a7-b8c9-0123-defa-234567890123",
    role: "ADMIN",
    joined_at: "2026-06-01T10:00:00Z" as ISODateString,
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-345678901234",
    care_group_id: DEMO_GROUP.id,
    user_id: "f6a7b8c9-d0e1-2345-fabc-456789012345",
    role: "SUPPORT",
    joined_at: "2026-06-02T14:00:00Z" as ISODateString,
  },
];

const DEMO_TASKS: Task[] = [
  {
    id: "t1a2b3c4-d5e6-7890-abcd-ef1234567890",
    care_group_id: DEMO_GROUP.id,
    title: "Comprar fraldas geriátricas",
    description: "Tamanho G, pacote com 30 unidades.",
    assignee_id: null,
    due_date: "2026-06-08T18:00:00Z" as ISODateString,
    status: "PENDING",
    recurrence_rule: null,
    created_at: "2026-06-06T10:00:00Z" as ISODateString,
    updated_at: "2026-06-06T10:00:00Z" as ISODateString,
  },
  {
    id: "t2b3c4d5-e6f7-8901-bcde-f12345678901",
    care_group_id: DEMO_GROUP.id,
    title: "Administrar banho assistido",
    description: null,
    assignee_id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    due_date: "2026-06-07T09:00:00Z" as ISODateString,
    status: "CLAIMED",
    recurrence_rule: null,
    created_at: "2026-06-06T08:00:00Z" as ISODateString,
    updated_at: "2026-06-06T12:00:00Z" as ISODateString,
  },
  {
    id: "t3c4d5e6-f7a8-9012-cdef-012345678902",
    care_group_id: DEMO_GROUP.id,
    title: "Fisioterapia domiciliar",
    description: "Sessão semanal com Dr. Santos — 14h.",
    assignee_id: "e5f6a7b8-c9d0-1234-efab-345678901234",
    due_date: "2026-06-10T14:00:00Z" as ISODateString,
    status: "COMPLETED",
    recurrence_rule: null,
    created_at: "2026-06-05T10:00:00Z" as ISODateString,
    updated_at: "2026-06-06T16:00:00Z" as ISODateString,
  },
];

const userNamesMap: Record<string, string> = {
  "d4e5f6a7-b8c9-0123-defa-234567890123": "João Silva", // Admin
  "f6a7b8c9-d0e1-2345-fabc-456789012345": "Carlos Souza", // Apoio
};

async function fetchTasks(): Promise<Task[]> {
  try {
    const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";
    const res = await fetch(`${API_BASE_URL}/tasks?care_group_id=${DEMO_GROUP.id}`, { cache: "no-store" });
    if (res.ok) {
      return (await res.json()) as Task[];
    }
  } catch (error) {
    console.warn("FastAPI indisponível ou rota não encontrada. Usando DEMO_TASKS fallback:", error);
  }
  return DEMO_TASKS;
}

export default async function DashboardPage() {
  const tasks = await fetchTasks();

  return (
    <article className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <h1>Painel de Cuidado</h1>
        <p>
          Gerencie as tarefas e o círculo de cuidado da sua família em um único lugar.
        </p>
      </header>

      <CareGroupPanel
        group={DEMO_GROUP}
        recipient={DEMO_RECIPIENT}
        members={DEMO_MEMBERS}
        userNames={userNamesMap}
      />

      <TaskPanel
        tasks={tasks}
        currentMemberId={DEMO_MEMBERS[0].id}
        onClaimTask={claimTaskAction}
        onCompleteTask={completeTaskAction}
      />
    </article>
  );
}
