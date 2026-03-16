import { Building2, Users, ArrowLeftRight, Target, TrendingUp } from "lucide-react";
import { useAdminStats, useAdminGrowth } from "@/hooks/useAdminData";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function StatCard({ title, value, icon: Icon, delay = 0 }: { title: string; value: string | number; icon: any; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { data: stats } = useAdminStats();
  const { data: growth = [] } = useAdminGrowth();

  const chartData = growth.map((g) => ({
    label: new Date(g.month + "-01").toLocaleString("pt-BR", { month: "short", year: "2-digit" }),
    usuarios: g.user_count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total de Tenants" value={stats?.total_tenants ?? 0} icon={Building2} delay={0} />
        <StatCard title="Usuários Ativos" value={stats?.total_users ?? 0} icon={Users} delay={0.1} />
        <StatCard title="Transações" value={stats?.total_transactions ?? 0} icon={ArrowLeftRight} delay={0.2} />
        <StatCard title="Metas" value={stats?.total_goals ?? 0} icon={Target} delay={0.3} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Crescimento de Usuários</h3>
        </div>
        <div className="p-5">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">Sem dados de crescimento ainda.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="usuarios" name="Novos usuários" stroke="hsl(var(--primary))" fill="url(#growthGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </div>
  );
}
