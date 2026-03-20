import { useState } from "react";
import { useAccounts } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Landmark, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, Plus } from "lucide-react";
import { CreateAccountDialog } from "@/components/dialogs/CreateAccountDialog";
import { EditAccountDialog } from "@/components/dialogs/EditAccountDialog";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const ACCOUNT_CONFIG: Record<string, { icon: React.ElementType; label: string; gradient: string }> = {
  corrente: { icon: Landmark, label: "Conta Corrente", gradient: "from-blue-500/20 to-blue-500/5" },
  carteira: { icon: Wallet, label: "Carteira", gradient: "from-amber-500/20 to-amber-500/5" },
  investimento: { icon: TrendingUp, label: "Investimento", gradient: "from-emerald-500/20 to-emerald-500/5" },
};

const Accounts = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const [editing, setEditing] = useState<Tables<"accounts"> | null>(null);
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Contas</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie suas contas bancarias e carteiras
          </p>
        </div>
        <CreateAccountDialog />
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patrimonio Total</p>
              <p className={cn(
                "text-3xl font-bold tracking-tight",
                totalBalance >= 0 ? "text-foreground" : "text-rose-500"
              )}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="text-muted-foreground">Contas</p>
              <p className="text-xl font-semibold text-foreground">{accounts.length}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-muted-foreground">Positivas</p>
              <p className="text-xl font-semibold text-emerald-500">
                {accounts.filter(a => Number(a.balance) >= 0).length}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground text-sm">
          Carregando...
        </div>
      ) : accounts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Landmark className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Nenhuma conta cadastrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione uma conta para comecar a registrar suas transacoes.
          </p>
          <Button className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Criar primeira conta
          </Button>
        </motion.div>
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
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={cn(
                  "group cursor-pointer rounded-xl border bg-gradient-to-br p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30",
                  cfg.gradient
                )}
                onClick={() => setEditing(account)}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background/80 border border-border/50 shrink-0">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  </div>
                </div>

                {/* Balance */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Saldo atual</p>
                    <p className={cn(
                      "text-2xl font-bold tabular-nums",
                      Number(account.balance) >= 0 ? "text-foreground" : "text-rose-500"
                    )}>
                      {formatCurrency(Number(account.balance))}
                    </p>
                  </div>

                  <div className="h-px bg-border/50" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Saldo inicial</p>
                      <p className="text-xs font-medium text-muted-foreground tabular-nums">
                        {formatCurrency(Number(account.initial_balance))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground">Variacao</p>
                      <p className={cn(
                        "text-xs font-semibold flex items-center gap-0.5 justify-end tabular-nums",
                        isPositive ? "text-emerald-500" : "text-rose-500"
                      )}>
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
