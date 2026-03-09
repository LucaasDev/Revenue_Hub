import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateGoal, useDeleteGoal } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  goal: Tables<"goals"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGoalDialog({ goal, open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(String(goal.target_amount));
      setCurrentAmount(String(goal.current_amount));
      setDeadline(goal.deadline);
    }
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !name.trim()) return;
    updateGoal.mutate(
      { id: goal.id, name: name.trim(), target_amount: parseFloat(targetAmount), current_amount: parseFloat(currentAmount) || 0, deadline },
      { onSuccess: () => { toast.success("Meta atualizada!"); onOpenChange(false); }, onError: () => toast.error("Erro ao atualizar") }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Meta</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Alvo (R$)</Label>
              <Input type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Valor Atual (R$)</Label>
              <Input type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Data Limite</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={updateGoal.isPending}>
              {updateGoal.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="destructive" size="icon" onClick={() => {
              if (!goal) return;
              deleteGoal.mutate(goal.id, { onSuccess: () => { toast.success("Meta excluída"); onOpenChange(false); } });
            }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
