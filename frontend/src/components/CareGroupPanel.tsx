/**
 * CareGroupPanel — Server Component
 *
 * Displays the CareGroup overview with its CareRecipient and members.
 * Uses semantic HTML exclusively — zero generic <div> elements.
 * WCAG: section aria-labelledby, proper heading hierarchy, list roles.
 */

import type { CareGroup, CareGroupMember, CareRecipient } from "@/types";
import styles from "./CareGroupPanel.module.css";

interface CareGroupPanelProps {
  group: CareGroup;
  recipient: CareRecipient | null;
  members: CareGroupMember[];
  userNames: Record<string, string>;
}

export function CareGroupPanel({
  group,
  recipient,
  members,
  userNames,
}: CareGroupPanelProps) {
  const headingId = `group-heading-${group.id}`;
  const recipientHeadingId = `recipient-heading-${group.id}`;
  const membersHeadingId = `members-heading-${group.id}`;

  return (
    <section aria-labelledby={headingId} className={styles.panel}>
      <header className={styles.header}>
        <h2 id={headingId}>{group.name}</h2>
        <time
          dateTime={group.created_at}
          className={styles.meta}
          aria-label={`Grupo criado em ${formatDateForScreen(group.created_at)}`}
        >
          Criado em {formatDateForScreen(group.created_at)}
        </time>
      </header>

      {/* Care Recipient */}
      {recipient ? (
        <article
          aria-labelledby={recipientHeadingId}
          className={styles.recipientCard}
        >
          <h3 id={recipientHeadingId}>Pessoa Cuidada</h3>
          <dl className={styles.detailList}>
            <dt>Nome</dt>
            <dd>{recipient.name}</dd>

            {recipient.blood_type && (
              <>
                <dt>Tipo Sanguíneo</dt>
                <dd>{recipient.blood_type}</dd>
              </>
            )}

            {recipient.allergies.length > 0 && (
              <>
                <dt>Alergias</dt>
                <dd>
                  <ul aria-label="Lista de alergias">
                    {recipient.allergies.map((allergy) => (
                      <li key={allergy}>{allergy}</li>
                    ))}
                  </ul>
                </dd>
              </>
            )}
          </dl>
        </article>
      ) : (
        <p className={styles.empty} role="status">
          Nenhuma pessoa cuidada cadastrada neste grupo.
        </p>
      )}

      {/* Members */}
      <section aria-labelledby={membersHeadingId} className={styles.members}>
        <h3 id={membersHeadingId}>
          Membros
          <span className="visually-hidden">
            ({members.length} {members.length === 1 ? "membro" : "membros"})
          </span>
        </h3>

        {members.length > 0 ? (
          <ul aria-label="Lista de membros do grupo">
            {members.map((member) => {
              const name = userNames[member.user_id] || "Usuário Desconhecido";
              return (
                <li key={member.id} className={styles.memberItem} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                  <div 
                    aria-hidden="true" 
                    style={{ 
                      width: "40px", height: "40px", borderRadius: "var(--radius-full)", 
                      backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)",
                      display: "flex", alignItems: "center", justifyContent: "center", 
                      fontWeight: "var(--font-weight-bold)", fontSize: "var(--font-size-sm)"
                    }}
                  >
                    {getInitials(name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: "block", fontWeight: "var(--font-weight-medium)" }}>{name}</span>
                  </div>
                  <span
                    className={`badge ${member.role === "ADMIN" ? "badge--claimed" : "badge--pending"}`}
                    aria-label={`Função: ${member.role === "ADMIN" ? "Administrador" : "Apoio"}`}
                  >
                    {member.role === "ADMIN" ? "Admin" : "Apoio"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p role="status">Nenhum membro neste grupo.</p>
        )}
      </section>
    </section>
  );
}

/**
 * Formats an ISO 8601 datetime for human-readable screen display
 * using the browser's Intl.DateTimeFormat API.
 */
function formatDateForScreen(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(isoDate));
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
