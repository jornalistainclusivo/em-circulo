import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDocuments } from "@/app/actions/documents";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { DocumentList } from "@/components/documents/DocumentList";
import type { CareGroup } from "@/types";
import type { DocumentResponse } from "@/types/api";

export const metadata = {
  title: "Arquivo Clínico | Cuida Comigo",
};

export default async function ArquivoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://127.0.0.1:8000";

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

  const groupId = groups[0].id;

  let documents: DocumentResponse[] = [];
  let error = null;

  try {
    documents = await getDocuments(groupId);
  } catch (err: any) {
    error = err.message || "Não foi possível carregar os documentos.";
  }

  return (
    <div className="container" style={{ marginTop: "var(--space-8)" }}>
      <header style={{ marginBottom: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--font-size-2xl)", color: "var(--color-text-primary)" }}>
          Arquivo de Documentos Clínicos
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Armazene receitas, laudos, exames e outros documentos médicos.
        </p>
      </header>

      {error && (
        <div style={{ color: "var(--color-danger)", marginBottom: "var(--space-4)" }}>
          {error}
        </div>
      )}

      <section aria-labelledby="upload-heading" style={{ marginBottom: "var(--space-8)" }}>
        <h2 id="upload-heading" style={{ fontSize: "var(--font-size-xl)", marginBottom: "var(--space-4)", color: "var(--color-text-primary)" }}>
          Enviar Novo Documento
        </h2>
        <DocumentUploadForm groupId={groupId} />
      </section>

      <section aria-labelledby="list-heading">
        <h2 id="list-heading" style={{ fontSize: "var(--font-size-xl)", marginBottom: "var(--space-4)", color: "var(--color-text-primary)" }}>
          Documentos Salvos
        </h2>
        <DocumentList groupId={groupId} documents={documents} />
      </section>
    </div>
  );
}
