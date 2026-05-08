import { supabase } from "./supabase";

const BUCKET = "kaynaklar";
const DEFAULT_TTL_SECONDS = 60 * 60;

export async function attachSignedUrls<
  T extends object,
  U extends string,
>(
  items: T[],
  pathKey: keyof T,
  urlKey: U,
  expiresIn: number = DEFAULT_TTL_SECONDS,
): Promise<Array<T & { [P in U]: string | null }>> {
  type Out = T & { [P in U]: string | null };

  const readPath = (i: T): string | null => {
    const v = i[pathKey];
    return typeof v === "string" && v.length > 0 ? v : null;
  };

  const withUrl = (i: T, url: string | null): Out =>
    ({ ...i, [urlKey]: url } as Out);

  const paths = items.map(readPath).filter((p): p is string => p !== null);

  if (paths.length === 0) {
    return items.map((i) => withUrl(i, null));
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, expiresIn);

  if (error || !data) {
    return items.map((i) => withUrl(i, null));
  }

  const urlByPath = new Map<string, string>();
  for (const row of data) {
    if (row.path && row.signedUrl) urlByPath.set(row.path, row.signedUrl);
  }

  return items.map((i) => {
    const p = readPath(i);
    return withUrl(i, p ? urlByPath.get(p) ?? null : null);
  });
}
