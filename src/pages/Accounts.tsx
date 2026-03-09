import { useState } from "react";
import { useAccounts } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Landmark, Wallet, TrendingUp } from "lucide-react";
import { CreateAccountDialog } from "@/components/dialogs/CreateAccountDialog";
import { EditAccountDialog } from "@/components/dialogs/EditAccountDialog";
import type { Tables } from "@/integrations/supabase/types";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const iconMap: Record<string, any> = { corrente: Landmark, carteira: Wallet, investimento: TrendingUp };

const Accounts = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const [editing, setEditing] = useState<Tables<"accounts"> | null>(null);
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contas</h1>
          <p className="text-sm text-muted-foreground">Saldo total: {formatCurrency(totalBalance)}</p>
        </div>
        <CreateAccountDialog />
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : accounts.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhuma conta cadastrada.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account, i) => {
            const Icon = iconMap[account.type] || Landmark;
            return (
              <motion.div key={account.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setEditing(account)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{account.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(Number(account.balance))}</p>
                <p className="text-xs text-muted-foreground mt-1">Saldo inicial: {formatCurrency(Number(account.initial_balance))}</p>
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
