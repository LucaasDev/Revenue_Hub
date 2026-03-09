import { Wallet, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useAccounts, useTransactions } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const Dashboard = () => {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.due_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const incomeThisMonth = thisMonthTx
    .filter((t) => t.type === "receita" && t.status === "recebido")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expenseThisMonth = thisMonthTx
    .filter((t) => t.type === "despesa" && t.status === "pago")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingCount = thisMonthTx.filter((t) => t.status === "pendente").length;

  // Build last 6 months chart data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 5 + i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthTx = transactions.filter((t) => {
      const td = new Date(t.due_date);
      return td.getMonth() === m && td.getFullYear() === y;
    });
    return {
      month: d.toLocaleString("pt-BR", { month: "short" }),
      receitas: monthTx.filter((t) => t.type === "receita" && t.status === "recebido").reduce((s, t) => s + Number(t.amount), 0),
      despesas: monthTx.filter((t) => t.type === "despesa" && t.status === "pago").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  const recentTransactions = transactions.slice(0, 5);

  const hasData = transactions.length > 0 || accounts.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral das suas finanças</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Saldo Total" value={formatCurrency(totalBalance)} icon={Wallet} variant="balance" delay={0} />
        <StatCard title="Receitas" value={formatCurrency(incomeThisMonth)} subtitle="Este mês" icon={TrendingUp} variant="income" delay={0.1} />
        <StatCard title="Despesas" value={formatCurrency(expenseThisMonth)} subtitle="Este mês" icon={TrendingDown} variant="expense" delay={0.2} />
        <StatCard title="Pendentes" value={String(pendingCount)} subtitle="transações" icon={Clock} variant="pending" delay={0.3} />
      </div>

      {hasData ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Receitas vs Despesas</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 15%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
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
