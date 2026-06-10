// Web Push bildirimi gönderme yardımcısı.
// Yalnızca sunucu tarafında çağrılabilir (server action / API route).

import webpush from "web-push";
import { createServiceRoleServer } from "@/lib/supabase/server";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL ?? "mailto:destek@ozelderspro.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

type SubRow = {
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return;
  }

  const supabase = createServiceRoleServer();
  const { data: subs } = await supabase
    .from("web_push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const notification = JSON.stringify({
    title:   payload.title,
    body:    payload.body,
    icon:    payload.icon  ?? "/icons/icon-192.png",
    badge:   "/icons/icon-192.png",
    url:     payload.url   ?? "/",
    tag:     payload.tag   ?? "default",
    timestamp: Date.now(),
  });

  const staleIds: string[] = [];

  await Promise.allSettled(
    (subs as SubRow[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          notification,
          { TTL: 60 * 60 * 24 },
        );
      } catch (err: unknown) {
        // 410 Gone / 404 Not Found → subscription expired, clean up
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          staleIds.push(sub.endpoint);
        }
      }
    }),
  );

  if (staleIds.length > 0) {
    await supabase
      .from("web_push_subscriptions")
      .delete()
      .in("endpoint", staleIds);
  }
}

export async function sendPushToMany(
  userIds: string[],
  payload: PushPayload,
): Promise<void> {
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)));
}
