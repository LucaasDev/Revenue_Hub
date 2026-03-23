export const mockTransactions = [
  { id: "1", name: "Salário", amount: 8500, type: "receita" as const, status: "recebido" as const, category: "Salário", account: "Nubank", dueDate: "2026-03-05", cardId: null },
  { id: "2", name: "Aluguel", amount: 2200, type: "despesa" as const, status: "pago" as const, category: "Moradia", account: "Inter", dueDate: "2026-03-10", cardId: null },
  { id: "3", name: "Supermercado", amount: 650, type: "despesa" as const, status: "pago" as const, category: "Alimentação", account: "Nubank", dueDate: "2026-03-08", cardId: "1" },
  { id: "4", name: "Internet", amount: 120, type: "despesa" as const, status: "pendente" as const, category: "Internet", account: "Inter", dueDate: "2026-03-15", cardId: null },
  { id: "5", name: "Freelance", amount: 3200, type: "receita" as const, status: "pendente" as const, category: "Freelance", account: "Nubank", dueDate: "2026-03-20", cardId: null },
  { id: "6", name: "Academia", amount: 89.90, type: "despesa" as const, status: "pago" as const, category: "Saúde", account: "Nubank", dueDate: "2026-03-05", cardId: "1" },
  { id: "7", name: "Uber", amount: 45.50, type: "despesa" as const, status: "pago" as const, category: "Transporte", account: "Nubank", dueDate: "2026-03-07", cardId: null },
  { id: "8", name: "Investimento CDB", amount: 1000, type: "despesa" as const, status: "pago" as const, category: "Investimentos", account: "Inter", dueDate: "2026-03-01", cardId: null },
];

export const mockAccounts = [
  { id: "1", name: "Nubank", type: "corrente" as const, balance: 12450.30, initialBalance: 5000 },
  { id: "2", name: "Inter", type: "corrente" as const, balance: 8320.15, initialBalance: 3000 },
  { id: "3", name: "Carteira", type: "carteira" as const, balance: 350.00, initialBalance: 0 },
  { id: "4", name: "XP Investimentos", type: "investimento" as const, balance: 25000.00, initialBalance: 20000 },
];

export const mockCards = [
  { id: "1", name: "Nubank Platinum", limit: 12000, closingDay: 3, dueDay: 10, accountId: "1", usedAmount: 3850 },
  { id: "2", name: "Inter Gold", limit: 8000, closingDay: 15, dueDay: 22, accountId: "2", usedAmount: 1200 },
];

export const mockGoals = [
  { id: "1", name: "Reserva de Emergência", targetAmount: 50000, currentAmount: 25000, deadline: "2026-12-31" },
  { id: "2", name: "Viagem Europa", targetAmount: 15000, currentAmount: 8500, deadline: "2026-08-01" },
  { id: "3", name: "Carro Novo", targetAmount: 80000, currentAmount: 12000, deadline: "2027-06-01" },
];

export const mockCategories = [
  { id: "1", name: "Salário", type: "receita" as const, color: "#10b981", icon: "💰" },
  { id: "2", name: "Freelance", type: "receita" as const, color: "#06b6d4", icon: "💻" },
  { id: "3", name: "Alimentação", type: "despesa" as const, color: "#f59e0b", icon: "🍔" },
  { id: "4", name: "Moradia", type: "despesa" as const, color: "#ef4444", icon: "🏠" },
  { id: "5", name: "Transporte", type: "despesa" as const, color: "#8b5cf6", icon: "🚗" },
  { id: "6", name: "Internet", type: "despesa" as const, color: "#3b82f6", icon: "🌐" },
  { id: "7", name: "Saúde", type: "despesa" as const, color: "#ec4899", icon: "💪" },
  { id: "8", name: "Investimentos", type: "despesa" as const, color: "#14b8a6", icon: "📈" },
];

export const monthlyData = [
  { month: "Out", receitas: 8500, despesas: 6200 },
  { month: "Nov", receitas: 9200, despesas: 7100 },
  { month: "Dez", receitas: 11500, despesas: 8900 },
  { month: "Jan", receitas: 8500, despesas: 5800 },
  { month: "Fev", receitas: 8800, despesas: 6500 },
  { month: "Mar", receitas: 11700, despesas: 4105 },
];

export const balanceEvolution = [
  { month: "Out", saldo: 38000 },
  { month: "Nov", saldo: 40100 },
  { month: "Dez", saldo: 42700 },
  { month: "Jan", saldo: 45400 },
  { month: "Fev", saldo: 47700 },
  { month: "Mar", saldo: 46120 },
];
