import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

async function fetchTasks(groupId: string, token: string): Promise<Task[]> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${API_BASE_URL}/api/v1/care-groups/${groupId}/tasks`, {
      cache: "no-store",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (res.ok) {
      return (await res.json()) as Task[];
    }
    console.error("Erro na resposta do FastAPI ao buscar tarefas:", res.status);
  } catch (error) {
    console.error("FastAPI indisponível. Erro ao buscar tarefas reais:", error);
  }
  return [];
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://127.0.0.1:8000";

  // 1. Fetch current user profile to obtain dynamic details
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
    console.error("Erro ao carregar perfil do usuário:", error);
    redirect("/login");
  }

  if (!currentUser) {
    redirect("/login");
  }

  // 2. Fetch care groups of the authenticated user
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

  // 3. Fetch recipients of the active group
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
  const tasks = await fetchTasks(activeGroup.id, token);

  // Construct dynamic member profile and usernames map
  const groupMembers: CareGroupMember[] = [
    {
      id: currentUser.id,
      care_group_id: activeGroup.id,
      user_id: currentUser.id,
      role: "ADMIN",
      joined_at: currentUser.created_at as ISODateString
    }
  ];

  const userNamesMap: Record<string, string> = {
    [currentUser.id]: currentUser.full_name
  };

  return (
    <article className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <h1>Painel de Cuidado</h1>
        <p>
          Gerencie as tarefas e o círculo de cuidado da sua família em um único lugar.
        </p>
      </header>

      <CareGroupPanel
        group={activeGroup}
        recipient={activeRecipient}
        members={groupMembers}
        userNames={userNamesMap}
      />

      <TaskPanel
        tasks={tasks}
        currentMemberId={groupMembers[0].id}
        onClaimTask={claimTaskAction}
        onCompleteTask={completeTaskAction}
      />
    </article>
  );
}
