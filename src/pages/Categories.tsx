import { useState } from "react";
import { useCategories } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { CreateCategoryDialog } from "@/components/dialogs/CreateCategoryDialog";
import { EditCategoryDialog } from "@/components/dialogs/EditCategoryDialog";
import type { Tables } from "@/integrations/supabase/types";

const Categories = () => {
  const { data: categories = [], isLoading } = useCategories();
  const [editing, setEditing] = useState<Tables<"categories"> | null>(null);
  const receitas = categories.filter(c => c.type === "receita");
  const despesas = categories.filter(c => c.type === "despesa");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Categorias</h1>
          <p className="text-sm text-muted-foreground">Organize suas transações por categoria</p>
        </div>
        <CreateCategoryDialog />
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : categories.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhuma categoria cadastrada.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {[{ title: "Receitas", items: receitas }, { title: "Despesas", items: despesas }].map((group) => (
            <motion.div key={group.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">{group.title}</h3>
              {group.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma categoria de {group.title.toLowerCase()}.</p>
              ) : (
                <div className="space-y-2">
                  {group.items.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setEditing(cat)}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                      </div>
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      <EditCategoryDialog category={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
};

export default Categories;
