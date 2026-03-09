import { mockAccounts } from "@/data/mockData";
import { motion } from "framer-motion";
import { Plus, Landmark, Wallet, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const iconMap = {
  corrente: Landmark,
  carteira: Wallet,
  investimento: TrendingUp,
};

const Accounts = () => {
  const totalBalance = mockAccounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contas</h1>
          <p className="text-sm text-muted-foreground">Saldo total: {formatCurrency(totalBalance)}</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Conta</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockAccounts.map((account, i) => {
          const Icon = iconMap[account.type];
          return (
            <motion.div key={account.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{account.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(account.balance)}</p>
              <p className="text-xs text-muted-foreground mt-1">Saldo inicial: {formatCurrency(account.initialBalance)}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Accounts;
