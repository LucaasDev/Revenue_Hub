

## Plano: Dicas Financeiras com IA — Atualização Automática

Mesmo plano anterior, com uma mudança: remover o botão "Atualizar análise" e fazer a análise atualizar automaticamente sempre que o usuário navegar para a página.

### Mudança no comportamento

- No hook `useFinancialInsights.ts`: usar `staleTime: 0` e `refetchOnMount: 'always'` no React Query, garantindo que toda vez que o componente montar (navegação para a página), uma nova chamada é feita
- Manter `gcTime` (cacheTime) de 5 minutos para evitar flash de loading em navegações rápidas de ida e volta
- Remover botão "Atualizar análise" do componente `FinancialInsights.tsx`
- Skeleton loading aparece apenas no primeiro carregamento; em refetches subsequentes, os dados anteriores permanecem visíveis enquanto os novos carregam (comportamento padrão do React Query com `keepPreviousData`)

### Arquivos (mesmos do plano original)

| Ação | Arquivo |
|------|---------|
| Criar | `supabase/functions/financial-insights/index.ts` |
| Criar | `src/components/FinancialInsights.tsx` (sem botão de refresh) |
| Criar | `src/hooks/useFinancialInsights.ts` (refetch on mount) |
| Editar | `src/pages/Index.tsx` |

