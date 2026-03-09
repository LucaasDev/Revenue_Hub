import { useAccounts, useDeleteAccount } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Plus, Landmark, Wallet, TrendingUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const iconMap = { corrente: Landmark, carteira: Wallet, investimento: TrendingUp };

const Accounts = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const deleteAccount = useDeleteAccount();

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contas</h1>
          <p className="text-sm text-muted-foreground">Saldo total: {formatCurrency(totalBalance)}</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Conta</Button>
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
                className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors group relative">
                <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteAccount.mutate(account.id, { onSuccess: () => toast.success("Conta excluída") })}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
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
    </div>
  );
};

export default Accounts;
