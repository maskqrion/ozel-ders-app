import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";
import { QUERY_STALE } from "@/lib/constants";

export function useProfile() {
  return useQuery<UserProfile | null>({
    queryKey: ["profile"],
    staleTime: QUERY_STALE.PROFILE,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
  });
}
