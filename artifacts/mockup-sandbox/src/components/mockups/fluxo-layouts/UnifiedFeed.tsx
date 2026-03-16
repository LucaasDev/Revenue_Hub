import { useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight,
  Landmark, Wallet, TrendingUp, Target, CalendarDays, SlidersHorizontal,
} from "lucide-react";

const accounts = [
  { name: "Nubank", balance: 4250.80, icon: Landmark, bg: "bg-blue-500/10", color: "text-blue-400" },
  { name: "Carteira", balance: 320.00, icon: Wallet, bg: "bg-amber-500/10", color: "text-amber-400" },
  { name: "Tesouro", balance: 18500.00, icon: TrendingUp, bg: "bg-emerald-500/10", color: "text-emerald-400" },
];
const goals = [
  { name: "Viagem Europa", current: 8500, target: 15000, emoji: "✈️" },
  { name: "Emergência", current: 12000, target: 20000, emoji: "🛡️" },
];
const allTransactions = [
  { id: 1, name: "Salário", type: "receita", is_recurring: false, status: "recebido", amount: 8500, date: "2026-03-01", dayLabel: "01 mar", category: "💼 Trabalho", account: "Nubank" },
  { id: 2, name: "Aluguel", type: "despesa", is_recurring: true, status: "pago", amount: 1800, date: "2026-03-05", dayLabel: "05 mar", category: "🏠 Moradia", account: "Nubank" },
  { id: 3, name: "Streaming", type: "despesa", is_recurring: true, status: "pago", amount: 55.90, date: "2026-03-08", dayLabel: "08 mar", category: "🎬 Lazer", account: "Nubank" },
  { id: 4, name: "Supermercado", type: "despesa", is_recurring: false, status: "pago", amount: 380, date: "2026-03-10", dayLabel: "10 mar", category: "🛒 Alimentação", account: "Carteira" },
  { id: 5, name: "Uber", type: "despesa", is_recurring: false, status: "pendente", amount: 45, date: "2026-03-12", dayLabel: "12 mar", category: "🚗 Transporte", account: "Carteira" },
  { id: 6, name: "Freelance", type: "receita", is_recurring: false, status: "pendente", amount: 1200, date: "2026-03-15", dayLabel: "15 mar", category: "💼 Trabalho", account: "Nubank" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function UnifiedFeed() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "receita" | "despesa">("all");

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalGoalsCurrent = goals.reduce((s, g) => s + g.current, 0);
  const totalGoalsTarget = goals.reduce((s, g) => s + g.target, 0);
  const receitas = allTransactions.filter(t => t.type === "receita" && t.status === "recebido").reduce((s,t)=>s+t.amount,0);
  const despesas = allTransactions.filter(t => t.type === "despesa" && t.status === "pago").reduce((s,t)=>s+t.amount,0);

  const filtered = allTransactions
    .filter(t => typeFilter === "all" || t.type === typeFilter)
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group by day for the feed
  const byDay: Record<string, typeof allTransactions> = {};
  filtered.forEach(t => {
    if (!byDay[t.dayLabel]) byDay[t.dayLabel] = [];
    byDay[t.dayLabel].push(t);
  });
  const days = Object.entries(byDay);

  return (
    <div className="min-h-screen bg-[hsl(220_25%_7%)] text-[hsl(220_10%_90%)] p-5 space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Fluxo de Caixa</h1>
          <p className="text-xs text-[hsl(220_10%_46%)] mt-0.5">Visão cronológica · março 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[hsl(220_10%_46%)]">
            <button className="hover:text-white p-1 rounded"><ChevronLeft className="h-4 w-4" /></button>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)]">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-white">Março 2026</span>
            </div>
            <button className="hover:text-white p-1 rounded"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            + Transação
          </button>
        </div>
      </div>

      {/* Summary row — compact account + goal cards */}
      <div className="grid grid-cols-5 gap-2.5">
        {accounts.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.name} className="bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`flex h-5 w-5 items-center justify-center rounded-md ${a.bg}`}>
                  <Icon className={`h-2.5 w-2.5 ${a.color}`} />
                </div>
                <p className="text-[10px] font-medium text-[hsl(220_10%_60%)] truncate">{a.name}</p>
              </div>
              <p className="text-sm font-bold text-white tabular-nums">{fmt(a.balance)}</p>
            </div>
          );
        })}

        {/* Metas summary as a pill that spans remaining space */}
        <div className="bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)] rounded-xl p-3 col-span-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(160 84% 39%)" }} />
            <p className="text-[10px] font-medium text-[hsl(220_10%_60%)]">Metas</p>
            <span className="ml-auto text-[10px] font-bold" style={{ color: "hsl(160 84% 39%)" }}>
              {((totalGoalsCurrent/totalGoalsTarget)*100).toFixed(0)}%
            </span>
          </div>
          <p className="text-sm font-bold text-white tabular-nums">{fmt(totalGoalsCurrent)}</p>
          <div className="h-1 rounded-full bg-[hsl(220_20%_14%)] mt-1.5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[hsl(160_84%_39%)] to-emerald-400" style={{ width: `${(totalGoalsCurrent/totalGoalsTarget)*100}%` }} />
          </div>
        </div>
      </div>

      {/* Net balance strip */}
      <div className="flex items-center gap-4 bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)] rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-[hsl(220_10%_60%)]">Receitas:</span>
          <span className="text-xs font-bold text-emerald-400 tabular-nums">{fmt(receitas)}</span>
        </div>
        <div className="h-4 w-px bg-[hsl(220_20%_15%)]" />
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="text-xs text-[hsl(220_10%_60%)]">Despesas:</span>
          <span className="text-xs font-bold text-rose-400 tabular-nums">{fmt(despesas)}</span>
        </div>
        <div className="h-4 w-px bg-[hsl(220_20%_15%)]" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[hsl(220_10%_60%)]">Resultado:</span>
          <span className={`text-xs font-bold tabular-nums ${receitas - despesas >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmt(receitas - despesas)}</span>
        </div>
        <div className="ml-auto text-xs text-[hsl(220_10%_46%)]">{filtered.length} transações</div>
      </div>

      {/* Filter + search */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)] rounded-xl px-3 py-2">
          <Search className="h-3.5 w-3.5 text-[hsl(220_10%_46%)] shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(220_10%_40%)]"
            placeholder="Buscar transação..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-[hsl(220_20%_15%)] text-xs font-medium shrink-0">
          {(["all", "receita", "despesa"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setTypeFilter(v)}
              className={`px-3 py-2 transition-colors ${typeFilter === v ? "bg-[hsl(160_84%_39%)] text-white" : "bg-[hsl(220_22%_10%)] text-[hsl(220_10%_60%)] hover:bg-[hsl(220_20%_14%)]"}`}
            >
              {v === "all" ? "Todos" : v === "receita" ? "Receitas" : "Despesas"}
            </button>
          ))}
        </div>
      </div>

      {/* Chronological feed grouped by day */}
      <div className="space-y-3">
        {days.length === 0 ? (
          <div className="text-center text-sm text-[hsl(220_10%_46%)] py-8">Nenhuma transação encontrada.</div>
        ) : days.map(([day, items]) => {
          const dayTotal = items.reduce((s, t) => t.type === "receita" ? s + t.amount : s - t.amount, 0);
          return (
            <div key={day}>
              {/* Day divider */}
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-[11px] font-semibold text-[hsl(220_10%_50%)] uppercase tracking-wider">{day}</span>
                <div className="flex-1 h-px bg-[hsl(220_20%_13%)]" />
                <span className={`text-[11px] font-semibold tabular-nums ${dayTotal >= 0 ? "text-emerald-400/70" : "text-rose-400/70"}`}>
                  {dayTotal >= 0 ? "+" : ""}{fmt(dayTotal)}
                </span>
              </div>

              {/* Items for that day */}
              <div className="bg-[hsl(220_22%_10%)] border border-[hsl(220_20%_15%)] rounded-xl overflow-hidden">
                <div className="divide-y divide-[hsl(220_20%_13%)]">
                  {items.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(220_20%_12%)] transition-colors cursor-pointer group">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${t.type === "receita" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                        {t.type === "receita" ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-rose-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">{t.name}</p>
                          {t.is_recurring && (
                            <span className="text-[9px] font-semibold text-[hsl(220_10%_46%)] bg-[hsl(220_20%_14%)] rounded-full px-1.5 py-0.5 shrink-0">FIXA</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[hsl(220_10%_46%)]">{t.category} · {t.account}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${t.status === "pago" || t.status === "recebido" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                        <span className={`h-1 w-1 rounded-full ${t.status === "pago" || t.status === "recebido" ? "bg-emerald-400" : "bg-amber-400"}`} />
                        {t.status}
                      </span>
                      <p className={`text-sm font-bold tabular-nums shrink-0 ${t.type === "receita" ? "text-emerald-400" : "text-rose-400"}`}>
                        {t.type === "receita" ? "+" : "-"}{fmt(t.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
