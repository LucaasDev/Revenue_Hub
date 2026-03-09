import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

const SettingsAccounts = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Contas (Config)</h1>
        <p className="text-sm text-muted-foreground">Configurações de contas do sistema</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Configurações de contas em breve</span>
        </div>
        <p className="text-sm text-muted-foreground">Gerencie configurações avançadas das suas contas bancárias.</p>
      </motion.div>
    </div>
  );
};

export default SettingsAccounts;
