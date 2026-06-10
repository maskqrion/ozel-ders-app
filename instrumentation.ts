/**
 * instrumentation.ts — Next.js Instrumentation Hook
 *
 * Next.js App Router'ın sunucu başlangıcında bir kez çalıştırır.
 * Runtime'a göre doğru Sentry config'ini dinamik olarak yükler.
 *
 * onRequestError: Server Component, middleware ve proxy hatalarını Sentry'e iletir.
 * Requires @sentry/nextjs >= 8.28.0 and Next.js 15+.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#register-server-side-sdk
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Server Component render hataları, proxy.ts hataları ve unhandled rejection'ları yakalar.
 * DSN yoksa Sentry init çalışmadığından bu export etkisizdir.
 */
export const onRequestError = Sentry.captureRequestError;
