import { mockGoals } from "@/data/mockData";
import { motion } from "framer-motion";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const Goals = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Metas</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus objetivos financeiros</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Meta</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockGoals.map((goal, i) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const remaining = goal.targetAmount - goal.currentAmount;
          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                  <Target className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{goal.name}</p>
                  <p className="text-xs text-muted-foreground">até {new Date(goal.deadline).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold text-foreground">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(goal.currentAmount)}</span>
                  <span>{formatCurrency(goal.targetAmount)}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">Faltam {formatCurrency(remaining)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Goals;
