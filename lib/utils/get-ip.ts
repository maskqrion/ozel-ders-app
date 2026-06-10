/**
 * lib/utils/get-ip.ts
 *
 * Server Action veya API Route içinde çağrılarak istemci IP'sini döndürür.
 * Next.js App Router'ın `headers()` fonksiyonunu kullanır.
 */
import { headers } from "next/headers";

/**
 * İstemci IP adresini okur.
 * Proxy/CDN arkasında çalışırken `x-forwarded-for` başlığına bakar.
 * Bulunamazsa "unknown" döner (rate limit anahtarı olarak kullanılabilir).
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();

  // Vercel / Cloudflare / nginx gibi proxy'lerin eklediği başlıklar
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    // "1.2.3.4, 5.6.7.8" formatında gelebilir; ilk IP gerçek istemcidir
    return forwarded.split(",")[0].trim();
  }

  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
