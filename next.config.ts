import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // camera ve microphone Jitsi video görüşmeleri için açık bırakılmıştır
    value: "geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // meet.jit.si external_api.js yüklemesi için gerekli
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://meet.jit.si",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      // Jitsi Meet + YouTube (nocookie) + Vimeo iframes
      "frame-src 'self' https://meet.jit.si https://www.youtube-nocookie.com https://player.vimeo.com",
      // WebRTC + Supabase + Sentry
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://o0.ingest.sentry.io https://meet.jit.si wss://meet.jit.si",
      // Jitsi video/audio stream
      "media-src 'self' blob: https://meet.jit.si",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // output: "export",  <-- Bu satırı tamamen sil veya başına // koy
  images: {
    loader: "custom",
    loaderFile: "./lib/utils/imageLoader.ts",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organizasyon ve proje slug'ları (.env'den okunur)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Source map yüklemeyi yalnızca CI ortamında yap (local build'leri hızlandırır)
  silent: !process.env.CI,

  // Source map yükleme için auth token (opsiyonel — CI'da SENTRY_AUTH_TOKEN olarak set edin)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Daha okunabilir stack trace için daha fazla source map yükle
  widenClientFileUpload: true,

  // Sentry bundle'ı production'da ağaçlandır (tree-shake)
  disableLogger: true,

  // Tunnel: Sentry event'lerini kendi sunucunuzdan geçirir (ad blocker bypass)
  // Aktifleştirmek için: proxy.ts matcher'a "sentry-tunnel" istisnası ekleyin
  // tunnelRoute: "/sentry-tunnel",
});