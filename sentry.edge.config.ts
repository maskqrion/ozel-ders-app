/**
 * sentry.edge.config.ts — Edge runtime Sentry başlatma
 *
 * proxy.ts (middleware) ve Edge Route Handler'larda çalışır.
 * @sentry/nextjs otomatik olarak Edge runtime'ı algılar.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Edge runtime'da trace örnekleme oranı
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Ortam etiketi
    environment: process.env.NODE_ENV,

    debug: false,
  });
}
