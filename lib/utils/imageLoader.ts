import type { ImageLoaderProps } from "next/image";

export default function supabaseImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src.includes(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "__none__")) {
    return src;
  }

  const url = new URL(src);
  url.searchParams.set("width", String(width));
  url.searchParams.set("quality", String(quality ?? 75));
  return url.toString();
}
