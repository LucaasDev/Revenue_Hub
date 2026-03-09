import { useState } from "react";
import { useGoals } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { CreateGoalDialog } from "@/components/dialogs/CreateGoalDialog";
import { EditGoalDialog } from "@/components/dialogs/EditGoalDialog";
import type { Tables } from "@/integrations/supabase/types";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const Goals = () => {
  const { data: goals = [], isLoading } = useGoals();
  const [editing, setEditing] = useState<Tables<"goals"> | null>(null);

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
                className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setEditing(goal)}>
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
      <EditGoalDialog goal={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
};

export default Goals;
