/**
 * sentry.server.config.ts — Node.js server tarafı Sentry başlatma
 *
 * instrumentation.ts üzerinden register() çağrıldığında dinamik olarak import edilir.
 * Server Action, Route Handler ve Server Component hatalarını yakalar.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Development'ta %100, production'da %10 trace örneği
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Ortam etiketi
    environment: process.env.NODE_ENV,

    // Server-side debug logları (development'ta bile kapalı bırakın üretimde)
    debug: false,

    // Belirli hataları görmezden gelme örnekleri:
    // ignoreErrors: ["ChunkLoadError"],
  });
}
