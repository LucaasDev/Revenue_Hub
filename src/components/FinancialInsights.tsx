import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Lightbulb, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import { useFinancialInsights, Insight } from "@/hooks/useFinancialInsights";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const insightConfig: Record<Insight["type"], { icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  alert: { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  tip: { icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  praise: { icon: Trophy, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 71 ? "stroke-emerald-500" : score >= 41 ? "stroke-amber-500" : "stroke-rose-500";
  const textColor = score >= 71 ? "text-emerald-500" : score >= 41 ? "text-amber-500" : "text-rose-500";
  const label = score >= 71 ? "Excelente" : score >= 41 ? "Regular" : "Atencao";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          className={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold tabular-nums", textColor)}>{score}</span>
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function FinancialInsights() {
  const { data, isLoading, error, isFetching } = useFinancialInsights();

  if (error && !data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="rounded-xl border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Insights com IA</h3>
            <p className="text-xs text-muted-foreground">Analise personalizada</p>
          </div>
        </div>
        {isFetching && !isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Atualizando
          </div>
        )}
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="flex gap-6">
            <Skeleton className="h-24 w-24 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        ) : data ? (
          <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
            {/* Score Section */}
            <div className="flex flex-col items-center gap-3 lg:w-32 shrink-0">
              <ScoreRing score={data.health_score} />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span>Saude Financeira</span>
              </div>
            </div>

            {/* Insights Section */}
            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>

              <div className="space-y-2">
                {data.insights.map((insight, i) => {
                  const config = insightConfig[insight.type];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30",
                        config.border
                      )}
                    >
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", config.bg)}>
                        <span className="text-base">{insight.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                Ver analise completa
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
