import { useState } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTransactions, useCategories, useAccounts, useGoals } from "@/hooks/useSupabaseData";
import { toast } from "@/hooks/use-toast";

type PeriodType = "month" | "semester" | "year";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getDateRange(type: PeriodType, ref: string): [Date, Date] {
  if (type === "month") {
    const [y, m] = ref.split("-").map(Number);
    return [new Date(y, m - 1, 1), new Date(y, m, 0, 23, 59, 59)];
  }
  if (type === "semester") {
    const [y, s] = ref.split("-S").map(Number);
    const startMonth = s === 1 ? 0 : 6;
    return [new Date(y, startMonth, 1), new Date(y, startMonth + 6, 0, 23, 59, 59)];
  }
  const y = Number(ref);
  return [new Date(y, 0, 1), new Date(y, 11, 31, 23, 59, 59)];
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ExportDialog() {
  const [open, setOpen] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [periodValue, setPeriodValue] = useState("");

  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: goals = [] } = useGoals();

  const now = new Date();
  const currentYear = now.getFullYear();

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: `${currentYear}-${String(i + 1).padStart(2, "0")}`,
    label: `${MONTHS[i]} ${currentYear}`,
  }));

  const semesterOptions = [
    { value: `${currentYear}-S1`, label: `1º Semestre ${currentYear}` },
    { value: `${currentYear}-S2`, label: `2º Semestre ${currentYear}` },
    { value: `${currentYear - 1}-S1`, label: `1º Semestre ${currentYear - 1}` },
    { value: `${currentYear - 1}-S2`, label: `2º Semestre ${currentYear - 1}` },
  ];

  const yearOptions = Array.from({ length: 3 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  const options = periodType === "month" ? monthOptions : periodType === "semester" ? semesterOptions : yearOptions;

  function handleExport() {
    if (!periodValue) {
      toast({ title: "Selecione um período", variant: "destructive" });
      return;
    }

    const [start, end] = getDateRange(periodType, periodValue);
    const filtered = transactions.filter((t) => {
      const d = new Date(t.due_date);
      return d >= start && d <= end;
    });

    if (filtered.length === 0) {
      toast({ title: "Sem dados para o período selecionado", variant: "destructive" });
      return;
    }

    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
    const accMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

    // Transactions sheet
    const txRows = filtered.map((t) => ({
      Data: new Date(t.due_date).toLocaleDateString("pt-BR"),
      Nome: t.name,
      Tipo: t.type === "receita" ? "Receita" : "Despesa",
      Valor: Number(t.amount),
      Status: t.status === "pago" ? "Pago" : t.status === "recebido" ? "Recebido" : "Pendente",
      Categoria: catMap[t.category_id ?? ""]
        ? `${catMap[t.category_id!].icon} ${catMap[t.category_id!].name}`
        : "—",
      Conta: accMap[t.account_id]?.name ?? "—",
      Recorrente: t.is_recurring ? "Sim" : "Não",
    }));

    // Summary sheet
    const totalReceitas = filtered
      .filter((t) => t.type === "receita" && t.status === "recebido")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalDespesas = filtered
      .filter((t) => t.type === "despesa" && t.status === "pago")
      .reduce((s, t) => s + Number(t.amount), 0);

    const summaryRows = [
      { Indicador: "Total de Receitas", Valor: formatCurrency(totalReceitas) },
      { Indicador: "Total de Despesas", Valor: formatCurrency(totalDespesas) },
      { Indicador: "Resultado Líquido", Valor: formatCurrency(totalReceitas - totalDespesas) },
      { Indicador: "Nº de Transações", Valor: String(filtered.length) },
    ];

    // Category breakdown sheet
    const catBreakdown = categories
      .filter((c) => c.type === "despesa")
      .map((cat) => {
        const total = filtered
          .filter((t) => t.category_id === cat.id && t.status === "pago")
          .reduce((s, t) => s + Number(t.amount), 0);
        return { Categoria: `${cat.icon} ${cat.name}`, Total: total };
      })
      .filter((c) => c.Total > 0)
      .sort((a, b) => b.Total - a.Total);

    // Accounts sheet
    const accRows = accounts.map((a) => ({
      Conta: a.name,
      Tipo: a.type,
      "Saldo Inicial": Number(a.initial_balance),
      "Saldo Atual": Number(a.balance),
    }));

    // Goals sheet
    const goalRows = goals.map((g) => ({
      Meta: g.name,
      "Valor Alvo": Number(g.target_amount),
      "Valor Atual": Number(g.current_amount),
      Progresso: `${((Number(g.current_amount) / Number(g.target_amount)) * 100).toFixed(1)}%`,
      Prazo: new Date(g.deadline).toLocaleDateString("pt-BR"),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Resumo");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), "Transações");
    if (catBreakdown.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catBreakdown), "Despesas por Categoria");
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(accRows), "Contas");
    if (goalRows.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(goalRows), "Metas");
    }

    const periodLabel = options.find((o) => o.value === periodValue)?.label ?? periodValue;
    XLSX.writeFile(wb, `Relatorio_${periodLabel.replace(/\s+/g, "_")}.xlsx`);

    toast({ title: "Relatório exportado com sucesso!" });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo de período</label>
            <Select
              value={periodType}
              onValueChange={(v) => {
                setPeriodType(v as PeriodType);
                setPeriodValue("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="semester">Semestre</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Período</label>
            <Select value={periodValue} onValueChange={setPeriodValue}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExport} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
