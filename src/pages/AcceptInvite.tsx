import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Wallet, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (!token) return;
    supabase
      .from("invites")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) {
          setValid(false);
          return;
        }
        if (new Date(data.expires_at) < new Date()) {
          setValid(false);
          return;
        }
        setValid(true);
        setEmail(data.email);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Senhas não conferem");
      return;
    }
    setSubmitting(true);

    // Create user account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      setSubmitting(false);
      return;
    }

    // Update invite status
    await supabase
      .from("invites")
      .update({ status: "accepted" as const })
      .eq("token", token!);

    // Add user role
    if (signUpData.user) {
      await supabase.from("user_roles").insert({
        user_id: signUpData.user.id,
        role: "user" as const,
      });
    }

    toast.success("Conta criada com sucesso!");
    navigate("/login");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Verificando convite...</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          <h1 className="text-xl font-bold text-foreground mb-2">Convite inválido</h1>
          <p className="text-sm text-muted-foreground">Este convite expirou ou já foi utilizado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Criar Conta</h1>
            <p className="text-sm text-muted-foreground">Defina sua senha para acessar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} disabled className="opacity-60" />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              <UserPlus className="h-4 w-4" /> {submitting ? "Criando..." : "Criar Conta"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AcceptInvite;
