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
  unreadOnly: boolean = false,
  _timestamp?: number
): Promise<Notification[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("cc_access_token")?.value;

  if (!token || !groupId) return [];

  try {
    const params = new URLSearchParams();
    if (unreadOnly) params.append("unread", "true");
    if (_timestamp) params.append("_t", _timestamp.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(
      `http://127.0.0.1:8000/api/v1/care-groups/${groupId}/notifications${queryString}`,
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

  console.log("[getMyGroupIdAction] Token present:", !!token);

  if (!token) return null;

  try {
    const res = await fetch("http://127.0.0.1:8000/api/v1/care-groups", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    console.log("[getMyGroupIdAction] fetch status:", res.status);

    if (!res.ok) return null;
    const data = await res.json();
    console.log("[getMyGroupIdAction] data length:", data?.length);
    
    // API returns a list of care groups, we take the first one
    return data && data.length > 0 ? data[0].id : null;
  } catch (error) {
    console.error("[getMyGroupIdAction] Fetch error:", error);
    return null;
  }
}
