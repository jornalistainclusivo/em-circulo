import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { acceptInviteAction } from "../../actions";

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

  // 3. Invite is invalid or expired
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "var(--space-4)",
        backgroundColor: "var(--color-bg-primary, #0b1114)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--color-bg-secondary, #111a1e)",
          border: "1px solid var(--color-border, #1f2c31)",
          borderRadius: "var(--radius-xl, 16px)",
          padding: "var(--space-5)",
          textAlign: "center",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            fontSize: "3rem",
            marginBottom: "var(--space-3)",
            display: "inline-block",
          }}
        >
          ⚠️
        </div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "var(--font-weight-bold, 700)",
            color: "#f59e0b",
            margin: "0 0 var(--space-2) 0",
          }}
        >
          Convite Inválido ou Expirado
        </h1>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--color-text-secondary, #94a3b8)",
            lineHeight: "1.5",
            margin: "0 0 var(--space-4) 0",
          }}
        >
          Este link de convite é inválido ou expirou após o limite de 48 horas. Solicite um novo link ao administrador do grupo.
        </p>
        <Link
          href="/"
          className="btn btn--primary"
          style={{
            display: "inline-block",
            textDecoration: "none",
            width: "100%",
            textAlign: "center",
            padding: "var(--space-2) var(--space-4)",
            backgroundColor: "#2dd4bf",
            color: "#0f172a",
            fontWeight: "600",
            borderRadius: "var(--radius-lg, 8px)",
          }}
        >
          Ir para o Painel Principal
        </Link>
      </div>
    </main>
  );
}
