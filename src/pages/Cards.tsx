import { useCards, useDeleteCard } from "@/hooks/useSupabaseData";
import { motion } from "framer-motion";
import { Plus, CreditCard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const Cards = () => {
  const { data: cards = [], isLoading } = useCards();
  const deleteCard = useDeleteCard();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cartões</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus cartões de crédito</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Cartão</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : cards.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhum cartão cadastrado.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card, i) => (
            <motion.div key={card.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors group relative">
              <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteCard.mutate(card.id, { onSuccess: () => toast.success("Cartão excluído") })}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                  <CreditCard className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{card.name}</p>
                  <p className="text-xs text-muted-foreground">Fecha dia {card.closing_day} · Vence dia {card.due_day}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Limite: <span className="font-semibold text-foreground">{formatCurrency(Number(card.limit))}</span></p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cards;
