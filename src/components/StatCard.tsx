import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant: "income" | "expense" | "balance" | "pending";
  delay?: number;
}

const variantStyles = {
  income: "gradient-income",
  expense: "gradient-expense",
  balance: "gradient-primary",
  pending: "gradient-pending",
};

export function StatCard({ title, value, subtitle, icon: Icon, variant, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", variantStyles[variant])}>
            <Icon className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
