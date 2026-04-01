import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const _now = new Date();

interface MonthNavigatorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  className?: string;
}

export function MonthNavigator({ selectedMonth, selectedYear, onMonthChange, onYearChange, className }: MonthNavigatorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const isCurrentMonth = selectedMonth === _now.getMonth() && selectedYear === _now.getFullYear();

  const goToPrevMonth = () => {
    if (selectedMonth === 0) { onMonthChange(11); onYearChange(selectedYear - 1); }
    else onMonthChange(selectedMonth - 1);
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) { onMonthChange(0); onYearChange(selectedYear + 1); }
    else onMonthChange(selectedMonth + 1);
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Button variant="ghost" size="icon" className="h-9 w-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={goToPrevMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/60 transition-colors">
            <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground capitalize whitespace-nowrap">
              {MONTHS_FULL[selectedMonth]} {selectedYear}
            </span>
            {!isCurrentMonth && (
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full leading-none">Hoje</span>
            )}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-68 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" onClick={() => onYearChange(selectedYear - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">{selectedYear}</span>
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" onClick={() => onYearChange(selectedYear + 1)}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => { onMonthChange(i); setPickerOpen(false); }}
                className={cn(
                  "py-1.5 rounded-lg text-xs font-medium transition-colors",
                  i === selectedMonth ? "bg-primary text-primary-foreground" :
                  i === _now.getMonth() && selectedYear === _now.getFullYear() ? "bg-primary/10 text-primary hover:bg-primary/20" :
                  "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >{m}</button>
            ))}
          </div>
          {!isCurrentMonth && (
            <button
              onClick={() => { onMonthChange(_now.getMonth()); onYearChange(_now.getFullYear()); setPickerOpen(false); }}
              className="w-full text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors py-1.5 rounded-lg"
            >
              Ir para o mês atual
            </button>
          )}
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" className="h-9 w-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={goToNextMonth}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export { MONTHS_FULL };
