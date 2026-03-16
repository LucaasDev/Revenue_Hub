import { useState } from "react";
import { useTransactions, useUpdateTransaction } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Search, CheckCircle, TrendingUp, Pin, Shuffle, ChevronLeft, ChevronRight, CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreateTransactionDialog } from "@/components/dialogs/CreateTransactionDialog";
import { EditTransactionDialog } from "@/components/dialogs/EditTransactionDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

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
  const [pickerOpen, setPickerOpen] = useState(false);

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
  const isCurrentMonth = selectedMonth === _now.getMonth() && selectedYear === _now.getFullYear();

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
          <p className="text-sm text-muted-foreground">{totalFiltered} transações em {MONTHS_FULL[selectedMonth].toLowerCase()} de {selectedYear}</p>
        </div>
        <CreateTransactionDialog />
      </div>

      {/* Unified filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar transação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-transparent border-border/50 focus-visible:ring-1"
            data-testid="input-search"
          />
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border/50 hidden sm:block" />

        {/* Month selector */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={goToPrevMonth}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/60 transition-colors"
                data-testid="button-month-picker"
              >
                <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground capitalize whitespace-nowrap">
                  {MONTHS_FULL[selectedMonth]} {selectedYear}
                </span>
                {!isCurrentMonth && (
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full leading-none">
                    {MONTHS[_now.getMonth()]}/{_now.getFullYear()}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-72 p-4 space-y-4">
              {/* Year navigator inside popover */}
              <div className="flex items-center justify-between">
                <button
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedYear((y) => y - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-foreground">{selectedYear}</span>
                <button
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedYear((y) => y + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Month grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {MONTHS.map((m, i) => {
                  const isSelected = i === selectedMonth && selectedYear === selectedYear;
                  const isCurrent = i === _now.getMonth() && selectedYear === _now.getFullYear();
                  return (
                    <button
                      key={m}
                      onClick={() => { setSelectedMonth(i); setPickerOpen(false); }}
                      className={cn(
                        "py-1.5 rounded-lg text-xs font-medium transition-colors",
                        i === selectedMonth
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              {/* Go to current month shortcut */}
              {!isCurrentMonth && (
                <button
                  onClick={() => { setSelectedMonth(_now.getMonth()); setSelectedYear(_now.getFullYear()); setPickerOpen(false); }}
                  className="w-full text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors py-1.5 rounded-lg"
                  data-testid="button-go-to-current-month"
                >
                  Ir para o mês atual
                </button>
              )}
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={goToNextMonth}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border/50 hidden sm:block" />

        {/* Status filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-9 bg-transparent border-border/50 focus:ring-1" data-testid="select-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
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
