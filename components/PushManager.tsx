"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type Token,
  type PushNotificationSchema,
  type ActionPerformed,
} from "@capacitor/push-notifications";
import { supabase } from "@/lib/supabase/client";

export default function PushManager() {
  useEffect(() => {
    // Yalnızca mobil (Capacitor native) platformlarda çalış.
    // Web/SSR'da plugin bridge yok, register() çağrılmamalı.
    if (typeof window === "undefined") return;
    if (!Capacitor.isNativePlatform()) return;

    let mounted = true;

    const upsertToken = async (token: string) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from("push_tokens")
          .upsert(
            { user_id: user.id, token },
            { onConflict: "token" }
          );
      } catch (err) {
        console.error("[PushManager] token upsert error:", err);
      }
    };

    const init = async () => {
      try {
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive !== "granted") {
          console.warn("[PushManager] push permission not granted:", perm.receive);
          return;
        }

        await PushNotifications.register();
      } catch (err) {
        console.error("[PushManager] init error:", err);
      }
    };

    const registrationHandle = PushNotifications.addListener(
      "registration",
      (token: Token) => {
        if (!mounted) return;
        console.log("[PushManager] registration token:", token.value);
        upsertToken(token.value);
      }
    );

    const registrationErrorHandle = PushNotifications.addListener(
      "registrationError",
      (err) => {
        console.error("[PushManager] registrationError:", err);
      }
    );

    const receivedHandle = PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        console.log("[PushManager] pushNotificationReceived:", notification);
      }
    );

    const actionHandle = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: ActionPerformed) => {
        console.log("[PushManager] pushNotificationActionPerformed:", action);
      }
    );

    init();

    return () => {
      mounted = false;
      Promise.all([
        registrationHandle.then(h => h.remove()),
        registrationErrorHandle.then(h => h.remove()),
        receivedHandle.then(h => h.remove()),
        actionHandle.then(h => h.remove()),
      ]).catch((err) => console.error("[PushManager] listener cleanup error:", err));
    };
  }, []);

  return null;
}
