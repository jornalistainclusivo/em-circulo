"use client";

import { useActionState, useEffect } from "react";
import { createTaskAction } from "../app/actions";
import styles from "./CreateForm.module.css";

interface CreateTaskFormProps {
  groupId: string;
  members?: import("@/types").CareGroupMember[];
  userNames?: Record<string, string>;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateTaskForm({ groupId, members = [], userNames = {}, onClose, onSuccess }: CreateTaskFormProps) {
  const createTaskWithGroupId = createTaskAction.bind(null, groupId);
  const [state, formAction, isPending] = useActionState(createTaskWithGroupId, null);

  useEffect(() => {
    if (state?.success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  }, [state, onClose, onSuccess]);

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>
        Nova Tarefa de Cuidado
        <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Fechar formulário">&times;</button>
      </h2>

      {state?.error && (
        <div className={styles.alert} role="alert">
          {state.error}
        </div>
      )}

      <form action={formAction} noValidate>
        <div className={styles.formGroup}>
          <label htmlFor="task-title" className={styles.label}>
            Título da Tarefa
          </label>
          <input
            id="task-title"
            name="title"
            type="text"
            required
            placeholder="Ex: Dar remédio para pressão"
            className={styles.input}
            disabled={isPending}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="task-desc" className={styles.label}>
            Descrição (Opcional)
          </label>
          <input
            id="task-desc"
            name="description"
            type="text"
            placeholder="Ex: Tomar com copo d'água cheio"
            className={styles.input}
            disabled={isPending}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="task-date" className={styles.label}>
            Data e Hora Limite
          </label>
          <input
            id="task-date"
            name="due_date"
            type="datetime-local"
            required
            className={styles.input}
            disabled={isPending}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="task-assignee" className={styles.label}>
            Responsável (Opcional)
          </label>
          <select
            id="task-assignee"
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
            {isPending ? "Criando..." : "Criar Tarefa"}
          </button>
        </div>
      </form>
    </div>
  );
}
