"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Production'da yeni SW versiyonunu hemen al; dev'de cache karışmasın diye yine register edip skipWaiting'e güveniyoruz.
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Sessiz başarısızlık — SW olmasa da uygulama çalışmaya devam eder.
      });
  }, []);

  return null;
}
