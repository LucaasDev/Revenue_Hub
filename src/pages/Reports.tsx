import { motion } from "framer-motion";
import { useTransactions, useCategories, useAccounts } from "@/hooks/useSupabaseData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from "recharts";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6"];

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
      receitas: monthTx.filter((t) => t.type === "receita" && t.status === "recebido").reduce((s, t) => s + Number(t.amount), 0),
      despesas: monthTx.filter((t) => t.type === "despesa" && t.status === "pago").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  // Balance evolution: start from total initial_balance, then apply monthly net
  const totalInitialBalance = accounts.reduce((s, a) => s + Number(a.initial_balance), 0);
  const balanceEvolution = (() => {
    let running = totalInitialBalance;
    return monthlyData.map((m) => {
      running += m.receitas - m.despesas;
      return { month: m.month, saldo: running };
    });
  })();

  const expenseByCategory = categories
    .filter(c => c.type === "despesa")
    .map(cat => {
      const total = transactions.filter(t => t.category_id === cat.id && t.status === "pago").reduce((s, t) => s + Number(t.amount), 0);
      return { name: cat.name, value: total, icon: cat.icon };
    })
    .filter(c => c.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Análise detalhada das suas finanças</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receitas vs Despesas (6 meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 15%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(220 10% 46%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 20% 15%)", borderRadius: "8px", color: "hsl(220 10% 90%)" }} formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="receitas" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Evolução de Saldo (6 meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
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
              <Tooltip contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 20% 15%)", borderRadius: "8px", color: "hsl(220 10% 90%)" }} formatter={(value: number) => formatCurrency(value)} />
              <Area type="monotone" dataKey="saldo" stroke="hsl(160 84% 39%)" fill="url(#saldoGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria</h3>
          {expenseByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">Sem dados de despesas.</div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 20% 15%)", borderRadius: "8px", color: "hsl(220 10% 90%)" }} formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center">
                {expenseByCategory.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {cat.icon} {cat.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
