import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Shield, Pencil, Eye, RotateCcw, XCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEnsureFamily,
  useFamilyMembers,
  useFamilyInvites,
  useFamilyGroup,
  useCancelFamilyInvite,
  useResendFamilyInvite,
} from "@/hooks/useFamilyData";
import { InviteFamilyMemberDialog } from "@/components/dialogs/InviteFamilyMemberDialog";
import { EditFamilyMemberDialog } from "@/components/dialogs/EditFamilyMemberDialog";
import { toast } from "sonner";

const roleConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Administrador", icon: Shield, variant: "default" },
  editor: { label: "Editor", icon: Pencil, variant: "secondary" },
  viewer: { label: "Visualizador", icon: Eye, variant: "outline" },
};

const FamilyMembers = () => {
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);

  // Ensure family exists
  useEnsureFamily();
  const { data: familyGroup } = useFamilyGroup();
  const { data: members, isLoading: membersLoading } = useFamilyMembers();
  const { data: invites, isLoading: invitesLoading } = useFamilyInvites();
  const cancelInvite = useCancelFamilyInvite();
  const resendInvite = useResendFamilyInvite();

  const isOwner = familyGroup?.owner_id === user?.id;
  const pendingInvites = invites?.filter((i) => i.status === "pending") || [];

  const handleCancelInvite = async (id: string) => {
    try {
      await cancelInvite.mutateAsync(id);
      toast.success("Convite cancelado");
    } catch {
      toast.error("Erro ao cancelar convite");
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      await resendInvite.mutateAsync(id);
      toast.success("Convite reenviado");
    } catch {
      toast.error("Erro ao reenviar convite");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Membros da Família
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie quem tem acesso ao controle financeiro familiar
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" /> Adicionar Membro
          </Button>
        )}
      </motion.div>

      {/* Active members */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground">Membros Ativos</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead>Permissão</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !members?.length ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum membro encontrado</TableCell></TableRow>
            ) : (
              members.map((m) => {
                const rc = roleConfig[m.role] || roleConfig.viewer;
                const isSelf = m.user_id === user?.id;
                const isThisOwner = m.user_id === familyGroup?.owner_id;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {m.user_id.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            {isSelf ? "Você" : `Membro`}
                            {isThisOwner && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                          </p>
                          <p className="text-xs text-muted-foreground">{m.user_id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rc.variant} className="gap-1">
                        <rc.icon className="h-3 w-3" />
                        {rc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(m.joined_at)}</TableCell>
                    <TableCell className="text-right">
                      {isOwner && !isSelf && (
                        <Button variant="ghost" size="sm" onClick={() => setEditMember(m)}>Editar</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h2 className="text-sm font-semibold text-foreground">Convites Pendentes</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvites.map((inv) => {
                const rc = roleConfig[inv.role] || roleConfig.viewer;
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="text-sm font-medium">{inv.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant={rc.variant} className="gap-1">
                        <rc.icon className="h-3 w-3" />
                        {rc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(inv.expires_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleResendInvite(inv.id)} disabled={resendInvite.isPending}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reenviar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleCancelInvite(inv.id)} disabled={cancelInvite.isPending}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </motion.div>
      )}

      <InviteFamilyMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <EditFamilyMemberDialog
        open={!!editMember}
        onOpenChange={(o) => !o && setEditMember(null)}
        member={editMember}
        isOwner={isOwner}
      />
    </div>
  );
};

export default FamilyMembers;
