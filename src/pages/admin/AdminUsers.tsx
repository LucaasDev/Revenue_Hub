import { useAdminUsers, useToggleUser } from "@/hooks/useAdminData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const { data: users = [], isLoading } = useAdminUsers();
  const toggleUser = useToggleUser();
  const { toast } = useToast();

  const handleToggle = async (userId: string, currentActive: boolean) => {
    try {
      await toggleUser.mutateAsync({ userId, active: !currentActive });
      toast({ title: !currentActive ? "Usuário ativado" : "Usuário desativado" });
    } catch {
      toast({ title: "Erro ao alterar status", variant: "destructive" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/40">
        <h3 className="text-sm font-semibold text-foreground">Usuários da Plataforma</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{users.length} usuário(s)</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último acesso</TableHead>
            <TableHead>Cadastro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
          ) : users.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum usuário cadastrado.</TableCell></TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-foreground">{u.display_name || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{u.tenant_name || "—"}</TableCell>
                <TableCell>
                  <Badge variant={u.is_active ? "default" : "destructive"}>
                    {u.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={u.is_active ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggle(u.id, u.is_active)}
                    disabled={toggleUser.isPending}
                  >
                    {u.is_active ? "Desativar" : "Ativar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </motion.div>
  );
}
