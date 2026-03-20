import { useState } from "react";
import { motion } from "framer-motion";
import { User, Shield, Save, Mail, Lock, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const userInitials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updates: { data: { display_name: string }; email?: string } = { data: { display_name: displayName } };
      if (email !== user?.email) updates.email = email;
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      toast.success("Perfil atualizado!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar perfil";
      toast.error(errorMessage);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("A nova senha deve ter pelo menos 6 caracteres");
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha alterada!");
      setNewPassword("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao alterar senha";
      toast.error(errorMessage);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Meu Perfil</h1>
        <p className="mt-1 text-muted-foreground">Gerencie suas informacoes de conta</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card overflow-hidden"
      >
        {/* Profile Header */}
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 pb-16">
          <div className="absolute -bottom-10 left-6">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-4 border-background">
                <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pt-14 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{displayName || user?.email?.split("@")[0]}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              isAdmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <Shield className="h-3 w-3" />
              {isAdmin ? "Admin" : "Usuario"}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5 border-t border-border pt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <Button type="submit" disabled={savingProfile} className="h-10 gap-2">
              <Save className="h-4 w-4" />
              {savingProfile ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </form>
        </div>
      </motion.div>

      {/* Security Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border bg-card p-6"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <Lock className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Seguranca</h3>
            <p className="text-xs text-muted-foreground">Altere sua senha</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium">Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
                className="h-11 pl-10"
              />
            </div>
          </div>

          <Button type="submit" disabled={savingPassword} variant="secondary" className="h-10 gap-2">
            <Save className="h-4 w-4" />
            {savingPassword ? "Alterando..." : "Alterar Senha"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
