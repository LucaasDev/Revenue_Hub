import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Lightbulb, Trophy } from "lucide-react";
import { useFinancialInsights, Insight } from "@/hooks/useFinancialInsights";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const insightConfig: Record<Insight["type"], { icon: typeof AlertTriangle; color: string; bg: string }> = {
  alert: { icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10" },
  tip: { icon: Lightbulb, color: "text-amber-400", bg: "bg-amber-500/10" },
  praise: { icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 71 ? "text-emerald-400" : score >= 41 ? "text-amber-400" : "text-rose-400";
  const bg = score >= 71 ? "bg-emerald-500/10" : score >= 41 ? "bg-amber-500/10" : "bg-rose-500/10";
  const label = score >= 71 ? "Boa" : score >= 41 ? "Regular" : "Atenção";

  return (
    <div className={cn("flex items-center gap-2 rounded-full px-3 py-1.5", bg)}>
      <span className={cn("text-xl font-bold tabular-nums", color)}>{score}</span>
      <span className={cn("text-xs font-medium", color)}>{label}</span>
    </div>
  );
}

export function FinancialInsights() {
  const { data, isLoading, error, isFetching } = useFinancialInsights();

  if (error && !data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-card rounded-xl overflow-hidden relative"
    >
      {isFetching && !isLoading && (
        <div className="absolute top-3 right-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      )}

      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Dicas Financeiras com IA</h3>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <ScoreBadge score={data.health_score} />
              <p className="text-sm text-muted-foreground flex-1">{data.summary}</p>
            </div>

            <div className="space-y-2.5">
              {data.insights.map((insight, i) => {
                const config = insightConfig[insight.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-start gap-3 rounded-lg p-3 bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", config.bg)}>
                      <span className="text-base">{insight.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
