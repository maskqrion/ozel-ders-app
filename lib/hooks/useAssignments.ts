import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Assignment, AssignmentStatus, Role } from "@/lib/types";
import { QUERY_STALE } from "@/lib/constants";

const ASSIGNMENT_SELECT = `
  id, lesson_id, title, description, status,
  submission_text, submission_file_path, submitted_at,
  rejection_reason, score,
  lessons!inner(hoca_id, ogrenci_id, lesson_date,
    users!lessons_hoca_id_fkey(email))
`;

export function useAssignments(userId?: string, role?: Role) {
  return useQuery<Assignment[]>({
    queryKey: ["assignments", userId, role],
    enabled: !!userId,
    staleTime: QUERY_STALE.ASSIGNMENTS,
    queryFn: async () => {
      const col = role === "hoca" ? "lessons.hoca_id" : "lessons.ogrenci_id";
      const { data, error } = await supabase
        .from("assignments")
        .select(ASSIGNMENT_SELECT)
        .eq(col, userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Assignment[];
    },
  });
}

export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejectionReason,
      score,
    }: {
      id: string;
      status: AssignmentStatus;
      rejectionReason?: string;
      score?: number;
    }) => {
      const { error } = await supabase
        .from("assignments")
        .update({ status, rejection_reason: rejectionReason ?? null, score: score ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
