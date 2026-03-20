import { useState } from "react";
import { useCategories } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { CreateCategoryDialog } from "@/components/dialogs/CreateCategoryDialog";
import { EditCategoryDialog } from "@/components/dialogs/EditCategoryDialog";
import { TrendingUp, TrendingDown, Tags, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

const Categories = () => {
  const { data: categories = [], isLoading } = useCategories();
  const [editing, setEditing] = useState<Tables<"categories"> | null>(null);
  const receitas = categories.filter((c) => c.type === "receita");
  const despesas = categories.filter((c) => c.type === "despesa");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Categorias</h1>
          <p className="mt-1 text-muted-foreground">
            Organize suas transacoes por categoria
          </p>
        </div>
        <CreateCategoryDialog />
      </div>

      {/* Summary */}
      {categories.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Tags className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{categories.length}</p>
                <p className="text-xs text-muted-foreground">categorias</p>
              </div>
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
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="text-2xl font-bold text-foreground">{receitas.length}</p>
                <p className="text-xs text-muted-foreground">categorias</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                <TrendingDown className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-foreground">{despesas.length}</p>
                <p className="text-xs text-muted-foreground">categorias</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground text-sm">
          Carregando...
        </div>
      ) : categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Tags className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Nenhuma categoria cadastrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie categorias para organizar suas transacoes.
          </p>
          <Button className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Criar primeira categoria
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Receitas */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border bg-card overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Receitas</h3>
                  <p className="text-xs text-muted-foreground">{receitas.length} categorias</p>
                </div>
              </div>
            </div>
            {receitas.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhuma categoria de receitas.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {receitas.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30 cursor-pointer group"
                    onClick={() => setEditing(cat)}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-lg shrink-0"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{cat.name}</p>
                    </div>
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Despesas */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border bg-card overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Despesas</h3>
                  <p className="text-xs text-muted-foreground">{despesas.length} categorias</p>
                </div>
              </div>
            </div>
            {despesas.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhuma categoria de despesas.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {despesas.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30 cursor-pointer group"
                    onClick={() => setEditing(cat)}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-lg shrink-0"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{cat.name}</p>
                    </div>
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      <EditCategoryDialog category={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
};

export default Categories;
