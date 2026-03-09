import { motion } from "framer-motion";
import { Crown, Check } from "lucide-react";

const plans = [
  { name: "Gratuito", price: "R$ 0", features: ["1 conta", "50 transações/mês", "Categorias básicas"], current: false },
  { name: "Pro", price: "R$ 29,90", features: ["Contas ilimitadas", "Transações ilimitadas", "Relatórios avançados", "Metas financeiras", "Cartões"], current: true },
  { name: "Business", price: "R$ 59,90", features: ["Tudo do Pro", "Multi-usuários", "IA financeira", "API access", "Suporte prioritário"], current: false },
];

const Subscriptions = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Assinaturas</h1>
        <p className="text-sm text-muted-foreground">Gerencie seu plano</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan, i) => (
          <motion.div key={plan.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`glass-card rounded-xl p-5 ${plan.current ? "border-primary ring-1 ring-primary/20" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{plan.name}</span>
              {plan.current && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Atual</span>}
            </div>
            <p className="text-2xl font-bold text-foreground mb-4">{plan.price}<span className="text-sm text-muted-foreground font-normal">/mês</span></p>
            <ul className="space-y-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-success" /> {f}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Subscriptions;
