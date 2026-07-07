import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileForm } from "./ProfileForm";
import type { User } from "@/types";
import styles from "./page.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://127.0.0.1:8000";

async function fetchProfile(token: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("fetchProfile error:", error);
  }
  return null;
}

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  if (!token) {
    redirect("/login");
  }

  const profile = await fetchProfile(token);
  if (!profile) {
    redirect("/login");
  }

  return (
    <article className={styles.container}>
      <header className={styles.pageHeader}>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <Link href="/" className={styles.backLink}>
            ← Voltar ao Painel
          </Link>
        </div>
        <h1>Meu Perfil</h1>
        <p>Edite suas informações cadastrais e de contato.</p>
      </header>

      <section className={styles.formSection}>
        <ProfileForm initialProfile={profile} />
      </section>
    </article>
  );
}
