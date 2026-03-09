import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateCategory, useDeleteCategory } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  category: Tables<"categories"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({ category, open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"receita" | "despesa">("despesa");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#10b981");
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setIcon(category.icon);
      setColor(category.color);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !name.trim()) return;
    updateCategory.mutate(
      { id: category.id, name: name.trim(), type, icon, color },
      { onSuccess: () => { toast.success("Categoria atualizada!"); onOpenChange(false); }, onError: () => toast.error("Erro ao atualizar") }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Categoria</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ícone (emoji)</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={updateCategory.isPending}>
              {updateCategory.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="destructive" size="icon" onClick={() => {
              if (!category) return;
              deleteCategory.mutate(category.id, { onSuccess: () => { toast.success("Categoria excluída"); onOpenChange(false); } });
            }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
