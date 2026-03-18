import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Clock, Calendar, CalendarDays, BarChart2, PieChart as PieChartIcon, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useAccounts, useTransactions, useCategories } from "@/hooks/useSupabaseData";
import { FinancialInsights } from "@/components/FinancialInsights";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6"];

const Dashboard = () => {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const [view, setView] = useState<"mensal" | "anual">("mensal");

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter transactions based on view
  const periodTx = transactions.filter((t) => {
    const d = new Date(t.due_date);
    if (view === "mensal") {
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }
    return d.getFullYear() === currentYear;
  });

  const incomeTotal = periodTx
    .filter((t) => t.type === "receita" && t.status === "recebido")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expenseTotal = periodTx
    .filter((t) => t.type === "despesa" && t.status === "pago")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingCount = periodTx.filter((t) => t.status === "pendente").length;

  // Chart data based on view
  const chartData = view === "mensal"
    ? Array.from({ length: 6 }, (_, i) => {
        const d = new Date(currentYear, currentMonth - 5 + i, 1);
        const m = d.getMonth();
        const y = d.getFullYear();
        const monthTx = transactions.filter((t) => {
          const td = new Date(t.due_date);
          return td.getMonth() === m && td.getFullYear() === y;
        });
        return {
          label: d.toLocaleString("pt-BR", { month: "short" }),
          receitas: monthTx.filter((t) => t.type === "receita" && t.status === "recebido").reduce((s, t) => s + Number(t.amount), 0),
          despesas: monthTx.filter((t) => t.type === "despesa" && t.status === "pago").reduce((s, t) => s + Number(t.amount), 0),
        };
      })
    : Array.from({ length: 12 }, (_, i) => {
        const d = new Date(currentYear, i, 1);
        const monthTx = transactions.filter((t) => {
          const td = new Date(t.due_date);
          return td.getMonth() === i && td.getFullYear() === currentYear;
        });
        return {
          label: d.toLocaleString("pt-BR", { month: "short" }),
          receitas: monthTx.filter((t) => t.type === "receita" && t.status === "recebido").reduce((s, t) => s + Number(t.amount), 0),
          despesas: monthTx.filter((t) => t.type === "despesa" && t.status === "pago").reduce((s, t) => s + Number(t.amount), 0),
        };
      });

  // Balance evolution
  const totalInitialBalance = accounts.reduce((s, a) => s + Number(a.initial_balance), 0);
  const balanceEvolution = (() => {
    let running = totalInitialBalance;
    return chartData.map((m) => {
      running += m.receitas - m.despesas;
      return { label: m.label, saldo: running };
    });
  })();

  // Expense by category
  const expenseByCategory = categories
    .filter((c) => c.type === "despesa")
    .map((cat) => {
      const total = periodTx
        .filter((t) => t.category_id === cat.id && t.status === "pago")
        .reduce((s, t) => s + Number(t.amount), 0);
      return { name: cat.name, value: total, icon: cat.icon, color: cat.color };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalCatExpense = expenseByCategory.reduce((s, c) => s + c.value, 0);

  const recentTransactions = transactions.slice(0, 5);
  const hasData = transactions.length > 0 || accounts.length > 0;
  const periodLabel = view === "mensal" ? "Este mês" : "Este ano";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral das suas finanças</p>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="mensal" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Mensal</TabsTrigger>
            <TabsTrigger value="anual" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Anual</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Saldo Total" value={formatCurrency(totalBalance)} icon={Wallet} variant="balance" delay={0} />
        <StatCard title="Receitas" value={formatCurrency(incomeTotal)} subtitle={periodLabel} icon={TrendingUp} variant="income" delay={0.1} />
        <StatCard title="Despesas" value={formatCurrency(expenseTotal)} subtitle={periodLabel} icon={TrendingDown} variant="expense" delay={0.2} />
        <StatCard title="Pendentes" value={String(pendingCount)} subtitle="transações" icon={Clock} variant="pending" delay={0.3} />
      </div>

      <FinancialInsights />

      {hasData ? (
        <>
          {/* Row 1: Bar chart + Recent transactions */}
          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                  <BarChart2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Receitas vs Despesas</h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 15%)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 20% 15%)", borderRadius: "8px", color: "hsl(220 10% 90%)", fontSize: "12px" }} formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(220 10% 60%)" }} />
                    <Bar dataKey="receitas" name="Receitas" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="hsl(0 62% 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Transações Recentes</h3>
              </div>
              <div className="divide-y divide-border/30">
                {recentTransactions.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-muted-foreground text-center">Nenhuma transação ainda.</p>
                ) : (
                  recentTransactions.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", t.type === "receita" ? "bg-emerald-500/10" : "bg-rose-500/10")}>
                        {t.type === "receita"
                          ? <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                          : <ArrowDownRight className="h-4 w-4 text-rose-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.categories?.name ?? "Sem categoria"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("text-sm font-semibold tabular-nums", t.type === "receita" ? "text-emerald-400" : "text-rose-400")}>
                          {t.type === "receita" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                        </p>
                        <span className={cn("text-[10px] font-medium", t.status === "pago" || t.status === "recebido" ? "text-emerald-400/70" : "text-amber-400/70")}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Row 2: Category spending + Balance evolution */}
          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                  <PieChartIcon className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Gastos por Categoria</h3>
              </div>
              <div className="p-5">
                {expenseByCategory.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">Sem dados de despesas.</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                          {expenseByCategory.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 20% 15%)", borderRadius: "8px", color: "hsl(220 10% 90%)", fontSize: "12px" }} formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5">
                      {expenseByCategory.map((cat, i) => {
                        const pct = totalCatExpense > 0 ? ((cat.value / totalCatExpense) * 100).toFixed(1) : "0";
                        return (
                          <div key={cat.name} className="flex items-center gap-2.5">
                            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-sm text-foreground flex-1 truncate">{cat.icon} {cat.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                            <span className="text-sm font-semibold text-foreground tabular-nums w-24 text-right">{formatCurrency(cat.value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Evolução de Saldo</h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={balanceEvolution}>
                    <defs>
                      <linearGradient id="dashSaldoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 15%)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 20% 15%)", borderRadius: "8px", color: "hsl(220 10% 90%)", fontSize: "12px" }} formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="saldo" stroke="hsl(160 84% 39%)" fill="url(#dashSaldoGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-8 text-center">
          <p className="text-muted-foreground">Comece criando contas e categorias para registrar suas transações.</p>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
