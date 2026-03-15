import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTransaction, useDeleteTransaction, useAccounts, useCategories, useGoals } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  transaction: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({ transaction, open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"receita" | "despesa">("despesa");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"pendente" | "pago" | "recebido">("pendente");
  const [classification, setClassification] = useState<"receita" | "fixa" | "variavel">("variavel");
  const [isGoalReservation, setIsGoalReservation] = useState(false);
  const [goalId, setGoalId] = useState("");
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: goals = [] } = useGoals();

  useEffect(() => {
    if (transaction) {
      setName(transaction.name);
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setDueDate(transaction.due_date);
      setAccountId(transaction.account_id);
      setCategoryId(transaction.category_id || "");
      setStatus(transaction.status);
      setIsGoalReservation(!!transaction.goal_id);
      setGoalId(transaction.goal_id || "");
      if (transaction.type === "receita") {
        setClassification("receita");
      } else if (transaction.is_recurring) {
        setClassification("fixa");
      } else {
        setClassification("variavel");
      }
    }
  }, [transaction]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleClassificationChange = (val: string) => {
    setClassification(val as any);
    if (val === "receita") { setType("receita"); } else { setType("despesa"); }
    setCategoryId("");
  };

  const isRecurring = classification === "fixa";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    updateTx.mutate(
      { id: transaction.id, name: name.trim(), type, amount: parseFloat(amount), due_date: dueDate, account_id: accountId, category_id: categoryId || null, status, is_recurring: isRecurring, goal_id: isGoalReservation && goalId ? goalId : null } as any,
      { onSuccess: () => { toast.success("Transação atualizada!"); onOpenChange(false); }, onError: () => toast.error("Erro ao atualizar") }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Transação</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Classificação</Label>
              <Select value={classification} onValueChange={handleClassificationChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">💰 Receita</SelectItem>
                  <SelectItem value="fixa">📌 Despesa Fixa</SelectItem>
                  <SelectItem value="variavel">🔀 Despesa Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Conta</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          {type === "despesa" && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-goal-reservation" className="text-sm">🎯 Reservar para meta</Label>
                <Switch id="edit-goal-reservation" checked={isGoalReservation} onCheckedChange={(v) => { setIsGoalReservation(v); if (!v) setGoalId(""); }} />
              </div>
              {isGoalReservation && (
                <Select value={goalId} onValueChange={setGoalId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a meta" /></SelectTrigger>
                  <SelectContent>
                    {goals.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={updateTx.isPending}>
              {updateTx.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="destructive" size="icon" onClick={() => {
              if (!transaction) return;
              deleteTx.mutate(transaction.id, { onSuccess: () => { toast.success("Transação excluída"); onOpenChange(false); } });
            }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
