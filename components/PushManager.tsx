"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase/client";

type Handle = { remove: () => Promise<void> };

const RETRY_DELAYS_MS = [500, 1000, 2000] as const;

async function upsertTokenWithRetry(token: string, userId: string): Promise<void> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const { error } = await supabase
        .from("push_tokens")
        .upsert({ user_id: userId, token }, { onConflict: "token" });
      if (!error) return;
      throw error;
    } catch (err) {
      if (attempt === RETRY_DELAYS_MS.length) {
        console.error("[PushManager] token upsert failed after retries:", err);
        return;
      }
      await new Promise<void>((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }
  }
}

export default function PushManager() {
  useEffect(() => {
    if (typeof window === "undefined" || !Capacitor.isNativePlatform()) return;

    let disposed = false;
    const handles: Handle[] = [];

    const cleanup = () => {
      disposed = true;
      handles.splice(0).forEach((h) => h.remove().catch(() => {}));
    };

    (async () => {
      try {
        // Lazy-load only on native — keeps web bundle free of the plugin
        const { PushNotifications } = await import("@capacitor/push-notifications");
        if (disposed) return;

        const initPush = async () => {
          try {
            let perm = await PushNotifications.checkPermissions();
            if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
              perm = await PushNotifications.requestPermissions();
            }
            if (perm.receive !== "granted" || disposed) return;
            await PushNotifications.register();
          } catch (err) {
            console.error("[PushManager] init error:", err);
          }
        };

        // Registration success — upsert token with retry
        const regHandle = await PushNotifications.addListener(
          "registration",
          async (token) => {
            if (disposed) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (!disposed && user) await upsertTokenWithRetry(token.value, user.id);
          },
        );
        if (disposed) { regHandle.remove(); return; }
        handles.push(regHandle);

        const errHandle = await PushNotifications.addListener(
          "registrationError",
          (err) => { console.error("[PushManager] registrationError:", err); },
        );
        if (disposed) { errHandle.remove(); return; }
        handles.push(errHandle);

        const rcvHandle = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            if (!disposed) console.log("[PushManager] received:", notification.title);
          },
        );
        if (disposed) { rcvHandle.remove(); return; }
        handles.push(rcvHandle);

        const actHandle = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            if (!disposed) console.log("[PushManager] action:", action.actionId);
          },
        );
        if (disposed) { actHandle.remove(); return; }
        handles.push(actHandle);

        // Trigger push registration on sign-in
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (disposed) return;
          if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
            initPush();
          }
        });
        handles.push({ remove: () => Promise.resolve(subscription.unsubscribe()) });

      } catch (err) {
        console.error("[PushManager] setup error:", err);
      }
    })();

    return cleanup;
  }, []);

  return null;
}
