import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Lesson, LessonStatus, Role } from "@/lib/types";
import { QUERY_STALE } from "@/lib/constants";

const LESSON_SELECT = `
  id, hoca_id, ogrenci_id, lesson_date, status,
  users!lessons_ogrenci_id_fkey(email)
`;

export function useLessons(userId?: string, role?: Role) {
  return useQuery<Lesson[]>({
    queryKey: ["lessons", userId, role],
    enabled: !!userId,
    staleTime: QUERY_STALE.LESSONS,
    queryFn: async () => {
      const col = role === "hoca" ? "hoca_id" : "ogrenci_id";
      const { data, error } = await supabase
        .from("lessons")
        .select(LESSON_SELECT)
        .eq(col, userId!)
        .order("lesson_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Lesson[];
    },
  });
}

export function useUpdateLessonStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LessonStatus }) => {
      const { error } = await supabase
        .from("lessons")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
