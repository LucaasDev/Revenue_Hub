import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Clock, Calendar, CalendarDays } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useAccounts, useTransactions, useCategories } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      {hasData ? (
        <>
          {/* Row 1: Bar chart + Recent transactions */}
          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Receitas vs Despesas</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 15%)" />
                  <XAxis dataKey="label" tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 20% 15%)", borderRadius: "8px", color: "hsl(220 10% 90%)" }} formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="receitas" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Transações Recentes</h3>
              <div className="space-y-3">
                {recentTransactions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma transação ainda.</p>}
                {recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${t.type === "receita" ? "bg-success" : "bg-destructive"}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.categories?.name ?? "Sem categoria"} · {t.accounts?.name ?? ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${t.type === "receita" ? "text-success" : "text-destructive"}`}>
                        {t.type === "receita" ? "+" : "-"} {formatCurrency(Number(t.amount))}
                      </p>
                      <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        t.status === "pago" || t.status === "recebido" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Row 2: Category spending + Balance evolution */}
          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Gastos por Categoria</h3>
              {expenseByCategory.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">Sem dados de despesas.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {expenseByCategory.map((entry, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 20% 15%)", borderRadius: "8px", color: "hsl(220 10% 90%)" }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {expenseByCategory.map((cat, i) => {
                      const pct = totalCatExpense > 0 ? ((cat.value / totalCatExpense) * 100).toFixed(1) : "0";
                      return (
                        <div key={cat.name} className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm text-foreground flex-1 truncate">{cat.icon} {cat.name}</span>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                          <span className="text-sm font-medium text-foreground w-24 text-right">{formatCurrency(cat.value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Evolução de Saldo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={balanceEvolution}>
                  <defs>
                    <linearGradient id="dashSaldoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 15%)" />
                  <XAxis dataKey="label" tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 20% 15%)", borderRadius: "8px", color: "hsl(220 10% 90%)" }} formatter={(value: number) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="saldo" stroke="hsl(160 84% 39%)" fill="url(#dashSaldoGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
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
