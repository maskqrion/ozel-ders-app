import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { Hoca, RatingStat, SortId, SubjectId, BUDGETS, HOCA_SELECT } from "../teacher.types";

export function useTeacherSearch(currentUserId: string) {
  const [sehir, setSehir] = useState("");
  const [ilce] = useState("");
  const [hocalar, setHocalar] = useState<Hoca[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [ratings, setRatings] = useState<Map<string, RatingStat>>(new Map());
  const [reviewedHocaIds, setReviewedHocaIds] = useState<Set<string>>(new Set());

  const [queryText, setQueryText] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortId>("top");
  const [faves, setFaves] = useState<Set<string>>(new Set());
  const [subjectFilter, setSubjectFilter] = useState<SubjectId>("all");

  const fetchRatings = useCallback(
    async (hocaIds: string[]) => {
      if (hocaIds.length === 0) {
        setRatings(new Map());
        setReviewedHocaIds(new Set());
        return;
      }
      const { data, error } = await supabase
        .from("reviews")
        .select("hoca_id, ogrenci_id, rating")
        .in("hoca_id", hocaIds);
      
      if (error) {
        setRatings(new Map());
        setReviewedHocaIds(new Set());
        return;
      }
      
      const sums = new Map<string, { sum: number; count: number }>();
      const reviewed = new Set<string>();
      
      for (const r of (data ?? []) as Array<{
        hoca_id: string;
        ogrenci_id: string;
        rating: number;
      }>) {
        const cur = sums.get(r.hoca_id) ?? { sum: 0, count: 0 };
        cur.sum += r.rating;
        cur.count += 1;
        sums.set(r.hoca_id, cur);
        if (r.ogrenci_id === currentUserId) reviewed.add(r.hoca_id);
      }
      
      const next = new Map<string, RatingStat>();
      for (const [id, { sum, count }] of sums.entries()) {
        next.set(id, { avg: sum / count, count });
      }
      setRatings(next);
      setReviewedHocaIds(reviewed);
    },
    [currentUserId]
  );

  const fetchHocalar = useCallback(
    async (sehirQ: string, ilceQ: string) => {
      setLoading(true);
      try {
        let q = supabase.from("users").select(HOCA_SELECT).eq("role", "hoca");
        if (sehirQ.trim()) q = q.ilike("sehir", `%${sehirQ.trim()}%`);
        if (ilceQ.trim()) q = q.ilike("ilce", `%${ilceQ.trim()}%`);
        const { data, error } = await q
          .order("level", { ascending: false })
          .order("xp", { ascending: false })
          .limit(60);

        if (error) {
          toast.error("Hocalar yüklenemedi. Lütfen tekrar deneyin.");
          setHocalar([]);
          setRatings(new Map());
          setReviewedHocaIds(new Set());
          return;
        }
        const list = (data as Hoca[]) ?? [];
        setHocalar(list);
        await fetchRatings(list.map((h) => h.id));
      } finally {
        setLoading(false);
        setSearched(true);
      }
    },
    [fetchRatings]
  );

  useEffect(() => {
    fetchHocalar("", "");
  }, [fetchHocalar]);

  const onSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchHocalar(sehir, ilce);
  };

  const temizle = () => {
    setSehir("");
    setQueryText("");
    setBudgetFilter("all");
    setSortBy("top");
    setSubjectFilter("all");
    fetchHocalar("", "");
  };

  const handleReviewSaved = useCallback(async () => {
    await fetchRatings(hocalar.map((h) => h.id));
  }, [fetchRatings, hocalar]);

  const onFav = (id: string) => {
    setFaves((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubjectClick = (id: SubjectId) => {
    setSubjectFilter(id);
    if (id === "sort-top") setSortBy("top");
    else if (id === "sort-level") setSortBy("level-d");
  };

  const filteredHocalar = useMemo(() => {
    let arr = [...hocalar];

    const q = queryText.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (h) =>
          (h.full_name || "").toLowerCase().includes(q) ||
          (h.hakkinda || "").toLowerCase().includes(q) ||
          (h.sehir || "").toLowerCase().includes(q)
      );
    }

    if (
      subjectFilter !== "all" &&
      subjectFilter !== "sort-top" &&
      subjectFilter !== "sort-level"
    ) {
      arr = arr.filter((h) =>
        (h.hakkinda || "").toLowerCase().includes(subjectFilter)
      );
    }

    if (budgetFilter !== "all") {
      const b = BUDGETS.find((x) => x.id === budgetFilter);
      if (b) {
        arr = arr.filter((h) => {
          const p = h.ders_fiyati ?? 0;
          if (b.max != null && p > b.max) return false;
          if (b.min != null && p < b.min) return false;
          return true;
        });
      }
    }

    arr.sort((a, b) => {
      switch (sortBy) {
        case "price-a":
          return (a.ders_fiyati ?? 0) - (b.ders_fiyati ?? 0);
        case "price-d":
          return (b.ders_fiyati ?? 0) - (a.ders_fiyati ?? 0);
        case "level-d":
          return b.level - a.level || b.xp - a.xp;
        default: {
          const ra = ratings.get(a.id)?.avg ?? 0;
          const rb = ratings.get(b.id)?.avg ?? 0;
          return rb - ra;
        }
      }
    });

    return arr;
  }, [hocalar, queryText, subjectFilter, budgetFilter, sortBy, ratings]);

  return {
    hocalar,
    loading,
    searched,
    ratings,
    reviewedHocaIds,
    faves,
    queryText,
    setQueryText,
    budgetFilter,
    setBudgetFilter,
    sortBy,
    setSortBy,
    subjectFilter,
    setSubjectFilter,
    sehir,
    setSehir,
    filteredHocalar,
    onSubmit,
    temizle,
    handleReviewSaved,
    onFav,
    onSubjectClick
  };
}
