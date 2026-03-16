

## Plano: Arquitetura Multi-Tenant + Painel Admin

### Visão Geral

Transformar a aplicação em multi-tenant reutilizando `family_groups` como tabela de tenants (renomeada conceitualmente), adicionando `tenant_id` a todas as tabelas de dados e criando um painel administrativo exclusivo.

---

### 1. Banco de Dados (Migration SQL)

**Alterações nas tabelas existentes:**
- Adicionar coluna `tenant_id UUID REFERENCES family_groups(id)` em: `accounts`, `transactions`, `goals`, `categories`, `cards`
- Popular `tenant_id` com base no `user_id` existente (via `family_members` → `family_id`)
- Tornar `tenant_id NOT NULL` após população

**Nova tabela `tenants` (view ou rename):**
- Adicionar colunas em `family_groups`: `status TEXT DEFAULT 'active'`, `plan TEXT DEFAULT 'free'`
- Isso transforma `family_groups` no registro do tenant

**Função helper:**
```sql
CREATE FUNCTION get_user_tenant_id(_user_id uuid) RETURNS uuid
-- Retorna family_id do usuário via family_members
```

**Atualizar RLS policies** em todas as tabelas:
- SELECT/INSERT/UPDATE/DELETE filtram por `tenant_id = get_user_tenant_id(auth.uid())`
- Remover políticas antigas baseadas em `user_id` + `is_family_member`

**Trigger automático:**
- Na criação de transação/conta/etc, preencher `tenant_id` automaticamente via trigger

**Função admin (security definer):**
```sql
CREATE FUNCTION is_global_admin(_user_id uuid) RETURNS boolean
-- Verifica se o email do usuário é lucas.oliveira1805k@gmail.com via auth.users
```

**Funções RPC para o painel admin** (security definer):
- `admin_get_tenants()` — lista todos os tenants com contagem de membros
- `admin_get_users()` — lista todos os usuários com status
- `admin_toggle_user(user_id, active)` — ativa/desativa usuário
- `admin_get_stats()` — retorna totais (tenants, usuários, transações, metas)
- `admin_get_growth()` — retorna dados de crescimento mensal

---

### 2. AuthContext

- Adicionar `isGlobalAdmin` ao contexto, verificado via `supabase.rpc('is_global_admin')`
- Diferente de `isAdmin` (admin de família), `isGlobalAdmin` controla acesso ao painel

---

### 3. Frontend — Painel Admin

**Novas páginas:**
- `src/pages/admin/AdminDashboard.tsx` — Dashboard com cards de indicadores (total tenants, usuários, transações, metas) + gráfico de crescimento
- `src/pages/admin/AdminTenants.tsx` — Tabela de tenants com nome, proprietário, membros, status, data de criação
- `src/pages/admin/AdminUsers.tsx` — Tabela de usuários com email, tenant, status (ativo/inativo), ações (ativar/desativar)

**Layout:**
- `src/components/admin/AdminLayout.tsx` — Layout com navegação lateral (Dashboard, Tenants, Usuários)

**Rotas (App.tsx):**
```
/admin → AdminDashboard
/admin/tenants → AdminTenants
/admin/users → AdminUsers
```
- Protegidas por `isGlobalAdmin`

---

### 4. Navegação

No `AppTopNav.tsx`, no dropdown do usuário (onde já existe "Meu Perfil"):
- Adicionar item **"Admin"** com ícone `Shield`, visível apenas quando `isGlobalAdmin === true`
- Link para `/admin`

---

### 5. Hook de dados admin

- `src/hooks/useAdminData.ts` — hooks React Query chamando as RPCs admin (stats, tenants, users, growth)

---

### Resumo de arquivos

| Ação | Arquivo |
|------|---------|
| Migration | `supabase/migrations/xxx.sql` |
| Editar | `src/contexts/AuthContext.tsx` (isGlobalAdmin) |
| Editar | `src/components/AppTopNav.tsx` (link Admin) |
| Editar | `src/App.tsx` (rotas admin) |
| Criar | `src/hooks/useAdminData.ts` |
| Criar | `src/components/admin/AdminLayout.tsx` |
| Criar | `src/pages/admin/AdminDashboard.tsx` |
| Criar | `src/pages/admin/AdminTenants.tsx` |
| Criar | `src/pages/admin/AdminUsers.tsx` |

