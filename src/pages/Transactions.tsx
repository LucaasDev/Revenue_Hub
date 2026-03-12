import { useState } from "react";
import { useTransactions, useUpdateTransaction } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Search, CheckCircle, TrendingUp, Pin, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateTransactionDialog } from "@/components/dialogs/CreateTransactionDialog";
import { EditTransactionDialog } from "@/components/dialogs/EditTransactionDialog";
import { toast } from "sonner";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function TransactionTable({ transactions, onEdit, updateTx }: { transactions: any[]; onEdit: (t: any) => void; updateTx: any }) {
  if (transactions.length === 0) {
    return <div className="p-6 text-center text-muted-foreground text-sm">Nenhuma transação encontrada.</div>;
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
            <tr key={t.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => onEdit(t)}>
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

function SectionHeader({ icon: Icon, title, total, variant }: { icon: any; title: string; total: number; variant: "income" | "expense" }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${variant === "income" ? "text-success" : "text-destructive"}`} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <span className={`text-sm font-semibold ${variant === "income" ? "text-success" : "text-destructive"}`}>
        {formatCurrency(total)}
      </span>
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
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl overflow-hidden">
            <SectionHeader icon={TrendingUp} title="Receitas" total={totalReceitas} variant="income" />
            <TransactionTable transactions={receitas} onEdit={setEditing} updateTx={updateTx} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl overflow-hidden">
            <SectionHeader icon={Pin} title="Despesas Fixas" total={totalFixas} variant="expense" />
            <TransactionTable transactions={despesasFixas} onEdit={setEditing} updateTx={updateTx} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl overflow-hidden">
            <SectionHeader icon={Shuffle} title="Despesas Variáveis" total={totalVariaveis} variant="expense" />
            <TransactionTable transactions={despesasVariaveis} onEdit={setEditing} updateTx={updateTx} />
          </motion.div>
        </div>
      )}

      <EditTransactionDialog transaction={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
};

export default Transactions;
