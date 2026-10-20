import { useState } from "react";
import { format, isBefore, parseISO, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, Clock, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { daysBetween } from "@/lib/format";

interface DateRangePickerProps {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  onChangeRange: (start: string, end: string) => void;
  startTime: string;
  endTime: string;
  onChangeStartTime: (time: string) => void;
  onChangeEndTime: (time: string) => void;
  hours: readonly string[] | string[];
  className?: string;
}

export function DateRangePicker({
  start,
  end,
  onChangeRange,
  startTime,
  endTime,
  onChangeStartTime,
  onChangeEndTime,
  hours,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const startDate = start ? parseISO(start) : startOfToday();
  const endDate = end ? parseISO(end) : startOfToday();

  const selectedRange: DateRange = {
    from: startDate,
    to: endDate,
  };

  const handleSelectRange = (range: DateRange | undefined) => {
    if (!range) return;
    if (range.from) {
      const fromStr = format(range.from, "yyyy-MM-dd");
      if (range.to) {
        const toStr = format(range.to, "yyyy-MM-dd");
        onChangeRange(fromStr, toStr);
        setOpen(false);
      } else {
        onChangeRange(fromStr, fromStr);
      }
    }
  };

  const durationDays = daysBetween(start, end);

  return (
    <div className={cn("space-y-4", className)}>
      {/* ======================================================== */}
      {/* SELETOR INTERATIVO DE DATAS (POPOVER COM CALENDÁRIO)     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Bloco de Datas com Popover */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Período da Locação (Retirada e Devolução)
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="group flex w-full flex-col gap-2 rounded-2xl border border-input bg-surface p-3.5 text-left transition-all hover:border-primary/60 hover:bg-surface/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <CalendarIcon className="size-5" />
                  </div>
                  <div>
                    <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground block">
                      Retirada → Devolução
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {format(startDate, "dd 'de' MMM", { locale: ptBR })}
                      {"  "}→{"  "}
                      {format(endDate, "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-border/50 pt-2 sm:border-0 sm:pt-0">
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                    {durationDays} {durationDays === 1 ? "diária" : "diárias"}
                  </span>
                  <span className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                    Alterar
                  </span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-4 bg-card border-border shadow-elevate rounded-2xl"
              align="start"
            >
              <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-bold text-foreground">
                  Selecione o período desejado
                </span>
                <span className="text-[0.7rem] text-muted-foreground">
                  Bloqueio de datas passadas
                </span>
              </div>

              <Calendar
                mode="range"
                defaultMonth={startDate}
                selected={selectedRange}
                onSelect={handleSelectRange}
                numberOfMonths={1}
                disabled={(date) => isBefore(date, startOfToday())}
                locale={ptBR}
                className="rounded-xl border border-border/40 p-2"
              />

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <span>
                  Período:{" "}
                  <strong className="text-foreground">
                    {durationDays} {durationDays === 1 ? "diária" : "diárias"}
                  </strong>
                </span>
                <Button size="sm" variant="hero" onClick={() => setOpen(false)}>
                  Confirmar datas
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Horário de Retirada */}
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Clock className="size-3.5 text-primary" />
            Horário de Retirada
          </span>
          <select
            value={startTime}
            onChange={(e) => onChangeStartTime(e.target.value)}
            className="h-11 rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            {hours.map((h) => (
              <option key={`start-${h}`} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        {/* Horário de Devolução */}
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Clock className="size-3.5 text-primary" />
            Horário de Devolução
          </span>
          <select
            value={endTime}
            onChange={(e) => onChangeEndTime(e.target.value)}
            className="h-11 rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            {hours.map((h) => (
              <option key={`end-${h}`} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
