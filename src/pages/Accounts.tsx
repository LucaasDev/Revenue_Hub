import { useState } from "react";
import { useAccounts } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Landmark, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { CreateAccountDialog } from "@/components/dialogs/CreateAccountDialog";
import { EditAccountDialog } from "@/components/dialogs/EditAccountDialog";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const ACCOUNT_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  corrente: { icon: Landmark, label: "Conta Corrente", color: "text-blue-400", bg: "bg-blue-500/10" },
  carteira: { icon: Wallet, label: "Carteira", color: "text-amber-400", bg: "bg-amber-500/10" },
  investimento: { icon: TrendingUp, label: "Investimento", color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

const Accounts = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const [editing, setEditing] = useState<Tables<"accounts"> | null>(null);
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {accounts.length} conta{accounts.length !== 1 ? "s" : ""} · Saldo total:{" "}
            <span className={cn("font-semibold", totalBalance >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {formatCurrency(totalBalance)}
            </span>
          </p>
        </div>
        <CreateAccountDialog />
      </div>

      {isLoading ? (
        <div className="glass-card rounded-xl p-10 text-center text-muted-foreground text-sm">Carregando...</div>
      ) : accounts.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Landmark className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Nenhuma conta cadastrada</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione uma conta para começar a registrar suas transações.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account, i) => {
            const cfg = ACCOUNT_CONFIG[account.type] || ACCOUNT_CONFIG.corrente;
            const Icon = cfg.icon;
            const net = Number(account.balance) - Number(account.initial_balance);
            const isPositive = net >= 0;

            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card rounded-xl p-5 hover:border-primary/40 transition-all cursor-pointer group"
                onClick={() => setEditing(account)}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0", cfg.bg)}>
                    <Icon className={cn("h-5 w-5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  </div>
                </div>

                {/* Balance */}
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Saldo atual</p>
                    <p className={cn("text-2xl font-bold tabular-nums", Number(account.balance) >= 0 ? "text-foreground" : "text-rose-400")}>
                      {formatCurrency(Number(account.balance))}
                    </p>
                  </div>

                  <div className="h-px bg-border/40" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Saldo inicial</p>
                      <p className="text-xs font-medium text-muted-foreground tabular-nums">{formatCurrency(Number(account.initial_balance))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground">Variação</p>
                      <p className={cn("text-xs font-semibold flex items-center gap-0.5 justify-end tabular-nums", isPositive ? "text-emerald-400" : "text-rose-400")}>
                        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {formatCurrency(Math.abs(net))}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <EditAccountDialog account={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
};

export default Accounts;
