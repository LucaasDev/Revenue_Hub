import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateAccount } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"corrente" | "carteira" | "investimento">("corrente");
  const [initialBalance, setInitialBalance] = useState("");
  const createAccount = useCreateAccount();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe o nome da conta");
    const balance = parseFloat(initialBalance) || 0;
    createAccount.mutate(
      { name: name.trim(), type, initial_balance: balance, balance },
      {
        onSuccess: () => {
          toast.success("Conta criada!");
          setName(""); setInitialBalance(""); setType("corrente");
          setOpen(false);
        },
        onError: () => toast.error("Erro ao criar conta"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Conta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Conta</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank" />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="corrente">Corrente</SelectItem>
                <SelectItem value="carteira">Carteira</SelectItem>
                <SelectItem value="investimento">Investimento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Saldo Inicial</Label>
            <Input type="number" step="0.01" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} placeholder="0,00" />
          </div>
          <Button type="submit" className="w-full" disabled={createAccount.isPending}>
            {createAccount.isPending ? "Criando..." : "Criar Conta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
