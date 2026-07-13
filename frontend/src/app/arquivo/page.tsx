import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DocumentUploadForm from "@/components/documents/DocumentUploadForm";
import DocumentList from "@/components/documents/DocumentList";
import styles from "@/app/page.module.css";
import type { CareGroup } from "@/types";
import type { DocumentResponse } from "@/types/api";

export const metadata = {
  title: "Arquivo Clínico | Em Círculo",
};

export default async function ArquivoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let groups: CareGroup[] = [];
  let fetchError = false;
  try {
    const groupsRes = await fetch("http://127.0.0.1:8000/api/v1/care-groups", {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });
    if (groupsRes.ok) {
      groups = await groupsRes.json();
    } else {
      fetchError = true;
    }
  } catch (error) {
    console.error("Erro ao carregar círculos de cuidado:", error);
    fetchError = true;
  }

  if (fetchError) {
    return (
      <article className={styles.dashboard}>
        <div style={{ color: "var(--color-danger)", padding: "var(--space-4)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-danger-light)" }}>
          Erro de comunicação com a API. Verifique se o servidor Python está rodando.
        </div>
      </article>
    );
  }

  if (groups.length === 0) {
    redirect("/onboarding");
  }

  const groupId = groups[0].id;
  console.log("Forcing Turbopack refresh for CSS modules - Group ID:", groupId);

  let documents: DocumentResponse[] = [];
  let docsFetchError = false;

  try {
    const docsRes = await fetch(`http://127.0.0.1:8000/api/v1/care-groups/${groupId}/documents`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });
    if (docsRes.ok) {
      documents = await docsRes.json();
    } else {
      docsFetchError = true;
    }
  } catch (error) {
    console.error("Erro ao carregar documentos:", error);
    docsFetchError = true;
  }

  if (fetchError || docsFetchError) {
    return (
      <article className={styles.dashboard}>
        <div className="fallback-alert" style={{ color: "var(--color-danger)", padding: "var(--space-4)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-danger-light)" }}>
          Erro de comunicação com a API. Verifique se o servidor Python está rodando.
        </div>
      </article>
    );
  }

  return (
    <article className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <h1>Arquivo de Documentos Clínicos</h1>
        <p>
          Armazene receitas, laudos, exames e outros documentos médicos.
        </p>
      </header>

      <section style={{ marginBottom: "var(--space-8)" }}>
        <DocumentUploadForm groupId={groupId} />
      </section>

      <section>
        <DocumentList groupId={groupId} documents={documents} />
      </section>
    </article>
  );
}
