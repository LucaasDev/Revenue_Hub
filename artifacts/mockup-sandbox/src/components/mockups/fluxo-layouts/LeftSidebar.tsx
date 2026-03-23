import { useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Pin, Shuffle, ArrowUpRight, ArrowDownRight, Landmark, Wallet, Target, CalendarDays,
} from "lucide-react";

const accounts = [
  { name: "Nubank", type: "corrente", balance: 4250.80, icon: Landmark, color: "text-blue-400", bg: "bg-blue-500/10" },
  { name: "Carteira", type: "carteira", balance: 320.00, icon: Wallet, color: "text-amber-400", bg: "bg-amber-500/10" },
  { name: "Tesouro", type: "investimento", balance: 18500.00, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
];
const goals = [
  { name: "Viagem Europa", current: 8500, target: 15000, emoji: "✈️" },
  { name: "Reserva de emergência", current: 12000, target: 20000, emoji: "🛡️" },
];
const transactions = [
  { id: 1, name: "Salário", type: "receita", status: "recebido", amount: 8500, date: "01/03", category: "💼 Trabalho", is_recurring: false },
  { id: 2, name: "Aluguel", type: "despesa", is_recurring: true, status: "pago", amount: 1800, date: "05/03", category: "🏠 Moradia" },
  { id: 3, name: "Streaming", type: "despesa", is_recurring: true, status: "pago", amount: 55.90, date: "08/03", category: "🎬 Lazer" },
  { id: 4, name: "Supermercado", type: "despesa", is_recurring: false, status: "pago", amount: 380, date: "10/03", category: "🛒 Alimentação" },
  { id: 5, name: "Uber", type: "despesa", is_recurring: false, status: "pendente", amount: 45, date: "12/03", category: "🚗 Transporte" },
  { id: 6, name: "Freelance", type: "receita", status: "pendente", amount: 1200, date: "15/03", category: "💼 Trabalho", is_recurring: false },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function LeftSidebar() {
  const [search, setSearch] = useState("");
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalGoalsCurrent = goals.reduce((s, g) => s + g.current, 0);
  const totalGoalsTarget = goals.reduce((s, g) => s + g.target, 0);

  const filtered = transactions.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  const receitasList = filtered.filter(t => t.type === "receita");
  const fixasList = filtered.filter(t => t.type === "despesa" && t.is_recurring);
  const varList = filtered.filter(t => t.type === "despesa" && !t.is_recurring);

  return (
    <div className="min-h-screen bg-[hsl(220_25%_7%)] text-[hsl(220_10%_90%)] flex">

      {/* LEFT SIDEBAR — financial summary */}
      <aside className="w-60 shrink-0 bg-[hsl(220_28%_5%)] border-r border-[hsl(220_20%_12%)] flex flex-col">
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-[hsl(220_20%_12%)]">
          <p className="text-[10px] font-semibold text-[hsl(220_10%_46%)] uppercase tracking-wider mb-1">Saldo Total</p>
          <p className={`text-2xl font-bold tabular-nums ${totalBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmt(totalBalance)}</p>
          <p className="text-[11px] text-[hsl(220_10%_46%)] mt-0.5">{accounts.length} contas · março 2026</p>
        </div>

        {/* Accounts */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-[hsl(220_10%_40%)] uppercase tracking-wider px-1 mb-2">Contas</p>
            <div className="space-y-0.5">
              {accounts.map((a) => {
                const Icon = a.icon;
                return (
                  <div key={a.name} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[hsl(220_20%_10%)] transition-colors cursor-pointer">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${a.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${a.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-[hsl(220_10%_85%)] truncate">{a.name}</p>
                      <p className="text-[10px] text-[hsl(220_10%_46%)] capitalize">{a.type}</p>
                    </div>
                    <span className={`text-[11px] font-semibold tabular-nums shrink-0 ${a.balance >= 0 ? "text-[hsl(220_10%_80%)]" : "text-rose-400"}`}>
                      {fmt(a.balance)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goals */}
          <div className="px-3 pt-3 pb-4">
            <p className="text-[10px] font-semibold text-[hsl(220_10%_40%)] uppercase tracking-wider px-1 mb-2">Metas</p>
            <div className="px-2 mb-3">
              <p className="text-[11px] text-[hsl(220_10%_46%)]">{fmt(totalGoalsCurrent)} de {fmt(totalGoalsTarget)}</p>
              <div className="h-1.5 rounded-full bg-[hsl(220_20%_14%)] mt-1.5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[hsl(160_84%_39%)] to-emerald-400" style={{ width: `${(totalGoalsCurrent/totalGoalsTarget)*100}%` }} />
              </div>
            </div>
            <div className="space-y-3">
              {goals.map((g) => {
                const pct = Math.min((g.current / g.target) * 100, 100);
                return (
                  <div key={g.name} className="px-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm">{g.emoji}</span>
                        <p className="text-[11px] font-medium text-[hsl(220_10%_80%)] truncate">{g.name}</p>
                      </div>
                      <span className="text-[11px] font-bold shrink-0 ml-1" style={{ color: "hsl(160 84% 39%)" }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-[hsl(220_20%_14%)] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[hsl(160_84%_39%)] to-emerald-400" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-[hsl(220_10%_46%)] tabular-nums">
                      <span>{fmt(g.current)}</span>
                      <span>{fmt(g.target)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT — transactions */}
      <main className="flex-1 p-5 space-y-4 overflow-y-auto min-w-0">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Fluxo de Caixa</h1>
            <p className="text-xs text-[hsl(220_10%_46%)] mt-0.5">{transactions.length} transações em março 2026</p>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            + Nova transação
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)] rounded-xl px-3 py-2">
          <Search className="h-3.5 w-3.5 text-[hsl(220_10%_46%)] shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(220_10%_40%)]"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-1 shrink-0">
            <button className="text-[hsl(220_10%_46%)] hover:text-white p-0.5 rounded"><ChevronLeft className="h-4 w-4" /></button>
            <div className="flex items-center gap-1 text-sm font-semibold text-white px-1">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-400" />
              Março 2026
            </div>
            <button className="text-[hsl(220_10%_46%)] hover:text-white p-0.5 rounded"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Transaction sections */}
        <div className="space-y-3">
          {[
            { icon: TrendingUp, title: "Receitas", items: receitasList, variant: "income" as const },
            { icon: Pin, title: "Despesas Fixas", items: fixasList, variant: "expense" as const },
            { icon: Shuffle, title: "Despesas Variáveis", items: varList, variant: "expense" as const },
          ].map(({ icon: Icon, title, items, variant }) => (
            <div key={title} className="bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[hsl(220_20%_15%)]">
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md ${variant === "income" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                    <Icon className={`h-3 w-3 ${variant === "income" ? "text-emerald-400" : "text-rose-400"}`} />
                  </div>
                  <span className="text-xs font-semibold">{title}</span>
                  <span className="text-[10px] text-[hsl(220_10%_46%)] bg-[hsl(220_20%_14%)] rounded-full px-1.5 py-0.5">{items.length}</span>
                </div>
                <span className={`text-xs font-bold tabular-nums ${variant === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                  {fmt(items.reduce((s,t)=>s+t.amount,0))}
                </span>
              </div>
              <div className="divide-y divide-[hsl(220_20%_13%)]">
                {items.length === 0 ? (
                  <p className="text-center text-[11px] text-[hsl(220_10%_46%)] py-4">Nenhuma transação</p>
                ) : items.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[hsl(220_20%_12%)] transition-colors cursor-pointer">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-md shrink-0 ${t.type === "receita" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                      {t.type === "receita" ? <ArrowUpRight className="h-3 w-3 text-emerald-400" /> : <ArrowDownRight className="h-3 w-3 text-rose-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{t.name}</p>
                      <p className="text-[10px] text-[hsl(220_10%_46%)]">{t.category}</p>
                    </div>
                    <p className="text-[10px] text-[hsl(220_10%_46%)] tabular-nums shrink-0">{t.date}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${t.status === "pago" || t.status === "recebido" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      <span className={`h-1 w-1 rounded-full ${t.status === "pago" || t.status === "recebido" ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {t.status}
                    </span>
                    <p className={`text-xs font-semibold tabular-nums shrink-0 w-20 text-right ${t.type === "receita" ? "text-emerald-400" : "text-rose-400"}`}>{fmt(t.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
