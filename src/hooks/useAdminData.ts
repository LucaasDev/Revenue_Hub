import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AdminStats {
  total_tenants: number;
  total_users: number;
  total_transactions: number;
  total_goals: number;
}

interface AdminTenant {
  id: string;
  name: string;
  status: string;
  plan: string;
  created_at: string;
  owner_email: string;
  member_count: number;
  transaction_count: number;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  display_name: string | null;
  banned_until: string | null;
  is_active: boolean;
  tenant_name: string | null;
  tenant_id: string | null;
}

interface GrowthData {
  month: string;
  user_count: number;
}

export function useAdminStats() {
  const { isGlobalAdmin } = useAuth();
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_stats");
      if (error) throw error;
      return data as unknown as AdminStats;
    },
    enabled: isGlobalAdmin,
  });
}

export function useAdminTenants() {
  const { isGlobalAdmin } = useAuth();
  return useQuery<AdminTenant[]>({
    queryKey: ["admin", "tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_tenants");
      if (error) throw error;
      return (data as unknown as AdminTenant[]) ?? [];
    },
    enabled: isGlobalAdmin,
  });
}

export function useAdminUsers() {
  const { isGlobalAdmin } = useAuth();
  return useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_users");
      if (error) throw error;
      return (data as unknown as AdminUser[]) ?? [];
    },
    enabled: isGlobalAdmin,
  });
}

export function useAdminGrowth() {
  const { isGlobalAdmin } = useAuth();
  return useQuery<GrowthData[]>({
    queryKey: ["admin", "growth"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_growth");
      if (error) throw error;
      return (data as unknown as GrowthData[]) ?? [];
    },
    enabled: isGlobalAdmin,
  });
}

export function useToggleUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase.rpc("admin_toggle_user", {
        _target_user_id: userId,
        _active: active,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
