"use client";

import { useActionState, useEffect, useState } from "react";
import styles from "./EditFormModal.module.css";

interface EditFormModalProps {
  title: string;
  type: "task" | "protocol" | "group" | "recipient" | "delete_confirm";
  initialData?: {
    id?: string;
    title?: string;
    description?: string | null;
    due_date?: string;
    status?: string;
    medication_name?: string;
    dosage?: string;
    frequency_interval_hours?: number;
    stock_count?: number;
    safety_threshold?: number;
    name?: string;
    blood_type?: string | null;
    allergies?: string[];
    medical_conditions?: string | null;
    observations?: string | null;
    next_due_at?: string | null;
    assignee_id?: string | null;
  };
  members?: import("@/types").CareGroupMember[];
  userNames?: Record<string, string>;
  onClose: () => void;
  onSubmitAction?: (
    prevState: { success: boolean; error?: string } | null,
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteAction?: () => Promise<{ success: boolean; error?: string }>;
}

export function EditFormModal({
  title,
  type,
  initialData,
  members = [],
  userNames = {},
  onClose,
  onSubmitAction,
  onDeleteAction,
}: EditFormModalProps) {
  const [state, formAction, isPending] = useActionState(
    onSubmitAction || (async () => ({ success: false, error: undefined })),
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  const handleDelete = async () => {
    if (!onDeleteAction) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await onDeleteAction();
      if (res && !res.success) {
        setDeleteError(res.error || "Falha ao excluir.");
      } else {
        onClose();
      }
    } catch {
      setDeleteError("Erro ao processar exclusão.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Pre-formatting values for inputs
  const formatDateTimeLocal = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  return (
    /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title" className={styles.title}>
          {title}
          <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Fechar modal">&times;</button>
        </h2>

        {/* Global errors */}
        {state?.error && <div className={styles.alert} role="alert">{state.error}</div>}
        {deleteError && <div className={styles.alert} role="alert">{deleteError}</div>}

        {type === "delete_confirm" ? (
          <div>
            <p className={styles.confirmMessage}>
              Tem certeza que deseja excluir esta informação médica? Esta ação é irreversível e removerá todos os dados e históricos associados.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ backgroundColor: "var(--color-danger)", color: "#fff" }}
              >
                {isDeleting ? "Excluindo..." : "Excluir Definitivamente"}
              </button>
            </div>
          </div>
        ) : (
          <form action={formAction} noValidate>
            {type === "task" && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-task-title" className={styles.label}>Título da Tarefa</label>
                  <input
                    id="edit-task-title"
                    name="title"
                    type="text"
                    required
                    defaultValue={initialData?.title || ""}
                    className={styles.input}
                    disabled={isPending}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-task-desc" className={styles.label}>Descrição (Opcional)</label>
                  <input
                    id="edit-task-desc"
                    name="description"
                    type="text"
                    defaultValue={initialData?.description || ""}
                    className={styles.input}
                    disabled={isPending}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-task-date" className={styles.label}>Data Limite</label>
                  <input
                    id="edit-task-date"
                    name="due_date"
                    type="datetime-local"
                    required
                    defaultValue={formatDateTimeLocal(initialData?.due_date)}
                    className={styles.input}
                    disabled={isPending}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-task-assignee" className={styles.label}>Responsável (Opcional)</label>
                  <select
                    id="edit-task-assignee"
                    name="assignee_id"
                    defaultValue={initialData?.assignee_id || ""}
                    className={styles.input}
                    disabled={isPending}
                    style={{ appearance: "auto" }}
                  >
                    <option value="">(Nenhum)</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {userNames[member.user_id] || "Usuário"} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-task-status" className={styles.label}>Status</label>
                  <select
                    id="edit-task-status"
                    name="status"
                    defaultValue={initialData?.status || "PENDING"}
                    className={styles.input}
                    disabled={isPending}
                    style={{ appearance: "auto" }}
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="CLAIMED">Assumida</option>
                    <option value="COMPLETED">Concluída</option>
                  </select>
                </div>
              </>
            )}

            {type === "protocol" && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-med-name" className={styles.label}>Nome do Medicamento</label>
                  <input
                    id="edit-med-name"
                    name="medication_name"
                    type="text"
                    required
                    defaultValue={initialData?.medication_name || ""}
                    className={styles.input}
                    disabled={isPending}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-med-dosage" className={styles.label}>Dosagem</label>
                  <input
                    id="edit-med-dosage"
                    name="dosage"
                    type="text"
                    required
                    defaultValue={initialData?.dosage || ""}
                    className={styles.input}
                    disabled={isPending}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-med-freq" className={styles.label}>Frequência (em horas)</label>
                  <input
                    id="edit-med-freq"
                    name="frequency_interval_hours"
                    type="number"
                    required
                    min="1"
                    defaultValue={initialData?.frequency_interval_hours || ""}
                    className={styles.input}
                    disabled={isPending}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-med-stock" className={styles.label}>Estoque</label>
                    <input
                      id="edit-med-stock"
                      name="stock_count"
                      type="number"
                      required
                      min="0"
                      defaultValue={initialData?.stock_count ?? ""}
                      className={styles.input}
                      disabled={isPending}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-med-threshold" className={styles.label}>Limite de Alerta</label>
                    <input
                      id="edit-med-threshold"
                      name="safety_threshold"
                      type="number"
                      required
                      min="0"
                      defaultValue={initialData?.safety_threshold ?? ""}
                      className={styles.input}
                      disabled={isPending}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-med-next-due" className={styles.label}>Próximo Horário</label>
                    <input
                      id="edit-med-next-due"
                      name="next_due_at"
                      type="datetime-local"
                      defaultValue={formatDateTimeLocal(initialData?.next_due_at || undefined)}
                      className={styles.input}
                      disabled={isPending}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="edit-med-assignee" className={styles.label}>Responsável (Opcional)</label>
                    <select
                      id="edit-med-assignee"
                      name="assignee_id"
                      defaultValue={initialData?.assignee_id || ""}
                      className={styles.input}
                      disabled={isPending}
                      style={{ appearance: "auto" }}
                    >
                      <option value="">(Nenhum)</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>
                          {userNames[member.user_id] || "Usuário"} ({member.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {type === "group" && (
              <div className={styles.formGroup}>
                <label htmlFor="edit-group-name" className={styles.label}>Nome do Grupo</label>
                <input
                  id="edit-group-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={initialData?.name || ""}
                  className={styles.input}
                  disabled={isPending}
                />
              </div>
            )}

            {type === "recipient" && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-rec-name" className={styles.label}>Nome do Paciente</label>
                  <input
                    id="edit-rec-name"
                    name="name"
                    type="text"
                    required
                    defaultValue={initialData?.name || ""}
                    className={styles.input}
                    disabled={isPending}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-rec-blood" className={styles.label}>Tipo Sanguíneo (Opcional)</label>
                  <input
                    id="edit-rec-blood"
                    name="blood_type"
                    type="text"
                    defaultValue={initialData?.blood_type || ""}
                    placeholder="Ex: O+, A-, AB+"
                    className={styles.input}
                    disabled={isPending}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-rec-allergies" className={styles.label}>Alergias (Separadas por vírgula)</label>
                  <input
                    id="edit-rec-allergies"
                    name="allergies"
                    type="text"
                    defaultValue={initialData?.allergies?.join(", ") || ""}
                    placeholder="Ex: Dipirona, Penicilina, Poeira"
                    className={styles.input}
                    disabled={isPending}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-rec-conditions" className={styles.label}>Condições Médicas (Opcional)</label>
                  <textarea
                    id="edit-rec-conditions"
                    name="medical_conditions"
                    defaultValue={initialData?.medical_conditions || ""}
                    placeholder="Ex: Diabetes tipo 2, Hipertensão, Alzheimer..."
                    className={styles.input}
                    style={{ minHeight: "100px", resize: "vertical" }}
                    disabled={isPending}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-rec-observations" className={styles.label}>Observações Gerais (Opcional)</label>
                  <textarea
                    id="edit-rec-observations"
                    name="observations"
                    defaultValue={initialData?.observations || ""}
                    placeholder="Preferências de rotina, contatos médicos adicionais..."
                    className={styles.input}
                    style={{ minHeight: "100px", resize: "vertical" }}
                    disabled={isPending}
                  />
                </div>
              </>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isPending}
              >
                {isPending ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
