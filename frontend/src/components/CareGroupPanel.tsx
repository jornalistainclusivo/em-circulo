"use client";

import { useState } from "react";
import type { CareGroup, CareGroupMember, CareRecipient } from "@/types";
import styles from "./CareGroupPanel.module.css";
import {
  updateCareGroupAction,
  deleteCareGroupAction,
  updateCareRecipientAction,
  deleteCareRecipientAction,
  createInviteAction,
} from "../app/actions";
import { EditFormModal } from "./EditFormModal";

interface CareGroupPanelProps {
  group: CareGroup;
  recipient: CareRecipient | null;
  members: CareGroupMember[];
  userNames: Record<string, string>;
  currentUserId?: string;
}

export function CareGroupPanel({
  group,
  recipient,
  members,
  userNames,
  currentUserId,
}: CareGroupPanelProps) {
  const [editingGroup, setEditingGroup] = useState<CareGroup | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [deletingGroupName, setDeletingGroupName] = useState("");

  const [editingRecipient, setEditingRecipient] = useState<CareRecipient | null>(null);
  const [deletingRecipientId, setDeletingRecipientId] = useState<string | null>(null);
  const [deletingRecipientName, setDeletingRecipientName] = useState("");

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateInvite = async () => {
    setGenerating(true);
    setInviteError(null);
    setInviteLink(null);
    setCopied(false);
    try {
      const res = await createInviteAction(group.id);
      if (res.success && res.inviteLink) {
        setInviteLink(res.inviteLink);
      } else {
        setInviteError(res.error || "Erro ao gerar convite.");
      }
    } catch {
      setInviteError("Erro de conexão ao gerar convite.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const headingId = `group-heading-${group.id}`;
  const recipientHeadingId = `recipient-heading-${group.id}`;
  const membersHeadingId = `members-heading-${group.id}`;

  return (
    <section aria-labelledby={headingId} className={styles.panel}>
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <h2 id={headingId} style={{ margin: 0 }}>{group.name}</h2>
          <div style={{ display: "flex", gap: "var(--space-1)" }}>
            <button
              type="button"
              className="btn btn--secondary"
              style={{ padding: "var(--space-1) var(--space-2)", fontSize: "0.8rem", minHeight: "auto", border: "1px solid var(--color-border)" }}
              onClick={() => setEditingGroup(group)}
              aria-label={`Editar Grupo: ${group.name}`}
            >
              ✏️
            </button>
            <button
              type="button"
              className="btn btn--danger"
              style={{ padding: "var(--space-1) var(--space-2)", fontSize: "0.8rem", minHeight: "auto", backgroundColor: "var(--color-danger)", color: "#fff" }}
              onClick={() => {
                setDeletingGroupId(group.id);
                setDeletingGroupName(group.name);
              }}
              aria-label={`Excluir Grupo: ${group.name}`}
            >
              🗑️
            </button>
          </div>
        </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
            <h3 id={recipientHeadingId} style={{ margin: 0 }}>Pessoa Cuidada</h3>
            <div style={{ display: "flex", gap: "var(--space-1)" }}>
              <button
                type="button"
                className="btn btn--secondary"
                style={{ padding: "var(--space-1) var(--space-2)", fontSize: "0.8rem", minHeight: "auto", border: "1px solid var(--color-border)" }}
                onClick={() => setEditingRecipient(recipient)}
                aria-label={`Editar Paciente: ${recipient.name}`}
              >
                ✏️
              </button>
              <button
                type="button"
                className="btn btn--danger"
                style={{ padding: "var(--space-1) var(--space-2)", fontSize: "0.8rem", minHeight: "auto", backgroundColor: "var(--color-danger)", color: "#fff" }}
                onClick={() => {
                  setDeletingRecipientId(recipient.id);
                  setDeletingRecipientName(recipient.name);
                }}
                aria-label={`Excluir Paciente: ${recipient.name}`}
              >
                🗑️
              </button>
            </div>
          </div>
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
                    aria-label={`Função: ${member.role === "ADMIN" ? "Administrador" : "Cuidador"}`}
                  >
                    {member.role === "ADMIN" ? "Admin" : "Cuidador"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p role="status">Nenhum membro neste grupo.</p>
        )}

        {/* Invite and RBAC Management Section */}
        {(() => {
          const currentUserMember = members.find((m) => m.user_id === currentUserId);
          const isAdmin = currentUserMember?.role === "ADMIN";
          if (!isAdmin) return null;

          return (
            <div
              style={{
                marginTop: "var(--space-4)",
                padding: "var(--space-3)",
                backgroundColor: "var(--color-bg-secondary, #1a2327)",
                border: "1px solid var(--color-border, #2d3b41)",
                borderRadius: "var(--radius-xl)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#2dd4bf" }}>
                Gerenciar Círculo de Cuidado
              </h4>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-secondary, #94a3b8)" }}>
                Gere um link de convite atrelado a este grupo de cuidado. Novos membros entrarão automaticamente como <strong>Cuidadores</strong>. O convite expira em 48 horas.
              </p>
              
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center", marginTop: "var(--space-1)" }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  style={{ minHeight: "auto", padding: "var(--space-1) var(--space-3)", border: "1px solid var(--color-border)" }}
                  onClick={handleGenerateInvite}
                  disabled={generating}
                >
                  {generating ? "Gerando..." : "Gerar Link de Convite"}
                </button>
                {inviteLink && (
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{ minHeight: "auto", padding: "var(--space-1) var(--space-3)", backgroundColor: "#d97706", color: "#fff" }}
                    onClick={handleCopyLink}
                  >
                    {copied ? "✓ Copiado!" : "Copiar Link"}
                  </button>
                )}
              </div>

              {inviteLink && (
                <code
                  style={{
                    fontSize: "0.8rem",
                    wordBreak: "break-all",
                    padding: "var(--space-1) var(--space-2)",
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "var(--radius-md)",
                    color: "#38bdf8",
                  }}
                >
                  {inviteLink}
                </code>
              )}

              {inviteError && (
                <span style={{ fontSize: "0.85rem", color: "var(--color-danger, #ef4444)" }}>
                  {inviteError}
                </span>
              )}

              {/* Accessible Live Region */}
              <div aria-live="polite" className="visually-hidden" style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", border: 0 }}>
                {copied ? "Link de convite copiado para a área de transferência!" : ""}
              </div>
            </div>
          );
        })()}
      </section>

      {editingGroup && (
        <EditFormModal
          title="Editar Grupo de Cuidado"
          type="group"
          initialData={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSubmitAction={updateCareGroupAction.bind(null, editingGroup.id)}
        />
      )}

      {deletingGroupId && (
        <EditFormModal
          title={`Excluir Grupo: ${deletingGroupName}`}
          type="delete_confirm"
          onClose={() => {
            setDeletingGroupId(null);
            setDeletingGroupName("");
          }}
          onDeleteAction={() => deleteCareGroupAction(deletingGroupId)}
        />
      )}

      {editingRecipient && (
        <EditFormModal
          title="Editar Paciente"
          type="recipient"
          initialData={editingRecipient}
          onClose={() => setEditingRecipient(null)}
          onSubmitAction={updateCareRecipientAction.bind(null, editingRecipient.id)}
        />
      )}

      {deletingRecipientId && (
        <EditFormModal
          title={`Excluir Paciente: ${deletingRecipientName}`}
          type="delete_confirm"
          onClose={() => {
            setDeletingRecipientId(null);
            setDeletingRecipientName("");
          }}
          onDeleteAction={() => deleteCareRecipientAction(deletingRecipientId)}
        />
      )}
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
