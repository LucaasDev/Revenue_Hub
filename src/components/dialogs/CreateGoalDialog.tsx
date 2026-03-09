import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGoal } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function CreateGoalDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const createGoal = useCreateGoal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe o nome da meta");
    const target = parseFloat(targetAmount);
    if (!target || target <= 0) return toast.error("Informe um valor válido");
    if (!deadline) return toast.error("Informe a data limite");
    createGoal.mutate(
      { name: name.trim(), target_amount: target, deadline },
      {
        onSuccess: () => {
          toast.success("Meta criada!");
          setName(""); setTargetAmount(""); setDeadline("");
          setOpen(false);
        },
        onError: () => toast.error("Erro ao criar meta"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Meta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Meta</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Viagem" />
          </div>
          <div className="space-y-2">
            <Label>Valor Alvo (R$)</Label>
            <Input type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="5000" />
          </div>
          <div className="space-y-2">
            <Label>Data Limite</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={createGoal.isPending}>
            {createGoal.isPending ? "Criando..." : "Criar Meta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
