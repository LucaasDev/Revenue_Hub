import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateAccount, useDeleteAccount } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  account: Tables<"accounts"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAccountDialog({ account, open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"corrente" | "carteira" | "investimento">("corrente");
  const [balance, setBalance] = useState("");
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setBalance(String(account.balance));
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !name.trim()) return;
    updateAccount.mutate(
      { id: account.id, name: name.trim(), type, balance: parseFloat(balance) || 0 },
      { onSuccess: () => { toast.success("Conta atualizada!"); onOpenChange(false); }, onError: () => toast.error("Erro ao atualizar") }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Conta</DialogTitle></DialogHeader>
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
                <SelectItem value="corrente">Corrente</SelectItem>
                <SelectItem value="carteira">Carteira</SelectItem>
                <SelectItem value="investimento">Investimento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Saldo</Label>
            <Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={updateAccount.isPending}>
              {updateAccount.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="destructive" size="icon" onClick={() => {
              if (!account) return;
              deleteAccount.mutate(account.id, { onSuccess: () => { toast.success("Conta excluída"); onOpenChange(false); } });
            }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
