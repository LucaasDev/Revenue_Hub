import { useState } from "react";
import { motion } from "framer-motion";
import { User, Shield, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updates: any = { data: { display_name: displayName } };
      if (email !== user?.email) updates.email = email;
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      toast.success("Perfil atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar perfil");
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
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações de conta</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{displayName || user?.email}</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Shield className="h-3.5 w-3.5" /> {isAdmin ? "Admin" : "Usuário"}
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-border/50">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" disabled={savingProfile} className="gap-2">
            <Save className="h-4 w-4" /> {savingProfile ? "Salvando..." : "Salvar Perfil"}
          </Button>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Alterar Senha</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label>Nova Senha</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <Button type="submit" disabled={savingPassword} variant="secondary" className="gap-2">
            <Save className="h-4 w-4" /> {savingPassword ? "Alterando..." : "Alterar Senha"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
