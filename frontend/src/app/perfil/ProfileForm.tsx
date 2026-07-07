"use client";

import { useActionState } from "react";
import { updateProfileAction } from "../actions";
import type { User } from "@/types";
import styles from "./page.module.css";

interface ProfileFormProps {
  initialProfile: User;
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null);

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && (
        <div className={styles.alertError} role="alert">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className={styles.alertSuccess} role="status">
          Perfil atualizado com sucesso!
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="email">Email (Não editável)</label>
        <input
          type="email"
          id="email"
          name="email"
          value={initialProfile.email}
          className={styles.input}
          disabled
          aria-disabled="true"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="full_name">Nome Completo</label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          defaultValue={initialProfile.full_name}
          className={styles.input}
          required
          aria-required="true"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="whatsapp">WhatsApp / Celular (Opcional)</label>
        <input
          type="text"
          id="whatsapp"
          name="whatsapp"
          defaultValue={initialProfile.whatsapp || ""}
          className={styles.input}
          placeholder="+55 (11) 99999-9999"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="profession">Profissão / Parentesco (Opcional)</label>
        <input
          type="text"
          id="profession"
          name="profession"
          defaultValue={initialProfile.profession || ""}
          className={styles.input}
          placeholder="Ex: Enfermeiro, Filho(a)"
        />
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          disabled={isPending}
          className="btn btn--primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          {isPending ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </form>
  );
}
