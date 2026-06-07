"use client";

/**
 * TaskPanel — Client Component (interactive)
 *
 * Displays an ordered list of tasks for a CareGroup with
 * claim/complete actions. Full keyboard navigation and
 * aria-live announcements for screen readers.
 *
 * WCAG: ordered list, article per task, aria-describedby for
 * contextual buttons, aria-live polite region for state changes.
 */

import { useState, useCallback } from "react";
import type { Task, TaskStatus } from "@/types";
import styles from "./TaskPanel.module.css";

interface TaskPanelProps {
  tasks: Task[];
  currentMemberId: string | null;
  onClaimTask?: (taskId: string, memberId: string) => Promise<void>;
  onCompleteTask?: (taskId: string) => Promise<void>;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pendente",
  CLAIMED: "Assumida",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

const STATUS_CSS: Record<TaskStatus, string> = {
  PENDING: "badge--pending",
  CLAIMED: "badge--claimed",
  IN_PROGRESS: "badge--claimed",
  COMPLETED: "badge--completed",
  CANCELLED: "badge--cancelled",
};

export function TaskPanel({
  tasks,
  currentMemberId,
  onClaimTask,
  onCompleteTask,
}: TaskPanelProps) {
  const [announcement, setAnnouncement] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const headingId = "task-panel-heading";

  const handleClaim = useCallback(
    async (task: Task) => {
      if (!currentMemberId || !onClaimTask) return;
      setLoadingId(task.id);
      try {
        await onClaimTask(task.id, currentMemberId);
        setAnnouncement(
          `Tarefa "${task.title}" assumida com sucesso.`
        );
      } catch {
        setAnnouncement(
          `Erro ao assumir a tarefa "${task.title}". Tente novamente.`
        );
      } finally {
        setLoadingId(null);
      }
    },
    [currentMemberId, onClaimTask]
  );

  const handleComplete = useCallback(
    async (task: Task) => {
      if (!onCompleteTask) return;
      setLoadingId(task.id);
      try {
        await onCompleteTask(task.id);
        setAnnouncement(
          `Tarefa "${task.title}" concluída com sucesso.`
        );
      } catch {
        setAnnouncement(
          `Erro ao concluir a tarefa "${task.title}". Tente novamente.`
        );
      } finally {
        setLoadingId(null);
      }
    },
    [onCompleteTask]
  );

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  return (
    <section aria-labelledby={headingId} className={styles.panel}>
      <h2 id={headingId}>
        Tarefas
        <span className="visually-hidden">
          ({tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"})
        </span>
      </h2>

      {/* Live region for screen reader announcements */}
      <output aria-live="polite" aria-atomic="true" className="live-region">
        {announcement}
      </output>

      {sortedTasks.length > 0 ? (
        <ol className={styles.taskList} aria-label="Lista de tarefas ordenada por prazo">
          {sortedTasks.map((task) => {
            const descId = `task-desc-${task.id}`;
            const isLoading = loadingId === task.id;

            return (
              <li key={task.id}>
                <article
                  className={styles.taskCard}
                  aria-labelledby={`task-title-${task.id}`}
                >
                  <header className={styles.taskHeader}>
                    <h3 id={`task-title-${task.id}`}>{task.title}</h3>
                    <span
                      className={`badge ${STATUS_CSS[task.status]}`}
                      aria-label={`Status: ${STATUS_LABELS[task.status]}`}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>
                  </header>

                  {task.description && (
                    <p id={descId} className={styles.description}>
                      {task.description}
                    </p>
                  )}

                  <footer className={styles.taskFooter}>
                    <time
                      dateTime={task.due_date}
                      className={styles.dueDate}
                      aria-label={`Prazo: ${formatDate(task.due_date)}`}
                      style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-secondary)", fontWeight: "var(--font-weight-medium)" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>
                      </svg>
                      {formatDate(task.due_date)}
                    </time>

                    <nav aria-label={`Ações para tarefa ${task.title}`} className={styles.actions}>
                      {task.status === "PENDING" && currentMemberId && (
                        <button
                          type="button"
                          className="btn btn--primary"
                          onClick={() => handleClaim(task)}
                          disabled={isLoading}
                          aria-busy={isLoading}
                          aria-describedby={task.description ? descId : undefined}
                        >
                          {isLoading ? "Assumindo…" : "Assumir"}
                        </button>
                      )}

                      {task.status === "CLAIMED" &&
                        task.assignee_id &&
                        currentMemberId === task.assignee_id && (
                          <button
                            type="button"
                            className="btn btn--accent"
                            onClick={() => handleComplete(task)}
                            disabled={isLoading}
                            aria-busy={isLoading}
                            aria-describedby={task.description ? descId : undefined}
                          >
                            {isLoading ? "Concluindo…" : "Concluir"}
                          </button>
                        )}
                    </nav>
                  </footer>
                </article>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className={styles.empty} role="status">
          Nenhuma tarefa cadastrada neste grupo.
        </p>
      )}
    </section>
  );
}

/** Formats ISO 8601 datetime for screen display with Intl API. */
function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(isoDate));
}
