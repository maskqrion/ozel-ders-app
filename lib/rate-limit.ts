/**
 * Rate Limiter — lib/rate-limit.ts
 *
 * Supabase check_rate_limit() RPC'si üzerinden sliding-window rate limiting.
 * Her serverless instance aynı veritabanını gördüğünden cross-instance güvenlidir.
 * Supabase bağlantısı başarısız olursa in-memory fallback devreye girer (dev only).
 */

import { createServiceRoleServer } from "@/lib/supabase/server";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
  retryAfterMessage: string;
}

function buildRetryMessage(seconds: number): string {
  if (seconds < 60) {
    return `Çok fazla deneme yaptınız. Lütfen ${seconds} saniye bekleyin.`;
  }
  return `Çok fazla deneme yaptınız. Lütfen ${Math.ceil(seconds / 60)} dakika bekleyin.`;
}

// ── In-memory fallback (yalnızca geliştirme/DB erişilemez durumunda) ──────────
interface WindowEntry { timestamps: number[] }
const memStore = new Map<string, WindowEntry>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memStore.entries()) {
      if (!entry.timestamps.length || now - entry.timestamps.at(-1)! > 3_600_000) {
        memStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function inMemoryRateLimit(
  identifier: string,
  limit: number,
  windowSecs: number,
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSecs * 1000;
  const cutoff = now - windowMs;
  let entry = memStore.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    memStore.set(identifier, entry);
  }
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
  if (entry.timestamps.length >= limit) {
    const retryAfterSeconds = Math.ceil((entry.timestamps[0] + windowMs - now) / 1000);
    return { success: false, remaining: 0, retryAfterSeconds, retryAfterMessage: buildRetryMessage(retryAfterSeconds) };
  }
  entry.timestamps.push(now);
  return { success: true, remaining: limit - entry.timestamps.length, retryAfterSeconds: 0, retryAfterMessage: "" };
}

// ── Ana rate limit fonksiyonu ─────────────────────────────────────────────────

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSecs: number,
): Promise<RateLimitResult> {
  try {
    const supabase = createServiceRoleServer();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_limit:      limit,
      p_window_ms:  windowSecs * 1000,
    });

    if (error || !data || data.length === 0) {
      // DB erişilemez — fallback
      return inMemoryRateLimit(identifier, limit, windowSecs);
    }

    const row = data[0] as { allowed: boolean; remaining: number; retry_after_ms: number };
    const retryAfterSeconds = Math.ceil((row.retry_after_ms ?? 0) / 1000);

    return {
      success:            row.allowed,
      remaining:          row.remaining ?? 0,
      retryAfterSeconds,
      retryAfterMessage:  row.allowed ? "" : buildRetryMessage(retryAfterSeconds),
    };
  } catch {
    return inMemoryRateLimit(identifier, limit, windowSecs);
  }
}
