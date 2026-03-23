import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Insight {
  type: "alert" | "tip" | "praise";
  icon: string;
  title: string;
  description: string;
}

export interface FinancialInsightsData {
  health_score: number;
  summary: string;
  insights: Insight[];
}

export function useFinancialInsights() {
  const { user } = useAuth();

  return useQuery<FinancialInsightsData>({
    queryKey: ["financial-insights", user?.id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("financial-insights", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      return response.data as FinancialInsightsData;
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
