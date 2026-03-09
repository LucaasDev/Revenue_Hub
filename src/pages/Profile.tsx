import { motion } from "framer-motion";
import { User, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Profile = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Lucas Silva</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Shield className="h-3.5 w-3.5" /> Admin
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input defaultValue="Lucas Silva" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue="lucas@email.com" type="email" />
          </div>
        </div>

        <Button>Salvar Alterações</Button>
      </motion.div>
    </div>
  );
};

export default Profile;
