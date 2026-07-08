"use client";

/**
 * NotificationBell — Fase 10.1
 *
 * Client Component auto-suficiente:
 * 1. Faz fetch inicial do groupId via /api/v1/care-groups/mine
 * 2. Inicia polling a cada 30s via useEffect + setInterval
 * 3. Compara IDs para detectar notificações novas e dispara toast.info()
 * 4. Exibe badge com contagem de não-lidas
 *
 * WCAG AAA: aria-label, aria-live="polite" no badge
 * Design System: Teal/Amber, prefers-reduced-motion respeitado via CSS
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  getNotificationsAction,
  getMyGroupIdAction,
  type Notification,
} from "@/app/actions/notifications";
import styles from "./NotificationBell.module.css";

const POLL_INTERVAL_MS = 30_000;

const NOTIFICATION_ICONS: Record<Notification["type"], string> = {
  DOSE_REGISTERED: "💊",
  TASK_CREATED: "📋",
  TASK_COMPLETED: "✅",
  STOCK_ALERT: "⚠️",
};

export function NotificationBell() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenIdRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 1: Bootstrap groupId (runs once on mount)
  useEffect(() => {
    getMyGroupIdAction().then((id) => {
      if (id) setGroupId(id);
    });
  }, []);

  // Step 2: Polling — runs whenever groupId becomes available
  const fetchAndToast = useCallback(async () => {
    if (!groupId) return;

    const notifications = await getNotificationsAction(groupId, true);
    setUnreadCount(notifications.length);

    if (notifications.length === 0) return;

    // Detect new notifications by comparing the newest ID with what we last saw
    const newestId = notifications[0]?.id;
    if (newestId && newestId !== lastSeenIdRef.current) {
      // Only toast if we have a previous reference (not on first load)
      if (lastSeenIdRef.current !== null) {
        const n = notifications[0];
        const icon = NOTIFICATION_ICONS[n.type] ?? "🔔";
        toast.info(`${icon} ${n.title}`, {
          description: n.message,
          duration: 6000,
        });
      }
      lastSeenIdRef.current = newestId;
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;

    // Wrap in async IIFE so setState is never called synchronously within the effect body
    // (satisfies react-hooks/set-state-in-effect rule)
    void (async () => { await fetchAndToast(); })();

    pollingRef.current = setInterval(
      () => { void fetchAndToast(); },
      POLL_INTERVAL_MS
    );

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [groupId, fetchAndToast]);

  // Don't render if not logged in (no groupId resolved)
  if (!groupId) return null;

  return (
    <div className={styles.bellWrapper}>
      <button
        type="button"
        className={styles.bellButton}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} notificação${unreadCount > 1 ? "ões" : ""} não lida${unreadCount > 1 ? "s" : ""}`
            : "Notificações — nenhuma nova"
        }
        title="Notificações"
      >
        {/* Bell SVG icon — inline for zero dependency */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {unreadCount > 0 && (
        <span
          className={styles.badge}
          aria-live="polite"
          aria-atomic="true"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
}
