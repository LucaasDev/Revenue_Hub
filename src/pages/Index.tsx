import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Clock, Calendar, CalendarDays, BarChart2, Activity, ArrowUpRight, ArrowDownRight, Sparkles, Plus, ChevronRight } from "lucide-react";
import { useAccounts, useTransactions, useCategories } from "@/hooks/useSupabaseData";
import { FinancialInsights } from "@/components/FinancialInsights";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const COLORS = ["hsl(262, 83%, 58%)", "hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(280, 65%, 60%)", "hsl(190, 80%, 45%)", "hsl(330, 75%, 55%)"];

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
  variant: "primary" | "income" | "expense" | "pending";
  delay?: number;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, variant, delay = 0 }: StatCardProps) {
  const variantStyles = {
    primary: "from-primary/20 to-primary/5 border-primary/20",
    income: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
    expense: "from-rose-500/20 to-rose-500/5 border-rose-500/20",
    pending: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
  };
  
  const iconStyles = {
    primary: "bg-primary/10 text-primary",
    income: "bg-emerald-500/10 text-emerald-500",
    expense: "bg-rose-500/10 text-rose-500",
    pending: "bg-amber-500/10 text-amber-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative rounded-xl border bg-gradient-to-br p-5 transition-all duration-300 hover:shadow-lg",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div>
            <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trend.positive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}>
              {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend.value}
            </div>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

const Dashboard = () => {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const [view, setView] = useState<"mensal" | "anual">("mensal");

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

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

  const totalInitialBalance = accounts.reduce((s, a) => s + Number(a.initial_balance), 0);
  const balanceEvolution = (() => {
    let running = totalInitialBalance;
    return chartData.map((m) => {
      running += m.receitas - m.despesas;
      return { label: m.label, saldo: running };
    });
  })();

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
  const periodLabel = view === "mensal" ? "Este mes" : "Este ano";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Visao geral das suas financas</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as "mensal" | "anual")}>
            <TabsList className="h-9 bg-muted/50">
              <TabsTrigger value="mensal" className="gap-1.5 text-xs data-[state=active]:bg-background">
                <Calendar className="h-3.5 w-3.5" /> Mensal
              </TabsTrigger>
              <TabsTrigger value="anual" className="gap-1.5 text-xs data-[state=active]:bg-background">
                <CalendarDays className="h-3.5 w-3.5" /> Anual
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button asChild size="sm" className="h-9 gap-1.5">
            <Link to="/transactions">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Transacao</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Saldo Total"
          value={formatCurrency(totalBalance)}
          icon={Wallet}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Receitas"
          value={formatCurrency(incomeTotal)}
          subtitle={periodLabel}
          icon={TrendingUp}
          variant="income"
          delay={0.1}
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(expenseTotal)}
          subtitle={periodLabel}
          icon={TrendingDown}
          variant="expense"
          delay={0.2}
        />
        <StatCard
          title="Pendentes"
          value={String(pendingCount)}
          subtitle="transacoes"
          icon={Clock}
          variant="pending"
          delay={0.3}
        />
      </div>

      {/* AI Insights */}
      <FinancialInsights />

      {hasData ? (
        <>
          {/* Charts Row 1 */}
          <div className="grid gap-6 lg:grid-cols-7">
            {/* Bar Chart - Income vs Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="lg:col-span-4 rounded-xl border bg-card p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Receitas vs Despesas</h3>
                    <p className="text-xs text-muted-foreground">Comparativo mensal</p>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barGap={8} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="receitas" name="Receitas" fill="hsl(142, 76%, 36%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Category Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="lg:col-span-3 rounded-xl border bg-card p-5"
            >
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Por Categoria</h3>
                  <p className="text-xs text-muted-foreground">Distribuicao de gastos</p>
                </div>
              </div>
              {expenseByCategory.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                  Sem dados de despesas.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {expenseByCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {expenseByCategory.slice(0, 4).map((cat, i) => {
                      const pct = totalCatExpense > 0 ? ((cat.value / totalCatExpense) * 100).toFixed(0) : "0";
                      return (
                        <div key={cat.name} className="flex items-center gap-2.5">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span className="flex-1 truncate text-xs text-muted-foreground">
                            {cat.icon} {cat.name}
                          </span>
                          <span className="text-xs font-medium text-foreground tabular-nums">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Balance Evolution */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="rounded-xl border bg-card p-5"
            >
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Evolucao de Saldo</h3>
                  <p className="text-xs text-muted-foreground">Patrimonio ao longo do tempo</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={balanceEvolution}>
                  <defs>
                    <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    stroke="hsl(262, 83%, 58%)"
                    fill="url(#saldoGradient)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="rounded-xl border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Transacoes Recentes</h3>
                    <p className="text-xs text-muted-foreground">Ultimas movimentacoes</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                  <Link to="/transactions" className="gap-1">
                    Ver todas <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              <div className="divide-y divide-border">
                {recentTransactions.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Nenhuma transacao ainda.
                  </p>
                ) : (
                  recentTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl shrink-0",
                          t.type === "receita" ? "bg-emerald-500/10" : "bg-rose-500/10"
                        )}
                      >
                        {t.type === "receita" ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-rose-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.categories?.name ?? "Sem categoria"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            t.type === "receita" ? "text-emerald-500" : "text-rose-500"
                          )}
                        >
                          {t.type === "receita" ? "+" : "-"}
                          {formatCurrency(Number(t.amount))}
                        </p>
                        <span
                          className={cn(
                            "text-[10px] font-medium uppercase tracking-wide",
                            t.status === "pago" || t.status === "recebido"
                              ? "text-emerald-500/70"
                              : "text-amber-500/70"
                          )}
                        >
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Comece agora</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie contas e categorias para registrar suas transacoes.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/accounts">Criar Conta</Link>
            </Button>
            <Button asChild>
              <Link to="/categories">Criar Categoria</Link>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
