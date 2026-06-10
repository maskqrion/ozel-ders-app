import { m, AnimatePresence } from "framer-motion";

interface AIQuizPanelProps {
  aiOpen: boolean;
  setAiOpen: React.Dispatch<React.SetStateAction<boolean>>;
  aiTopic: string;
  setAiTopic: (v: string) => void;
  aiCount: number;
  setAiCount: (v: number) => void;
  aiDifficulty: "kolay" | "orta" | "zor";
  setAiDifficulty: (v: "kolay" | "orta" | "zor") => void;
  isGenerating: boolean;
  handleAiGenerate: () => void;
  aiInputRef: React.RefObject<HTMLInputElement | null>;
  addQuestion: () => void;
}

export function AIQuizPanel({
  aiOpen,
  setAiOpen,
  aiTopic,
  setAiTopic,
  aiCount,
  setAiCount,
  aiDifficulty,
  setAiDifficulty,
  isGenerating,
  handleAiGenerate,
  aiInputRef,
  addQuestion,
}: AIQuizPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <m.button
          type="button"
          onClick={addQuestion}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <span aria-hidden>＋</span>
          Yeni Soru Ekle
        </m.button>
        <m.button
          type="button"
          onClick={() => setAiOpen((v) => !v)}
          whileTap={{ scale: 0.98 }}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 bg-accent hover:bg-accent-hover"
        >
          {isGenerating ? (
            <>
              <m.span
                aria-hidden
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white"
              />
              Üretiliyor...
            </>
          ) : (
            <>
              <span aria-hidden>✨</span>
              Yapay Zeka ile Üret
            </>
          )}
        </m.button>
      </div>

      <AnimatePresence initial={false}>
        {aiOpen && (
          <m.div
            key="ai-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 rounded-xl border border-orange-200 bg-orange-50/60 p-3">
              <input
                ref={aiInputRef}
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAiGenerate();
                  if (e.key === "Escape") setAiOpen(false);
                }}
                placeholder="Konu girin (örn. Trigonometri, Osmanlı Tarihi...)"
                disabled={isGenerating}
                className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:opacity-60"
              />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500 whitespace-nowrap">Soru sayısı:</label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    disabled={isGenerating}
                    className="rounded-md border border-orange-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-orange-400 disabled:opacity-60"
                  >
                    {[3, 5, 8, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500">Zorluk:</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as "kolay" | "orta" | "zor")}
                    disabled={isGenerating}
                    className="rounded-md border border-orange-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-orange-400 disabled:opacity-60"
                  >
                    <option value="kolay">Kolay</option>
                    <option value="orta">Orta</option>
                    <option value="zor">Zor</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isGenerating || !aiTopic.trim()}
                  className="ml-auto shrink-0 rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Üret ve Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setAiOpen(false)}
                  className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Kapat"
                >
                  ✕
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
