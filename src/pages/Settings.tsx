import { motion } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Preferências do sistema</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Configurações gerais em breve</span>
        </div>
        <p className="text-sm text-muted-foreground">Funcionalidades de configuração serão adicionadas em breve, incluindo preferências de moeda, notificações e convites.</p>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
