"use client";

import { useRef, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createAppointmentAction } from "@/app/actions/appointments";
import styles from "./CreateAppointmentForm.module.css";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={styles.submitBtn}
    >
      {pending ? "Agendando..." : "Agendar Consulta"}
    </button>
  );
}

export function CreateAppointmentForm({ groupId }: { groupId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  
  const createWithId = createAppointmentAction.bind(null, groupId);
  const [state, formAction] = useFormState(createWithId, null);

  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message);
        formRef.current?.reset();
      } else if (state.error) {
        toast.error(state.error);
      }
    }
  }, [state]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Nova Consulta</h2>
      
      <form ref={formRef} action={formAction} className={styles.form}>
        <div className={styles.fieldGroup}>
          <label htmlFor="title" className={styles.label}>
            Título *
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            placeholder="Ex: Consulta Cardiologista"
            className={styles.input}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="scheduled_at" className={styles.label}>
            Data e Hora *
          </label>
          <input
            type="datetime-local"
            name="scheduled_at"
            id="scheduled_at"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="provider_name" className={styles.label}>
            Profissional / Especialista
          </label>
          <input
            type="text"
            name="provider_name"
            id="provider_name"
            placeholder="Ex: Dr. Silva"
            className={styles.input}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="location" className={styles.label}>
            Local / Endereço
          </label>
          <input
            type="text"
            name="location"
            id="location"
            placeholder="Ex: Clínica Visão"
            className={styles.input}
          />
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
