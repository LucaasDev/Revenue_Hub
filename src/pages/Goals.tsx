import { useState } from "react";
import { useGoals } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Target, CalendarDays, CheckCircle2 } from "lucide-react";
import { CreateGoalDialog } from "@/components/dialogs/CreateGoalDialog";
import { EditGoalDialog } from "@/components/dialogs/EditGoalDialog";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const Goals = () => {
  const { data: goals = [], isLoading } = useGoals();
  const [editing, setEditing] = useState<Tables<"goals"> | null>(null);

  const totalCurrent = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const completedCount = goals.filter((g) => Number(g.current_amount) >= Number(g.target_amount)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Metas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {goals.length} meta{goals.length !== 1 ? "s" : ""} · {formatCurrency(totalCurrent)} de {formatCurrency(totalTarget)} reservados
          </p>
        </div>
        <CreateGoalDialog />
      </div>

      {goals.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total de metas", value: goals.length.toString(), sub: "cadastradas" },
            { label: "Reservado", value: formatCurrency(totalCurrent), sub: `de ${formatCurrency(totalTarget)}` },
            { label: "Concluídas", value: completedCount.toString(), sub: `de ${goals.length}` },
          ].map((item) => (
            <div key={item.label} className="glass-card rounded-xl p-4">
              <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
              <p className="text-xl font-bold text-foreground mt-1 tabular-nums">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="glass-card rounded-xl p-10 text-center text-muted-foreground text-sm">Carregando...</div>
      ) : goals.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Target className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Nenhuma meta cadastrada</p>
          <p className="text-xs text-muted-foreground mt-1">Crie sua primeira meta financeira para começar a acompanhar seu progresso.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal, i) => {
            const progress = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
            const remaining = Math.max(Number(goal.target_amount) - Number(goal.current_amount), 0);
            const isComplete = progress >= 100;
            const deadlineDate = new Date(goal.deadline);
            const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysLeft < 0 && !isComplete;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "glass-card rounded-xl p-5 hover:border-primary/40 transition-all cursor-pointer group",
                  isComplete && "border-emerald-500/30"
                )}
                onClick={() => setEditing(goal)}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                    isComplete ? "bg-emerald-500/15" : "bg-primary/10"
                  )}>
                    {isComplete
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      : <Target className="h-5 w-5 text-primary" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{goal.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      <p className={cn("text-xs", isOverdue ? "text-rose-400" : "text-muted-foreground")}>
                        {isOverdue
                          ? `Venceu há ${Math.abs(daysLeft)} dias`
                          : daysLeft === 0
                          ? "Vence hoje"
                          : `${daysLeft} dias restantes`
                        }
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs font-bold shrink-0 tabular-nums",
                    isComplete ? "text-emerald-400" : progress > 50 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {progress.toFixed(0)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-2.5">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        isComplete
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                          : "bg-gradient-to-r from-primary to-emerald-400"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-base font-bold text-foreground tabular-nums">{formatCurrency(Number(goal.current_amount))}</p>
                      <p className="text-[11px] text-muted-foreground">de {formatCurrency(Number(goal.target_amount))}</p>
                    </div>
                    {!isComplete && (
                      <p className="text-[11px] text-muted-foreground tabular-nums">Faltam {formatCurrency(remaining)}</p>
                    )}
                    {isComplete && (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Concluída</span>
                    )}
                  </div>
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
