import { useState, useRef, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown, Check, SlidersHorizontal, Heart } from "lucide-react";
import { Budget, SortId, SubjectId, BUDGETS, SORTS, SUBJECTS } from "./teacher.types";

function BudgetDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const active = BUDGETS.find((b) => b.id === value);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3.5 h-9 rounded-xl border text-sm font-semibold transition-all duration-200 ${
          open
            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
            : "border-white/10 bg-white/[0.05] text-white/50 hover:border-white/20 hover:text-white/75"
        }`}
      >
        <SlidersHorizontal size={13} strokeWidth={2} />
        <span className="hidden sm:inline max-w-[90px] truncate">
          {active?.label ?? "Bütçe"}
        </span>
        <ChevronDown
          size={13}
          strokeWidth={2}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 mt-2 w-44 rounded-2xl border border-white/10 bg-[#0d1f38]/95 backdrop-blur-xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.9)] p-1.5 z-30"
          >
            {BUDGETS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onChange(b.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  value === b.id
                    ? "bg-emerald-500/15 text-emerald-300 font-semibold"
                    : "text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                }`}
              >
                {b.label}
                {value === b.id && (
                  <Check size={13} strokeWidth={3} className="text-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortMenu({
  value,
  onChange,
}: {
  value: SortId;
  onChange: (v: SortId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const active = SORTS.find((s) => s.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3.5 h-9 rounded-xl border border-white/10 bg-white/[0.04] hover:border-white/20 text-sm font-semibold text-white/50 hover:text-white/75 transition-all duration-200"
      >
        <SlidersHorizontal size={13} strokeWidth={2} />
        <span className="hidden sm:inline">{active?.label}</span>
        <ChevronDown
          size={13}
          strokeWidth={2}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[#0d1f38]/95 backdrop-blur-xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.9)] p-1.5 z-30"
          >
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  value === s.id
                    ? "bg-emerald-500/15 text-emerald-300 font-semibold"
                    : "text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                }`}
              >
                {s.label}
                {value === s.id && (
                  <Check size={13} strokeWidth={3} className="text-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TeacherFiltersProps {
  queryText: string;
  onQueryChange: (v: string) => void;
  sehir: string;
  onSehirChange: (v: string) => void;
  budgetFilter: string;
  onBudgetChange: (v: string) => void;
  subjectFilter: SubjectId;
  onSubjectChange: (id: SubjectId) => void;
  sortBy: SortId;
  onSortChange: (v: SortId) => void;
  onSubmit: (e?: React.FormEvent) => void;
  resultCount: number;
  favoritesCount: number;
  isLoading: boolean;
  hasSearched: boolean;
}

export function TeacherFilters({
  queryText,
  onQueryChange,
  sehir,
  onSehirChange,
  budgetFilter,
  onBudgetChange,
  subjectFilter,
  onSubjectChange,
  sortBy,
  onSortChange,
  onSubmit,
  resultCount,
  favoritesCount,
  isLoading,
  hasSearched,
}: TeacherFiltersProps) {
  return (
    <>
      {/* Search bar */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-7 max-w-2xl mx-auto z-20"
      >
        <div
          className="absolute inset-0 rounded-2xl opacity-0 focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            filter: "blur(28px)",
            background:
              "radial-gradient(ellipse at 50% 120%, rgba(16,185,129,0.28), transparent 70%)",
          }}
        />
        <form
          onSubmit={onSubmit}
          className="relative flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-white/[0.06] backdrop-blur-xl px-5 h-14 focus-within:border-emerald-400/40 focus-within:shadow-[0_0_0_3px_rgba(52,211,153,0.10)] transition-all duration-300"
        >
          <Search size={18} strokeWidth={2} className="text-white/30 shrink-0" />
          <input
            value={queryText}
            onChange={(e) => {
              onQueryChange(e.target.value);
              onSehirChange(e.target.value);
            }}
            placeholder="İsim, uzmanlık alanı veya şehir ara..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
          />
          {queryText && (
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
                onSehirChange("");
              }}
              className="text-white/25 hover:text-white/55 transition-colors shrink-0"
            >
              <X size={15} strokeWidth={2} />
            </button>
          )}
          <div className="h-6 w-px bg-white/[0.08] shrink-0" />
          <BudgetDropdown value={budgetFilter} onChange={onBudgetChange} />
        </form>
      </m.div>

      {/* Subject pill filters */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 flex items-center gap-1.5 flex-wrap justify-center relative z-20"
      >
        {SUBJECTS.map((s) => {
          const isActive = subjectFilter === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSubjectChange(s.id)}
              className="relative px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150"
            >
              {isActive && (
                <m.span
                  layoutId="subject-pill-active"
                  className="absolute inset-0 rounded-full border border-emerald-400/40 bg-emerald-500/15"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={`relative transition-colors duration-150 ${
                  isActive
                    ? "text-emerald-300"
                    : "text-white/35 hover:text-white/65"
                }`}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </m.div>

      <div className="mx-6 mt-7 h-px bg-white/[0.05]" />

      {/* Results bar */}
      <AnimatePresence>
        {!isLoading && hasSearched && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between gap-3 px-6 py-3.5"
          >
            <div className="text-sm text-white/35">
              <span className="font-black text-white/65">{resultCount}</span> eğitmen
              {sehir && (
                <span>
                  {" "}
                  · <span className="font-semibold text-white/50">{sehir}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {favoritesCount > 0 && (
                <span className="text-xs text-white/30 flex items-center gap-1 border border-white/[0.06] rounded-lg px-2.5 py-1">
                  <Heart size={11} strokeWidth={2} className="text-rose-400" />
                  {favoritesCount} favori
                </span>
              )}
              <SortMenu value={sortBy} onChange={onSortChange} />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
