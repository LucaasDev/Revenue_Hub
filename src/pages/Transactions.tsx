import { useState } from "react";
import { useTransactions, useUpdateTransaction } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Search, CheckCircle, TrendingUp, Pin, Shuffle, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateTransactionDialog } from "@/components/dialogs/CreateTransactionDialog";
import { EditTransactionDialog } from "@/components/dialogs/EditTransactionDialog";
import { toast } from "sonner";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatMonthYear(date: Date) {
  return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
}

const _now = new Date();

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
  const [selectedMonth, setSelectedMonth] = useState(_now.getMonth());
  const [selectedYear, setSelectedYear] = useState(_now.getFullYear());

  const { data: transactions = [], isLoading } = useTransactions();
  const updateTx = useUpdateTransaction();

  const goToPrevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };
  const goToNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };
  const goToCurrentMonth = () => { setSelectedMonth(_now.getMonth()); setSelectedYear(_now.getFullYear()); };
  const isCurrentMonth = selectedMonth === _now.getMonth() && selectedYear === _now.getFullYear();
  const selectedDate = new Date(selectedYear, selectedMonth, 1);

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.due_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const applyFilters = (list: any[]) =>
    list.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  const receitas = applyFilters(monthlyTransactions.filter((t) => t.type === "receita"));
  const despesasFixas = applyFilters(monthlyTransactions.filter((t) => t.type === "despesa" && t.is_recurring));
  const despesasVariaveis = applyFilters(monthlyTransactions.filter((t) => t.type === "despesa" && !t.is_recurring));

  const totalReceitas = receitas.reduce((s, t) => s + Number(t.amount), 0);
  const totalFixas = despesasFixas.reduce((s, t) => s + Number(t.amount), 0);
  const totalVariaveis = despesasVariaveis.reduce((s, t) => s + Number(t.amount), 0);
  const totalFiltered = receitas.length + despesasFixas.length + despesasVariaveis.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">{totalFiltered} transações</p>
        </div>
        <CreateTransactionDialog />
      </div>

      {/* Month navigator */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-3 flex items-center justify-between gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg" onClick={goToPrevMonth} data-testid="button-prev-month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2.5 flex-1 justify-center">
          <CalendarDays className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground capitalize" data-testid="text-selected-month">
            {formatMonthYear(selectedDate)}
          </span>
          {!isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
              data-testid="button-go-to-current-month"
            >
              Hoje
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg" onClick={goToNextMonth} data-testid="button-next-month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Search and status filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar transação..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]" data-testid="select-status"><SelectValue placeholder="Status" /></SelectTrigger>
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
