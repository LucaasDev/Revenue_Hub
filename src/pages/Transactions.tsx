import { useState } from "react";
import { useTransactions, useUpdateTransaction } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Search, CheckCircle, TrendingUp, TrendingDown, Pin, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateTransactionDialog } from "@/components/dialogs/CreateTransactionDialog";
import { EditTransactionDialog } from "@/components/dialogs/EditTransactionDialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function TransactionTable({ transactions, onEdit, updateTx }: { transactions: any[]; onEdit: (t: any) => void; updateTx: any }) {
  if (transactions.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Nenhuma transação encontrada.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Nome</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Categoria</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Conta</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Data</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Valor</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Ações</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => onEdit(t)}>
              <td className="px-5 py-3">
                <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  t.status === "pago" || t.status === "recebido" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                }`}>{t.status}</span>
              </td>
              <td className="px-5 py-3 text-sm font-medium text-foreground">{t.name}</td>
              <td className="px-5 py-3 text-sm text-muted-foreground">{t.categories?.icon} {t.categories?.name ?? "—"}</td>
              <td className="px-5 py-3 text-sm text-muted-foreground">{t.accounts?.name ?? "—"}</td>
              <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(t.due_date).toLocaleDateString("pt-BR")}</td>
              <td className={`px-5 py-3 text-sm font-semibold text-right ${t.type === "receita" ? "text-success" : "text-destructive"}`}>
                {t.type === "receita" ? "+" : "-"} {formatCurrency(Number(t.amount))}
              </td>
              <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                {t.status === "pendente" && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                    const newStatus = t.type === "receita" ? "recebido" : "pago";
                    updateTx.mutate({ id: t.id, status: newStatus as any }, { onSuccess: () => toast.success("Status atualizado") });
                  }}>
                    <CheckCircle className="h-3.5 w-3.5 text-success" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editing, setEditing] = useState<any>(null);
  const { data: transactions = [], isLoading } = useTransactions();
  const updateTx = useUpdateTransaction();

  const applyFilters = (list: any[]) =>
    list.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  const receitas = applyFilters(transactions.filter((t) => t.type === "receita"));
  const despesasFixas = applyFilters(transactions.filter((t) => t.type === "despesa" && t.is_recurring));
  const despesasVariaveis = applyFilters(transactions.filter((t) => t.type === "despesa" && !t.is_recurring));

  const totalReceitas = receitas.reduce((s, t) => s + Number(t.amount), 0);
  const totalFixas = despesasFixas.reduce((s, t) => s + Number(t.amount), 0);
  const totalVariaveis = despesasVariaveis.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">{transactions.length} transações</p>
        </div>
        <CreateTransactionDialog />
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar transação..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="recebido">Recebido</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <Tabs defaultValue="receitas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="receitas" className="gap-2">
              <TrendingUp className="h-4 w-4" /> Receitas
              <span className="ml-1 text-xs text-muted-foreground">({formatCurrency(totalReceitas)})</span>
            </TabsTrigger>
            <TabsTrigger value="fixas" className="gap-2">
              <Pin className="h-4 w-4" /> Desp. Fixas
              <span className="ml-1 text-xs text-muted-foreground">({formatCurrency(totalFixas)})</span>
            </TabsTrigger>
            <TabsTrigger value="variaveis" className="gap-2">
              <Shuffle className="h-4 w-4" /> Desp. Variáveis
              <span className="ml-1 text-xs text-muted-foreground">({formatCurrency(totalVariaveis)})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receitas">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl overflow-hidden">
              <TransactionTable transactions={receitas} onEdit={setEditing} updateTx={updateTx} />
            </motion.div>
          </TabsContent>

          <TabsContent value="fixas">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl overflow-hidden">
              <TransactionTable transactions={despesasFixas} onEdit={setEditing} updateTx={updateTx} />
            </motion.div>
          </TabsContent>

          <TabsContent value="variaveis">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl overflow-hidden">
              <TransactionTable transactions={despesasVariaveis} onEdit={setEditing} updateTx={updateTx} />
            </motion.div>
          </TabsContent>
        </Tabs>
      )}

      <EditTransactionDialog transaction={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
};

export default Transactions;
