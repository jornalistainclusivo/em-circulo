"use client";

import { useActionState, useEffect } from "react";
import { createProtocolAction } from "../app/actions";
import styles from "./CreateForm.module.css";

interface CreateProtocolFormProps {
  recipientId: string;
  members?: import("@/types").CareGroupMember[];
  userNames?: Record<string, string>;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProtocolForm({ recipientId, members = [], userNames = {}, onClose, onSuccess }: CreateProtocolFormProps) {
  const createProtocolWithRecipientId = createProtocolAction.bind(null, recipientId);
  const [state, formAction, isPending] = useActionState(createProtocolWithRecipientId, null);

  useEffect(() => {
    if (state?.success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  }, [state, onClose, onSuccess]);

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>
        Cadastrar Medicamento
        <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Fechar formulário">&times;</button>
      </h2>

      {state?.error && (
        <div className={styles.alert} role="alert">
          {state.error}
        </div>
      )}

      <form action={formAction} noValidate>
        <div className={styles.formGroup}>
          <label htmlFor="medication-name" className={styles.label}>
            Nome do Medicamento
          </label>
          <input
            id="medication-name"
            name="medication_name"
            type="text"
            required
            placeholder="Ex: Paracetamol"
            className={styles.input}
            disabled={isPending}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="dosage" className={styles.label}>
            Dosagem
          </label>
          <input
            id="dosage"
            name="dosage"
            type="text"
            required
            placeholder="Ex: 500mg, 1 comprimido, 5ml"
            className={styles.input}
            disabled={isPending}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="frequency" className={styles.label}>
            Frequência (em horas)
          </label>
          <input
            id="frequency"
            name="frequency_interval_hours"
            type="number"
            required
            min="1"
            placeholder="Ex: 8 (para 8 em 8 horas)"
            className={styles.input}
            disabled={isPending}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="stock" className={styles.label}>
              Quantidade em Estoque
            </label>
            <input
              id="stock"
              name="stock_count"
              type="number"
              required
              min="0"
              placeholder="Ex: 30"
              className={styles.input}
              disabled={isPending}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="threshold" className={styles.label}>
              Limite Mínimo de Alerta
            </label>
            <input
              id="threshold"
              name="safety_threshold"
              type="number"
              required
              min="0"
              placeholder="Ex: 5"
              className={styles.input}
              disabled={isPending}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="next_due_at" className={styles.label}>
              Próximo Horário (Opcional)
            </label>
            <input
              id="next_due_at"
              name="next_due_at"
              type="datetime-local"
              className={styles.input}
              disabled={isPending}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="assignee_id" className={styles.label}>
              Responsável (Opcional)
            </label>
            <select
              id="assignee_id"
              name="assignee_id"
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
            {isPending ? "Cadastrando..." : "Cadastrar Medicamento"}
          </button>
        </div>
      </form>
    </div>
  );
}
