import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { gradeAssignment, rejectAssignment } from "@/app/actions/assignments";
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
      clearSubmission,
    }: {
      id: string;
      status: AssignmentStatus;
      rejectionReason?: string;
      score?: number;
      clearSubmission?: boolean;
    }) => {
      if (status === "yapildi" && score !== undefined) {
        const result = await gradeAssignment(id, score);
        if (result.error) throw new Error(result.error);
      } else if (status === "reddedildi") {
        const result = await rejectAssignment(id, rejectionReason ?? "", clearSubmission ?? false);
        if (result.error) throw new Error(result.error);
      } else {
        type AssignmentUpdate = {
          status: AssignmentStatus;
          rejection_reason: string | null;
          score: number | null;
          submission_text?: null;
          submission_file_path?: null;
          submitted_at?: null;
        };
        const updates: AssignmentUpdate = {
          status,
          rejection_reason: rejectionReason ?? null,
          score: score ?? null,
          ...(clearSubmission
            ? { submission_text: null, submission_file_path: null, submitted_at: null }
            : {}),
        };
        const { error } = await supabase
          .from("assignments")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onMutate: async ({ id, status, rejectionReason, score, clearSubmission }) => {
      await queryClient.cancelQueries({ queryKey: ["assignments"] });
      const cachedQueries = queryClient.getQueriesData<Assignment[]>({ queryKey: ["assignments"] });
      queryClient.setQueriesData<Assignment[]>({ queryKey: ["assignments"] }, (old) =>
        old?.map((a) =>
          a.id === id
            ? {
                ...a,
                status,
                rejection_reason: rejectionReason ?? null,
                score: score ?? null,
                ...(clearSubmission
                  ? { submission_text: null, submission_file_path: null, submitted_at: null }
                  : {}),
              }
            : a
        ) ?? []
      );
      return { cachedQueries };
    },
    onError: (_err, _vars, context) => {
      context?.cachedQueries.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
