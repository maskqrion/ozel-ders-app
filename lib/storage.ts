import { supabase } from "./supabase";

const BUCKET = "kaynaklar";
const DEFAULT_TTL_SECONDS = 60 * 60;

export async function attachSignedUrls<T>(
  items: T[],
  pathKey: string,
  urlKey: string,
  expiresIn: number = DEFAULT_TTL_SECONDS,
): Promise<T[]> {
  const paths = items
    .map((i) => (i as any)[pathKey])
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  if (paths.length === 0) {
    return items.map((i) => ({ ...(i as any), [urlKey]: null })) as T[];
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, expiresIn);

  if (error || !data) {
    return items.map((i) => ({ ...(i as any), [urlKey]: null })) as T[];
  }

  const urlByPath = new Map<string, string>();
  for (const row of data) {
    if (row.path && row.signedUrl) urlByPath.set(row.path, row.signedUrl);
  }

  return items.map((i) => {
    const path = (i as any)[pathKey];
    const url = path ? urlByPath.get(path) ?? null : null;
    return { ...(i as any), [urlKey]: url };
  }) as T[];
}
