import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Ensure user has a family group (auto-create if needed)
export function useEnsureFamily() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["family-id", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ensure_user_family", { _user_id: user!.id });
      if (error) throw error;
      return data as string;
    },
    enabled: !!user,
  });
}

// Get family members with user info
export function useFamilyMembers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["family-members", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("joined_at");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Get family invites
export function useFamilyInvites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["family-invites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_invites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Get family group info
export function useFamilyGroup() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["family-group", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_groups")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Create family invite
export function useCreateFamilyInvite() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (invite: { email: string; name: string; role: "admin" | "editor" | "viewer" }) => {
      // Get family id
      const { data: familyId } = await supabase.rpc("ensure_user_family", { _user_id: user!.id });
      const { data, error } = await supabase
        .from("family_invites")
        .insert({
          family_id: familyId,
          invited_by: user!.id,
          email: invite.email,
          name: invite.name,
          role: invite.role,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family-invites"] }),
  });
}

// Update member role
export function useUpdateFamilyMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "admin" | "editor" | "viewer" }) => {
      const { error } = await supabase
        .from("family_members")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family-members"] }),
  });
}

// Remove family member
export function useRemoveFamilyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("family_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family-members"] }),
  });
}

// Cancel invite
export function useCancelFamilyInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("family_invites")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family-invites"] }),
  });
}

// Resend invite (reset expiration)
export function useResendFamilyInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);
      const { error } = await supabase
        .from("family_invites")
        .update({ 
          status: "pending",
          expires_at: newExpiry.toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family-invites"] }),
  });
}
