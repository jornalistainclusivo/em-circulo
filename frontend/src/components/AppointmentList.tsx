import type { AppointmentResponse } from "@/types/api";
import styles from "./AppointmentList.module.css";

export function AppointmentList({ appointments }: { appointments: AppointmentResponse[] }) {
  if (appointments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Nenhuma consulta agendada.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {appointments.map((apt) => (
        <div key={apt.id} className={styles.card}>
          <div>
            <h3 className={styles.title}>{apt.title}</h3>
            <p className={styles.detail}>
              Data: {new Date(apt.scheduled_at).toLocaleString('pt-BR')}
            </p>
            {apt.provider_name && (
              <p className={styles.detail}>
                Profissional: <span className={styles.highlight}>{apt.provider_name}</span>
              </p>
            )}
            {apt.location && (
              <p className={styles.detail}>Local: {apt.location}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
