export type ScoreTone = "emerald" | "sky" | "amber";

export type ScorePalette = {
  tone: ScoreTone;
  bg: string;
  text: string;
  border: string;
  ringStroke: string;
  trackStroke: string;
  sliderAccent: string;
  label: string;
};

export function scoreTone(score: number): ScoreTone {
  if (score >= 80) return "emerald";
  if (score >= 50) return "sky";
  return "amber";
}

export function scorePalette(score: number): ScorePalette {
  const tone = scoreTone(score);
  if (tone === "emerald") {
    return {
      tone,
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
      ringStroke: "stroke-emerald-500",
      trackStroke: "stroke-emerald-100",
      sliderAccent: "accent-emerald-500",
      label: "Mükemmel",
    };
  }
  if (tone === "sky") {
    return {
      tone,
      bg: "bg-sky-100",
      text: "text-sky-700",
      border: "border-sky-200",
      ringStroke: "stroke-sky-500",
      trackStroke: "stroke-sky-100",
      sliderAccent: "accent-sky-500",
      label: "Geçer",
    };
  }
  return {
    tone,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    ringStroke: "stroke-amber-500",
    trackStroke: "stroke-amber-100",
    sliderAccent: "accent-amber-500",
    label: "Gelişim Lazım",
  };
}
