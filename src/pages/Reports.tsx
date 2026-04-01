import { useState } from "react";
import { motion } from "framer-motion";
import { useTransactions, useCategories, useAccounts } from "@/hooks/useSupabaseData";
import { BarChart2, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import ExportDialog from "@/components/ExportDialog";
import { MonthNavigator, MONTHS_FULL } from "@/components/MonthNavigator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart, Legend,
} from "recharts";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6"];

const CHART_STYLE = {
  grid: "hsl(220 20% 15%)",
  tick: { fill: "hsl(220 10% 46%)", fontSize: 12 },
  tooltip: {
    contentStyle: {
      backgroundColor: "hsl(220 22% 10%)",
      border: "1px solid hsl(220 20% 15%)",
      borderRadius: "8px",
      color: "hsl(220 10% 90%)",
      fontSize: "12px",
    },
  },
};

function ChartCard({ title, icon: Icon, delay = 0, children, className = "" }: {
  title: string; icon: any; delay?: number; children: React.ReactNode; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass-card rounded-xl overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

const Reports = () => {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthTx = transactions.filter((t) => {
      const td = new Date(t.due_date);
      return td.getMonth() === m && td.getFullYear() === y;
    });
    return {
      month: d.toLocaleString("pt-BR", { month: "short" }),
      Receitas: monthTx.filter((t) => t.type === "receita" && t.status === "recebido").reduce((s, t) => s + Number(t.amount), 0),
      Despesas: monthTx.filter((t) => t.type === "despesa" && t.status === "pago").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  const totalInitialBalance = accounts.reduce((s, a) => s + Number(a.initial_balance), 0);
  const balanceEvolution = (() => {
    let running = totalInitialBalance;
    return monthlyData.map((m) => {
      running += m.Receitas - m.Despesas;
      return { month: m.month, Saldo: running };
    });
  })();

  const expenseByCategory = categories
    .filter((c) => c.type === "despesa")
    .map((cat) => {
      const total = transactions
        .filter((t) => t.category_id === cat.id && t.status === "pago")
        .reduce((s, t) => s + Number(t.amount), 0);
      return { name: `${cat.icon} ${cat.name}`, value: total };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalExpenses = expenseByCategory.reduce((s, c) => s + c.value, 0);

  const totalReceitas = monthlyData.reduce((s, m) => s + m.Receitas, 0);
  const totalDespesas = monthlyData.reduce((s, m) => s + m.Despesas, 0);
  const netBalance = totalReceitas - totalDespesas;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Análise dos últimos 6 meses</p>
        </div>
        <ExportDialog />
      </div>

      {/* Summary strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Receitas (6m)", value: formatCurrency(totalReceitas), color: "text-emerald-400" },
          { label: "Despesas (6m)", value: formatCurrency(totalDespesas), color: "text-rose-400" },
          { label: "Resultado", value: formatCurrency(netBalance), color: netBalance >= 0 ? "text-emerald-400" : "text-rose-400" },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
            <p className={`text-xl font-bold mt-1 tabular-nums ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Receitas vs Despesas" icon={BarChart2} delay={0.05}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} vertical={false} />
              <XAxis dataKey="month" tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE.tick} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(value: number) => formatCurrency(value)} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(220 10% 60%)" }} />
              <Bar dataKey="Receitas" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="hsl(0 62% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Evolução de Saldo" icon={TrendingUp} delay={0.1}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={balanceEvolution}>
              <defs>
                <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} vertical={false} />
              <XAxis dataKey="month" tick={CHART_STYLE.tick} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE.tick} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(value: number) => formatCurrency(value)} />
              <Area type="monotone" dataKey="Saldo" stroke="hsl(160 84% 39%)" fill="url(#saldoGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Despesas por Categoria" icon={PieChartIcon} delay={0.15} className="lg:col-span-2">
          {expenseByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
              Sem dados de despesas para o período.
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={240} height={240}>
                  <PieChart>
                    <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...CHART_STYLE.tooltip} formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0 self-center">
                {expenseByCategory.map((cat, i) => {
                  const pct = totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(1) : "0";
                  return (
                    <div key={cat.name} className="flex items-center gap-3 group">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-foreground flex-1 truncate">{cat.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                      <span className="text-sm font-semibold text-foreground tabular-nums w-28 text-right">{formatCurrency(cat.value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default Reports;
