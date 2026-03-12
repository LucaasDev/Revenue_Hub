import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateTransaction, useAccounts, useCategories } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function CreateTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"receita" | "despesa">("despesa");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [classification, setClassification] = useState<"receita" | "fixa" | "variavel">("variavel");
  const createTx = useCreateTransaction();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleClassificationChange = (val: string) => {
    setClassification(val as any);
    if (val === "receita") {
      setType("receita");
      setIsRecurring(false);
    } else if (val === "fixa") {
      setType("despesa");
      setIsRecurring(true);
    } else {
      setType("despesa");
      setIsRecurring(false);
    }
    setCategoryId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe o nome");
    const val = parseFloat(amount);
    if (!val || val <= 0) return toast.error("Informe um valor válido");
    if (!dueDate) return toast.error("Informe a data");
    if (!accountId) return toast.error("Selecione uma conta");
    createTx.mutate(
      {
        name: name.trim(),
        type,
        amount: val,
        due_date: dueDate,
        account_id: accountId,
        category_id: categoryId || null,
        is_recurring: isRecurring,
      },
      {
        onSuccess: () => {
          toast.success("Transação criada!");
          setName(""); setAmount(""); setDueDate(""); setAccountId(""); setCategoryId("");
          setClassification("variavel"); setType("despesa"); setIsRecurring(false);
          setOpen(false);
        },
        onError: () => toast.error("Erro ao criar transação"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Transação</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Aluguel" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Conta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria (opcional)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={createTx.isPending}>
            {createTx.isPending ? "Criando..." : "Criar Transação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
