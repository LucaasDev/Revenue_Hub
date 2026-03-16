import { useState } from "react";
import { useTransactions, useUpdateTransaction, useAccounts, useGoals } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import {
  Search, CheckCircle, TrendingUp, Pin, Shuffle,
  ChevronLeft, ChevronRight, CalendarDays, ChevronDown,
  Landmark, Wallet, TrendingDown, Target, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
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

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const ACCOUNT_ICONS: Record<string, any> = { corrente: Landmark, carteira: Wallet, investimento: TrendingUp };

const _now = new Date();

function TransactionTable({ transactions, onEdit, updateTx }: { transactions: any[]; onEdit: (t: any) => void; updateTx: any }) {
  if (transactions.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma transação neste período.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/40 bg-muted/20">
            <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nome</th>
            <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Categoria</th>
            <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Conta</th>
            <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
            <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
            <th className="px-5 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {transactions.map((t) => (
            <tr
              key={t.id}
              className="group hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => onEdit(t)}
            >
              <td className="px-5 py-3">
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                  t.status === "pago" || t.status === "recebido"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", t.status === "pago" || t.status === "recebido" ? "bg-emerald-400" : "bg-amber-400")} />
                  {t.status}
                </span>
              </td>
              <td className="px-5 py-3 text-sm font-medium text-foreground">{t.name}</td>
              <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">
                {t.categories ? <span>{t.categories.icon} {t.categories.name}</span> : <span className="text-border">—</span>}
              </td>
              <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                {t.accounts?.name ?? <span className="text-border">—</span>}
              </td>
              <td className="px-5 py-3 text-sm text-muted-foreground tabular-nums">
                {new Date(t.due_date).toLocaleDateString("pt-BR")}
              </td>
              <td className={cn("px-5 py-3 text-sm font-semibold text-right tabular-nums", t.type === "receita" ? "text-emerald-400" : "text-rose-400")}>
                <span className="flex items-center justify-end gap-1">
                  {t.type === "receita"
                    ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                    : <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
                  }
                  {formatCurrency(Number(t.amount))}
                </span>
              </td>
              <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                {t.status === "pendente" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const newStatus = t.type === "receita" ? "recebido" : "pago";
                      updateTx.mutate({ id: t.id, status: newStatus as any }, { onSuccess: () => toast.success("Status atualizado") });
                    }}
                    title="Marcar como pago"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
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

function SectionHeader({ icon: Icon, title, total, count, variant }: {
  icon: any; title: string; total: number; count: number; variant: "income" | "expense";
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
      <div className="flex items-center gap-2.5">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-md",
          variant === "income" ? "bg-emerald-500/10" : "bg-rose-500/10"
        )}>
          <Icon className={cn("h-3.5 w-3.5", variant === "income" ? "text-emerald-400" : "text-rose-400")} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
      </div>
      <span className={cn("text-sm font-bold tabular-nums", variant === "income" ? "text-emerald-400" : "text-rose-400")}>
        {formatCurrency(total)}
      </span>
    </div>
  );
}

function FinancialSummaryPanel() {
  const { data: accounts = [] } = useAccounts();
  const { data: goals = [] } = useGoals();

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const totalGoalsCurrent = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalGoalsTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);

  return (
    <aside className="w-72 shrink-0 space-y-4 sticky top-24 self-start">
      {/* Total balance card */}
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/40">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Saldo Total</p>
          <p className={cn("text-2xl font-bold tabular-nums", totalBalance >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{accounts.length} conta{accounts.length !== 1 ? "s" : ""} cadastrada{accounts.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Account list */}
        <div className="divide-y divide-border/30">
          {accounts.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">Nenhuma conta.</p>
          ) : (
            accounts.map((account) => {
              const Icon = ACCOUNT_ICONS[account.type] || Landmark;
              return (
                <div key={account.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{account.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{account.type}</p>
                  </div>
                  <span className={cn("text-xs font-semibold tabular-nums shrink-0", Number(account.balance) >= 0 ? "text-foreground" : "text-rose-400")}>
                    {formatCurrency(Number(account.balance))}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Goals card */}
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/40">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Metas</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(totalGoalsCurrent)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            de {formatCurrency(totalGoalsTarget)} · {goals.length} meta{goals.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="divide-y divide-border/30">
          {goals.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">Nenhuma meta.</p>
          ) : (
            goals.map((goal) => {
              const pct = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
              return (
                <div key={goal.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Target className="h-3 w-3 text-primary shrink-0" />
                      <p className="text-xs font-medium text-foreground truncate">{goal.name}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-primary shrink-0">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                    <span>{formatCurrency(Number(goal.current_amount))}</span>
                    <span>{formatCurrency(Number(goal.target_amount))}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </aside>
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
  const balance = totalReceitas - totalFixas - totalVariaveis;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {MONTHS_FULL[selectedMonth]} de {selectedYear}
            {" · "}
            <span className={balance >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
            </span>
          </p>
        </div>
        <CreateTransactionDialog />
      </div>

      {/* Main layout: content + right panel */}
      <div className="flex gap-5 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Unified filter bar */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-2.5 flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar transação..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 bg-transparent border-border/50 focus-visible:ring-1 text-sm"
                data-testid="input-search"
              />
            </div>

            <div className="h-5 w-px bg-border/50 hidden sm:block" />

            {/* Month selector */}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-9 w-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/60 transition-colors">
                    <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground capitalize whitespace-nowrap">
                      {MONTHS_FULL[selectedMonth]} {selectedYear}
                    </span>
                    {!isCurrentMonth && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full leading-none">Hoje</span>
                    )}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-68 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" onClick={() => setSelectedYear((y) => y - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-foreground">{selectedYear}</span>
                    <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" onClick={() => setSelectedYear((y) => y + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {MONTHS.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => { setSelectedMonth(i); setPickerOpen(false); }}
                        className={cn(
                          "py-1.5 rounded-lg text-xs font-medium transition-colors",
                          i === selectedMonth ? "bg-primary text-primary-foreground" :
                          i === _now.getMonth() && selectedYear === _now.getFullYear() ? "bg-primary/10 text-primary hover:bg-primary/20" :
                          "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >{m}</button>
                    ))}
                  </div>
                  {!isCurrentMonth && (
                    <button
                      onClick={() => { setSelectedMonth(_now.getMonth()); setSelectedYear(_now.getFullYear()); setPickerOpen(false); }}
                      className="w-full text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors py-1.5 rounded-lg"
                    >
                      Ir para o mês atual
                    </button>
                  )}
                </PopoverContent>
              </Popover>

              <Button variant="ghost" size="icon" className="h-9 w-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-5 w-px bg-border/50 hidden sm:block" />

            {/* Status filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-9 bg-transparent border-border/50 text-sm focus:ring-1" data-testid="select-status">
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

          {/* Transaction sections */}
          {isLoading ? (
            <div className="glass-card rounded-xl p-10 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : (
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl overflow-hidden">
                <SectionHeader icon={TrendingUp} title="Receitas" total={totalReceitas} count={receitas.length} variant="income" />
                <TransactionTable transactions={receitas} onEdit={setEditing} updateTx={updateTx} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl overflow-hidden">
                <SectionHeader icon={Pin} title="Despesas Fixas" total={totalFixas} count={despesasFixas.length} variant="expense" />
                <TransactionTable transactions={despesasFixas} onEdit={setEditing} updateTx={updateTx} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl overflow-hidden">
                <SectionHeader icon={Shuffle} title="Despesas Variáveis" total={totalVariaveis} count={despesasVariaveis.length} variant="expense" />
                <TransactionTable transactions={despesasVariaveis} onEdit={setEditing} updateTx={updateTx} />
              </motion.div>
            </div>
          )}
        </div>

        {/* Right summary panel */}
        <FinancialSummaryPanel />
      </div>

      <EditTransactionDialog transaction={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
};

export default Transactions;
