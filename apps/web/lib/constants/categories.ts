/**
 * Referência das categorias padrão (seed).
 * Usado no frontend para exibir ícones/cores antes de carregar do banco.
 */
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Alimentação',  icon: 'utensils',       color: '#EF4444' },
  { name: 'Transporte',   icon: 'car',            color: '#F97316' },
  { name: 'Moradia',      icon: 'home',           color: '#EAB308' },
  { name: 'Saúde',        icon: 'heart-pulse',    color: '#EC4899' },
  { name: 'Educação',     icon: 'graduation-cap', color: '#8B5CF6' },
  { name: 'Lazer',        icon: 'gamepad-2',      color: '#06B6D4' },
  { name: 'Vestuário',    icon: 'shirt',          color: '#14B8A6' },
  { name: 'Serviços',     icon: 'wrench',         color: '#6366F1' },
  { name: 'Outros',       icon: 'ellipsis',       color: '#6B7280' },
] as const

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salário',        icon: 'briefcase',    color: '#22C55E' },
  { name: 'Freelance',      icon: 'laptop',       color: '#10B981' },
  { name: 'Investimentos',  icon: 'trending-up',  color: '#3B82F6' },
  { name: 'Presente',       icon: 'gift',         color: '#A855F7' },
  { name: 'Outros',         icon: 'ellipsis',     color: '#6B7280' },
] as const
