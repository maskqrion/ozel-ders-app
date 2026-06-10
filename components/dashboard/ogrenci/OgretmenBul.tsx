"use client";

import { useState } from "react";
import HocayiDegerlendirModal from "@/components/dashboard/ogrenci/HocayiDegerlendirModal";
import VideoPlayer from "@/components/dashboard/shared/VideoPlayer";
import RezervasyonMatrisi from "@/components/dashboard/ogrenci/RezervasyonMatrisi";

import { Hoca } from "./teacher.types";
import { useTeacherSearch } from "./hooks/useTeacherSearch";
import { TeacherHero } from "./TeacherHero";
import { TeacherFilters } from "./TeacherFilters";
import { TeacherGrid } from "./TeacherGrid";

export default function OgretmenBul({ currentUserId }: { currentUserId: string }) {
  const search = useTeacherSearch(currentUserId);

  const [reviewTarget, setReviewTarget] = useState<Hoca | null>(null);
  const [videoTarget, setVideoTarget] = useState<Hoca | null>(null);
  const [rezervasyonTarget, setRezervasyonTarget] = useState<Hoca | null>(null);

  const heroImages = search.hocalar
    .filter((h) => h.avatar_url)
    .slice(0, 4)
    .map((h) => h.avatar_url as string);

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #030711 0%, #0a1628 55%, #071a14 100%)",
      }}
    >
      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative px-6 pt-10 pb-7 z-10">
        <TeacherHero 
          teacherCount={search.hocalar.length} 
          teacherAvatars={heroImages} 
        />
        
        <TeacherFilters
          queryText={search.queryText}
          onQueryChange={search.setQueryText}
          sehir={search.sehir}
          onSehirChange={search.setSehir}
          budgetFilter={search.budgetFilter}
          onBudgetChange={search.setBudgetFilter}
          subjectFilter={search.subjectFilter}
          onSubjectChange={search.onSubjectClick}
          sortBy={search.sortBy}
          onSortChange={search.setSortBy}
          onSubmit={search.onSubmit}
          resultCount={search.filteredHocalar.length}
          favoritesCount={search.faves.size}
          isLoading={search.loading}
          hasSearched={search.searched}
        />
      </div>

      <TeacherGrid
        teachers={search.filteredHocalar}
        ratings={search.ratings}
        faves={search.faves}
        reviewedIds={search.reviewedHocaIds}
        loading={search.loading}
        searched={search.searched}
        onClear={search.temizle}
        onFav={search.onFav}
        onReview={setReviewTarget}
        onBookLesson={setRezervasyonTarget}
        onOpenVideo={setVideoTarget}
      />

      {/* Modals */}
      <HocayiDegerlendirModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        hocaId={reviewTarget?.id ?? ""}
        hocaAdi={reviewTarget?.full_name || "Hoca"}
        ogrenciId={currentUserId}
        onSaved={search.handleReviewSaved}
      />
      <VideoPlayer
        open={!!videoTarget}
        onClose={() => setVideoTarget(null)}
        url={videoTarget?.video_url ?? null}
        title={videoTarget?.full_name ? `${videoTarget.full_name} — Tanıtım` : undefined}
      />
      <RezervasyonMatrisi
        open={!!rezervasyonTarget}
        onClose={() => setRezervasyonTarget(null)}
        hoca={rezervasyonTarget}
        currentUserId={currentUserId}
        rating={rezervasyonTarget ? search.ratings.get(rezervasyonTarget.id) : undefined}
      />
    </div>
  );
}
