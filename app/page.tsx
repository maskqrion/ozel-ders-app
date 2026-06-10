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
      .select('id, rating, comment, created_at, ogrenci_id, users!ogrenci_id(full_name)')
      .gte('rating', 4)
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  const hocaCount = hocaRes.count ?? 0;
  const lessonCount = lessonRes.count ?? 0;

  // Cast tutor rows — columns confirmed in generated schema
  const topTutors = (tutorsRes.data ?? []) as TopTutor[];

  type RawReviewRow = {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    ogrenci_id: string;
    users: { full_name: string | null } | null;
  };
  const rawReviews = (reviewsRes.data ?? []) as unknown as RawReviewRow[];
  const reviews: ReviewItem[] = rawReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    ogrenci_name: r.users?.full_name ?? null,
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
