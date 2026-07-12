import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDocuments } from "@/app/actions/documents";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { DocumentList } from "@/components/documents/DocumentList";

export const metadata = {
  title: "Arquivo Clínico | Cuida Comigo",
};

export default async function ArquivoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;
  const groupId = cookieStore.get("cc_current_group_id")?.value;

  if (!token) {
    redirect("/login");
  }

  if (!groupId) {
    return (
      <div className="container" style={{ marginTop: "var(--space-8)" }}>
        <h1>Arquivo de Documentos Clínicos</h1>
        <p>Você precisa estar vinculado a um Grupo de Cuidado para acessar os documentos.</p>
      </div>
    );
  }

  let documents = [];
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
