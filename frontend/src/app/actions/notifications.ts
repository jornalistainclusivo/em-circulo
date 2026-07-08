"use server";

import { cookies } from "next/headers";

export interface Notification {
  id: string;
  care_group_id: string;
  title: string;
  message: string;
  type:
    | "DOSE_REGISTERED"
    | "TASK_CREATED"
    | "TASK_COMPLETED"
    | "STOCK_ALERT";
  is_read: boolean;
  created_at: string;
}

/**
 * Fetches notifications for a care group.
 * @param groupId - UUID of the care group
 * @param unreadOnly - If true, returns only unread notifications
 */
export async function getNotificationsAction(
  groupId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token || !groupId) return [];

  try {
    const params = unreadOnly ? "?unread=true" : "";
    const res = await fetch(
      `http://localhost:8000/api/v1/care-groups/${groupId}/notifications${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!res.ok) return [];
    return (await res.json()) as Notification[];
  } catch {
    return [];
  }
}

/**
 * Fetches the current user's care group ID.
 * Used by NotificationBell to bootstrap polling without prop-drilling.
 */
export async function getMyGroupIdAction(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token) return null;

  try {
    const res = await fetch("http://localhost:8000/api/v1/care-groups/mine", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.id ?? null;
  } catch {
    return null;
  }
}
