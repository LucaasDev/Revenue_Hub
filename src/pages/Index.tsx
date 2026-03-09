import { Wallet, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { mockTransactions, mockAccounts, monthlyData, balanceEvolution } from "@/data/mockData";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const Dashboard = () => {
  const totalBalance = mockAccounts.reduce((sum, a) => sum + a.balance, 0);
  const incomeThisMonth = mockTransactions
    .filter((t) => t.type === "receita" && t.status === "recebido")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenseThisMonth = mockTransactions
    .filter((t) => t.type === "despesa" && t.status === "pago")
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingCount = mockTransactions.filter((t) => t.status === "pendente").length;

  const recentTransactions = mockTransactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral das suas finanças</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Saldo Total" value={formatCurrency(totalBalance)} icon={Wallet} variant="balance" delay={0} />
        <StatCard title="Receitas" value={formatCurrency(incomeThisMonth)} subtitle="Este mês" icon={TrendingUp} variant="income" delay={0.1} />
        <StatCard title="Despesas" value={formatCurrency(expenseThisMonth)} subtitle="Este mês" icon={TrendingDown} variant="expense" delay={0.2} />
        <StatCard title="Pendentes" value={String(pendingCount)} subtitle="transações" icon={Clock} variant="pending" delay={0.3} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receitas vs Despesas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 15%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 20% 15%)", borderRadius: "8px", color: "hsl(220 10% 90%)" }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="receitas" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Evolução do Saldo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={balanceEvolution}>
              <defs>
                <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 15%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 20% 15%)", borderRadius: "8px", color: "hsl(220 10% 90%)" }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area type="monotone" dataKey="saldo" stroke="hsl(160 84% 39%)" fill="url(#saldoGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Transações Recentes</h3>
        <div className="space-y-3">
          {recentTransactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${t.type === "receita" ? "bg-success" : "bg-destructive"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.category} · {t.account}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${t.type === "receita" ? "text-success" : "text-destructive"}`}>
                  {t.type === "receita" ? "+" : "-"} {formatCurrency(t.amount)}
                </p>
                <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  t.status === "pago" || t.status === "recebido"
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }`}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
