import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { acceptInviteAction } from "../../actions";
import styles from "../../login/login.module.css";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  // 1. Check if user is logged in
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("cc_access_token")?.value;

  if (!accessToken) {
    // Redirect to login page passing invite token in query string
    redirect(`/login?invite=${token}`);
  }

  // 2. User is logged in, try to accept invite
  const result = await acceptInviteAction(token);

  if (result.success) {
    redirect("/");
  }

  const isAlreadyMember = result.error === "Você já faz parte deste grupo";

  // 3. Render styling identical to Login screen with clear contrast
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Cuida Comigo</h1>
          <p className={styles.subtitle}>Convite para Círculo de Cuidado</p>
        </header>

        <div className={styles.formContent} style={{ textAlign: "center" }}>
          {isAlreadyMember ? (
            <>
              <div aria-hidden="true" style={{ fontSize: "3rem", marginBottom: "var(--space-3)" }}>
                ✅
              </div>
              <h2
                style={{
                  fontSize: "var(--font-size-lg)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--color-primary)",
                  margin: "0 0 var(--space-2) 0",
                }}
              >
                Acesso Autorizado
              </h2>
              <p
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-secondary)",
                  lineHeight: "var(--line-height-normal)",
                  margin: "0 0 var(--space-5) 0",
                }}
              >
                Você já faz parte deste círculo de cuidado! Não é necessário aceitar o convite novamente.
              </p>
            </>
          ) : (
            <>
              <div aria-hidden="true" style={{ fontSize: "3rem", marginBottom: "var(--space-3)" }}>
                ⚠️
              </div>
              <h2
                style={{
                  fontSize: "var(--font-size-lg)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--color-accent)",
                  margin: "0 0 var(--space-2) 0",
                }}
              >
                Convite Inválido ou Expirado
              </h2>
              <p
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-secondary)",
                  lineHeight: "var(--line-height-normal)",
                  margin: "0 0 var(--space-5) 0",
                }}
              >
                {result.error || "Este link de convite é inválido ou expirou após o limite de 48 horas. Solicite um novo link ao administrador."}
              </p>
            </>
          )}

          <Link
            href="/"
            className="btn btn--primary"
            style={{
              display: "inline-flex",
              width: "100%",
              textDecoration: "none",
              justifyContent: "center",
            }}
          >
            Ir para o Painel Principal
          </Link>
        </div>
      </div>
    </div>
  );
}
