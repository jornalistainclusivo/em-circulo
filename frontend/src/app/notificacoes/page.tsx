import { getMyGroupIdAction, getNotificationsAction } from "@/app/actions/notifications";
import styles from "./page.module.css";
import Link from "next/link";

export default async function NotificacoesPage() {
  const groupId = await getMyGroupIdAction();
  
  if (!groupId) {
    return (
      <div className={styles.container}>
        <h1>Notificações</h1>
        <p>Você precisa estar em um grupo de cuidado para ver as notificações.</p>
        <Link href="/" className={styles.backLink}>Voltar para o Painel</Link>
      </div>
    );
  }

  // Busca notificações (ignora cache para ter dados frescos)
  const notifications = await getNotificationsAction(groupId, false, Date.now());

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Notificações</h1>
        <Link href="/" className={styles.backLink}>Voltar para o Painel</Link>
      </div>

      {notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nenhuma notificação nova por aqui.</p>
        </div>
      ) : (
        <ul className={styles.notificationList}>
          {notifications.map((n) => (
            <li key={n.id} className={`${styles.notificationItem} ${!n.is_read ? styles.unread : ""}`}>
              <div className={styles.icon}>
                {n.type === "DOSE_REGISTERED" && "💊"}
                {n.type === "TASK_CREATED" && "📋"}
                {n.type === "TASK_COMPLETED" && "✅"}
                {n.type === "STOCK_ALERT" && "⚠️"}
                {!["DOSE_REGISTERED", "TASK_CREATED", "TASK_COMPLETED", "STOCK_ALERT"].includes(n.type) && "🔔"}
              </div>
              <div className={styles.content}>
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <small>{new Date(n.created_at).toLocaleString("pt-BR")}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
