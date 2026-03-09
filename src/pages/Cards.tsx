import { mockCards } from "@/data/mockData";
import { motion } from "framer-motion";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const Cards = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cartões</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus cartões de crédito</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Cartão</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {mockCards.map((card, i) => {
          const usedPercent = (card.usedAmount / card.limit) * 100;
          return (
            <motion.div key={card.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                  <CreditCard className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{card.name}</p>
                  <p className="text-xs text-muted-foreground">Fecha dia {card.closingDay} · Vence dia {card.dueDay}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usado</span>
                  <span className="font-semibold text-foreground">{formatCurrency(card.usedAmount)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${usedPercent}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{usedPercent.toFixed(0)}% utilizado</span>
                  <span>Limite: {formatCurrency(card.limit)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Cards;
