import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateFamilyMemberRole, useRemoveFamilyMember } from "@/hooks/useFamilyData";
import { toast } from "sonner";
import { Shield, Pencil, Eye, UserCog, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    user_id: string;
    role: string;
  } | null;
  isOwner: boolean;
}

const roleLabels: Record<string, { label: string; icon: React.ElementType }> = {
  admin: { label: "Administrador", icon: Shield },
  editor: { label: "Editor", icon: Pencil },
  viewer: { label: "Visualizador", icon: Eye },
};

export function EditFamilyMemberDialog({ open, onOpenChange, member, isOwner }: Props) {
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const updateRole = useUpdateFamilyMemberRole();
  const removeMember = useRemoveFamilyMember();

  useEffect(() => {
    if (member) setRole(member.role as any);
  }, [member]);

  if (!member) return null;

  const handleSave = async () => {
    try {
      await updateRole.mutateAsync({ id: member.id, role });
      toast.success("Permissão atualizada!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar");
    }
  };

  const handleRemove = async () => {
    if (!confirm("Tem certeza que deseja remover este membro?")) return;
    try {
      await removeMember.mutateAsync(member.id);
      toast.success("Membro removido!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Editar Permissão
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nível de Permissão</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <val.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{val.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="destructive" size="sm" onClick={handleRemove} disabled={removeMember.isPending}>
              <Trash2 className="h-4 w-4 mr-1" /> Remover
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={updateRole.isPending}>Salvar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
