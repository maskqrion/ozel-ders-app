const AV_COLORS = [
  { from: "#10b981", to: "#065f46" },
  { from: "#38bdf8", to: "#0369a1" },
  { from: "#a78bfa", to: "#6d28d9" },
  { from: "#fb923c", to: "#c2410c" },
  { from: "#f472b6", to: "#be185d" },
  { from: "#4ade80", to: "#166534" },
];

export function avatarColors(id: string) {
  const code = id.charCodeAt(0) + (id.charCodeAt(id.length - 1) || 0);
  return AV_COLORS[code % AV_COLORS.length];
}

export function initials(name: string | null): string {
  if (!name) return "H";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "H"
  );
}

export function isSafeHttpUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
