import { useGoals, useDeleteGoal } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateGoalDialog } from "@/components/dialogs/CreateGoalDialog";
import { toast } from "sonner";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const Goals = () => {
  const { data: goals = [], isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Metas</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus objetivos financeiros</p>
        </div>
        <CreateGoalDialog />
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : goals.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhuma meta cadastrada.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal, i) => {
            const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
            const remaining = Number(goal.target_amount) - Number(goal.current_amount);
            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors group relative">
                <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteGoal.mutate(goal.id, { onSuccess: () => toast.success("Meta excluída") })}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
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
                    <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(Number(goal.current_amount))}</span>
                    <span>{formatCurrency(Number(goal.target_amount))}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">Faltam {formatCurrency(remaining)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Goals;
