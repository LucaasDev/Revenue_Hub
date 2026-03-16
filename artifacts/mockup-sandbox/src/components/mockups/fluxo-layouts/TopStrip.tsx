import { useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Pin, Shuffle, ArrowUpRight, ArrowDownRight, CheckCircle, Landmark, Wallet, Target,
} from "lucide-react";

const accounts = [
  { name: "Nubank", type: "corrente", balance: 4250.80 },
  { name: "Carteira", type: "carteira", balance: 320.00 },
  { name: "Tesouro", type: "investimento", balance: 18500.00 },
];
const goals = [
  { name: "Viagem Europa", current: 8500, target: 15000 },
  { name: "Reserva de emergência", current: 12000, target: 20000 },
];
const transactions = [
  { id: 1, name: "Salário", type: "receita", status: "recebido", amount: 8500, date: "01/03", category: "💼 Trabalho" },
  { id: 2, name: "Aluguel", type: "despesa", is_recurring: true, status: "pago", amount: 1800, date: "05/03", category: "🏠 Moradia" },
  { id: 3, name: "Streaming", type: "despesa", is_recurring: true, status: "pago", amount: 55.90, date: "08/03", category: "🎬 Lazer" },
  { id: 4, name: "Supermercado", type: "despesa", is_recurring: false, status: "pago", amount: 380, date: "10/03", category: "🛒 Alimentação" },
  { id: 5, name: "Uber", type: "despesa", is_recurring: false, status: "pendente", amount: 45, date: "12/03", category: "🚗 Transporte" },
  { id: 6, name: "Freelance", type: "receita", status: "pendente", amount: 1200, date: "15/03", category: "💼 Trabalho" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function TopStrip() {
  const [search, setSearch] = useState("");
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalGoalsCurrent = goals.reduce((s, g) => s + g.current, 0);
  const receitas = transactions.filter(t => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const despesas = transactions.filter(t => t.type === "despesa").reduce((s, t) => s + t.amount, 0);

  const filtered = transactions.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  const receitasList = filtered.filter(t => t.type === "receita");
  const fixasList = filtered.filter(t => t.type === "despesa" && t.is_recurring);
  const varList = filtered.filter(t => t.type === "despesa" && !t.is_recurring);

  return (
    <div className="min-h-screen bg-[hsl(220_25%_7%)] text-[hsl(220_10%_90%)] p-5 space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Fluxo de Caixa</h1>
          <p className="text-xs text-[hsl(220_10%_46%)] mt-0.5">Março 2026 · <span className="text-emerald-400">+{fmt(receitas - despesas)}</span></p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
          + Nova transação
        </button>
      </div>

      {/* SUMMARY STRIP — horizontal row of stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Saldo Total", value: fmt(totalBalance), color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
          { label: "Receitas", value: fmt(receitas), color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
          { label: "Despesas", value: fmt(despesas), color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/5" },
          { label: "Reservado em Metas", value: fmt(totalGoalsCurrent), color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5" },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl p-3.5 border ${card.border} ${card.bg} backdrop-blur`}>
            <p className="text-[11px] text-[hsl(220_10%_46%)] font-medium mb-1">{card.label}</p>
            <p className={`text-lg font-bold tabular-nums ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Account pills strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-[hsl(220_10%_46%)] font-medium shrink-0">Contas:</span>
        {accounts.map((a) => (
          <div key={a.name} className="flex items-center gap-1.5 bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)] rounded-full px-3 py-1">
            <span className="text-[11px] font-medium text-[hsl(220_10%_80%)]">{a.name}</span>
            <span className="text-[11px] font-bold text-emerald-400 tabular-nums">{fmt(a.balance)}</span>
          </div>
        ))}
        <span className="text-[hsl(220_20%_15%)] text-sm">·</span>
        {goals.map((g) => {
          const pct = Math.min((g.current / g.target) * 100, 100);
          return (
            <div key={g.name} className="flex items-center gap-1.5 bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)] rounded-full px-3 py-1">
              <Target className="h-3 w-3 text-primary shrink-0" style={{ color: "hsl(160 84% 39%)" }} />
              <span className="text-[11px] font-medium text-[hsl(220_10%_80%)]">{g.name}</span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: "hsl(160 84% 39%)" }}>{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)] rounded-xl px-3 py-2">
        <Search className="h-3.5 w-3.5 text-[hsl(220_10%_46%)] shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(220_10%_40%)]"
          placeholder="Buscar transação..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-1 text-[hsl(220_10%_46%)]">
          <button className="hover:text-white p-1 rounded"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold text-white px-1">Março 2026</span>
          <button className="hover:text-white p-1 rounded"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Transaction sections — full width */}
      <div className="space-y-3">
        {[
          { icon: TrendingUp, title: "Receitas", items: receitasList, variant: "income" as const, total: receitasList.reduce((s,t)=>s+t.amount,0) },
          { icon: Pin, title: "Despesas Fixas", items: fixasList, variant: "expense" as const, total: fixasList.reduce((s,t)=>s+t.amount,0) },
          { icon: Shuffle, title: "Despesas Variáveis", items: varList, variant: "expense" as const, total: varList.reduce((s,t)=>s+t.amount,0) },
        ].map(({ icon: Icon, title, items, variant, total }) => (
          <div key={title} className="bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[hsl(220_20%_15%)]">
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-md ${variant === "income" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                  <Icon className={`h-3 w-3 ${variant === "income" ? "text-emerald-400" : "text-rose-400"}`} />
                </div>
                <span className="text-xs font-semibold text-white">{title}</span>
                <span className="text-[10px] text-[hsl(220_10%_46%)] bg-[hsl(220_20%_14%)] rounded-full px-1.5 py-0.5">{items.length}</span>
              </div>
              <span className={`text-xs font-bold tabular-nums ${variant === "income" ? "text-emerald-400" : "text-rose-400"}`}>{fmt(total)}</span>
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
                    <p className="text-xs font-medium text-white truncate">{t.name}</p>
                    <p className="text-[10px] text-[hsl(220_10%_46%)]">{t.category}</p>
                  </div>
                  <p className="text-[10px] text-[hsl(220_10%_46%)] tabular-nums shrink-0">{t.date}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${t.status === "pago" || t.status === "recebido" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    <span className={`h-1 w-1 rounded-full ${t.status === "pago" || t.status === "recebido" ? "bg-emerald-400" : "bg-amber-400"}`} />
                    {t.status}
                  </span>
                  <p className={`text-xs font-semibold tabular-nums shrink-0 ${t.type === "receita" ? "text-emerald-400" : "text-rose-400"}`}>{fmt(t.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
