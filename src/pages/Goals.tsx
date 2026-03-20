import { useState } from "react";
import { useGoals } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Target, CalendarDays, CheckCircle2, Trophy, Rocket, Plus } from "lucide-react";
import { CreateGoalDialog } from "@/components/dialogs/CreateGoalDialog";
import { EditGoalDialog } from "@/components/dialogs/EditGoalDialog";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const Goals = () => {
  const { data: goals = [], isLoading } = useGoals();
  const [editing, setEditing] = useState<Tables<"goals"> | null>(null);

  const totalCurrent = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const completedCount = goals.filter((g) => Number(g.current_amount) >= Number(g.target_amount)).length;
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Metas Financeiras</h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhe o progresso dos seus objetivos
          </p>
        </div>
        <CreateGoalDialog />
      </div>

      {/* Summary Cards */}
      {goals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Reservado</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(totalCurrent)}</p>
                <p className="text-xs text-muted-foreground">de {formatCurrency(totalTarget)}</p>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-primary/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <Trophy className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Metas Concluidas</p>
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground">de {goals.length} metas</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                <Target className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold text-foreground">{goals.length - completedCount}</p>
                <p className="text-xs text-muted-foreground">metas ativas</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Goals Grid */}
      {isLoading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground text-sm">
          Carregando...
        </div>
      ) : goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Nenhuma meta cadastrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie sua primeira meta financeira para comecar a acompanhar seu progresso.
          </p>
          <Button className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Criar primeira meta
          </Button>
        </motion.div>
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
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={cn(
                  "group cursor-pointer rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/30",
                  isComplete && "border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent"
                )}
                onClick={() => setEditing(goal)}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl shrink-0",
                    isComplete ? "bg-emerald-500/15" : "bg-primary/10"
                  )}>
                    {isComplete
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : <Target className="h-5 w-5 text-primary" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{goal.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      <p className={cn("text-xs", isOverdue ? "text-rose-500" : "text-muted-foreground")}>
                        {isOverdue
                          ? `Venceu ha ${Math.abs(daysLeft)} dias`
                          : daysLeft === 0
                          ? "Vence hoje"
                          : `${daysLeft} dias restantes`
                        }
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-bold shrink-0 tabular-nums",
                    isComplete ? "text-emerald-500" : progress > 50 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {progress.toFixed(0)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-3">
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        isComplete
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                          : "bg-gradient-to-r from-primary to-primary/70"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-lg font-bold text-foreground tabular-nums">
                        {formatCurrency(Number(goal.current_amount))}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        de {formatCurrency(Number(goal.target_amount))}
                      </p>
                    </div>
                    {!isComplete && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Faltam {formatCurrency(remaining)}
                      </p>
                    )}
                    {isComplete && (
                      <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                        Concluida
                      </span>
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
