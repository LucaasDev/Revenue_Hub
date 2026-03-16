import { useAdminTenants } from "@/hooks/useAdminData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function AdminTenants() {
  const { data: tenants = [], isLoading } = useAdminTenants();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/40">
        <h3 className="text-sm font-semibold text-foreground">Tenants Cadastrados</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{tenants.length} tenant(s)</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Proprietário</TableHead>
            <TableHead className="text-center">Membros</TableHead>
            <TableHead className="text-center">Transações</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
          ) : tenants.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum tenant cadastrado.</TableCell></TableRow>
          ) : (
            tenants.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium text-foreground">{t.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{t.owner_email}</TableCell>
                <TableCell className="text-center">{t.member_count}</TableCell>
                <TableCell className="text-center">{t.transaction_count}</TableCell>
                <TableCell>
                  <Badge variant={t.status === "active" ? "default" : "secondary"}>
                    {t.status === "active" ? "Ativo" : t.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{t.plan}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(t.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </motion.div>
  );
}
