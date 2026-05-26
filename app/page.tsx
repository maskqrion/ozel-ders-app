import { createServer } from '@/lib/supabase/server';
import LandingPage, { type TopTutor, type ReviewItem } from './_components/LandingPage';

export default async function Page() {
  const supabase = await createServer();

  const [hocaRes, lessonRes, tutorsRes, reviewsRes] = await Promise.all([
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'hoca'),
    supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'tamamlandi'),
    supabase
      .from('users')
      .select('id, full_name, avatar_url, hakkinda, xp, level, sehir')
      .eq('role', 'hoca')
      .order('xp', { ascending: false })
      .limit(4),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, ogrenci_id')
      .gte('rating', 4)
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  const hocaCount = hocaRes.count ?? 0;
  const lessonCount = lessonRes.count ?? 0;

  // Cast tutor rows — columns confirmed in generated schema
  const topTutors = (tutorsRes.data ?? []) as TopTutor[];

  // Fetch reviewer names in a single IN query
  const rawReviews = reviewsRes.data ?? [];
  const ogrenciIds = [
    ...new Set(
      rawReviews
        .map((r) => r.ogrenci_id)
        .filter((id): id is string => typeof id === 'string'),
    ),
  ];

  const nameMap: Record<string, string | null> = {};
  if (ogrenciIds.length > 0) {
    const { data: profiles } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', ogrenciIds);
    for (const p of profiles ?? []) {
      nameMap[p.id] = p.full_name;
    }
  }

  const reviews: ReviewItem[] = rawReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    ogrenci_name: r.ogrenci_id != null ? (nameMap[r.ogrenci_id] ?? null) : null,
  }));

  return (
    <LandingPage
      hocaCount={hocaCount}
      lessonCount={lessonCount}
      topTutors={topTutors}
      reviews={reviews}
    />
  );
}
