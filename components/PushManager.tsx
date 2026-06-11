"use client";

// PushManager: hem Capacitor (native) hem Web Push (tarayıcı SW) aboneliğini yönetir.
// Kullanıcı oturum açtığında push kaydı yapar, çıkış yapınca token/subscription siler.

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase/client";

type Handle = { remove: () => Promise<void> };

const RETRY_DELAYS_MS = [500, 1000, 2000] as const;

// ── Capacitor helpers ─────────────────────────────────────────────────────────

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
        console.error("[PushManager] token upsert failed:", err);
        return;
      }
      await new Promise<void>((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }
  }
}

// ── Web Push helpers ──────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64   = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData  = atob(base64);
  const buf = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) buf[i] = rawData.charCodeAt(i);
  return buf.buffer;
}

// Not: kullanıcı kimliği sunucu tarafında oturum çerezinden çözülür; parametre gerekmez.
async function registerWebPush(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return;

  try {
    const registration = await navigator.serviceWorker.ready;

    // İzin iste
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const existing = await registration.pushManager.getSubscription();
    const sub = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch("/api/push/subscribe", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(sub.toJSON()),
    });
  } catch (err) {
    console.error("[PushManager] web push registration error:", err);
  }
}

async function unregisterWebPush(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (!sub) return;
    await fetch("/api/push/subscribe", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
  } catch (err) {
    console.error("[PushManager] web push unregister error:", err);
  }
}

// ── Service Worker Kaydı ──────────────────────────────────────────────────────

async function registerServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (err) {
    console.error("[PushManager] SW registration error:", err);
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PushManager() {
  useEffect(() => {
    // Her zaman service worker'ı kaydet (PWA installability için)
    registerServiceWorker();

    if (typeof window === "undefined") return;

    const isNative = Capacitor.isNativePlatform();
    let disposed = false;
    const handles: Handle[] = [];

    const cleanup = () => {
      disposed = true;
      handles.splice(0).forEach((h) => h.remove().catch(() => {}));
    };

    (async () => {
      try {
        if (isNative) {
          // ── Capacitor native push ──────────────────────────────────────────
          const { PushNotifications } = await import("@capacitor/push-notifications");
          if (disposed) return;

          const initNativePush = async () => {
            try {
              let perm = await PushNotifications.checkPermissions();
              if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
                perm = await PushNotifications.requestPermissions();
              }
              if (perm.receive !== "granted" || disposed) return;
              await PushNotifications.register();
            } catch (err) {
              console.error("[PushManager] native init error:", err);
            }
          };

          const regHandle = await PushNotifications.addListener("registration", async (token) => {
            if (disposed) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (!disposed && user) await upsertTokenWithRetry(token.value, user.id);
          });
          if (disposed) { regHandle.remove(); return; }
          handles.push(regHandle);

          const errHandle = await PushNotifications.addListener("registrationError", (err) => {
            console.error("[PushManager] native registrationError:", err);
          });
          if (disposed) { errHandle.remove(); return; }
          handles.push(errHandle);

          const rcvHandle = await PushNotifications.addListener("pushNotificationReceived", (n) => {
            if (!disposed) console.log("[PushManager] received:", n.title);
          });
          if (disposed) { rcvHandle.remove(); return; }
          handles.push(rcvHandle);

          const actHandle = await PushNotifications.addListener("pushNotificationActionPerformed", (a) => {
            if (!disposed) console.log("[PushManager] action:", a.actionId);
          });
          if (disposed) { actHandle.remove(); return; }
          handles.push(actHandle);

          // Auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (disposed) return;
            if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
              initNativePush();
            } else if (event === "SIGNED_OUT") {
              try {
                const { data: user } = await supabase.auth.getUser();
                if (user?.user) {
                  await supabase.from("push_tokens").delete().eq("user_id", user.user.id);
                }
                await PushNotifications.removeAllDeliveredNotifications();
              } catch (err) {
                console.error("[PushManager] native cleanup error:", err);
              }
            }
          });
          handles.push({ remove: () => Promise.resolve(subscription.unsubscribe()) });

        } else {
          // ── Web Push (tarayıcı) ────────────────────────────────────────────
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (disposed) return;
            if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
              await registerWebPush();
            } else if (event === "SIGNED_OUT") {
              await unregisterWebPush();
            }
          });
          handles.push({ remove: () => Promise.resolve(subscription.unsubscribe()) });

          // Mevcut oturum varsa hemen kaydet
          const { data: { user } } = await supabase.auth.getUser();
          if (!disposed && user) await registerWebPush();
        }

      } catch (err) {
        console.error("[PushManager] setup error:", err);
      }
    })();

    return cleanup;
  }, []);

  return null;
}
