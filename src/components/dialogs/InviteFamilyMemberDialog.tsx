import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateFamilyInvite } from "@/hooks/useFamilyData";
import { toast } from "sonner";
import { UserPlus, Shield, Pencil, Eye } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleDescriptions = {
  admin: { label: "Administrador", desc: "Acesso total ao sistema", icon: Shield },
  editor: { label: "Editor", desc: "Pode criar e editar transações", icon: Pencil },
  viewer: { label: "Visualizador", desc: "Apenas visualização", icon: Eye },
};

export function InviteFamilyMemberDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const createInvite = useCreateFamilyInvite();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      await createInvite.mutateAsync({ name: name.trim(), email: email.trim(), role });
      toast.success("Convite enviado com sucesso!");
      setName("");
      setEmail("");
      setRole("editor");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar convite");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Adicionar Membro
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input placeholder="Nome do membro" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Nível de Permissão</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(roleDescriptions) as [string, typeof roleDescriptions.admin][]).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <val.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{val.label}</span>
                      <span className="text-xs text-muted-foreground">— {val.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createInvite.isPending}>
              {createInvite.isPending ? "Enviando..." : "Enviar Convite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
