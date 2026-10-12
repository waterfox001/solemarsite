import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  ExternalLink,
  Fuel,
  Gauge,
  Luggage,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { VehicleStatusBadge } from "./StatusBadge";

export function VehicleCard({
  vehicle,
  period,
}: {
  vehicle: Vehicle;
  period?: { start: string; end: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const cover = vehicle.images[0];
  const isAvailable = vehicle.status !== "manutencao";

  return (
    <article className="card-hover group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300">
      {/* Imagem de capa com selos */}
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {cover ? (
          <img
            src={cover}
            alt={vehicle.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-muted-foreground">
            Sem foto
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          <VehicleStatusBadge status={vehicle.status} />
          {vehicle.year ? (
            <span className="rounded-full bg-background/80 px-2.5 py-0.5 text-[0.68rem] font-medium text-foreground/90 backdrop-blur-md">
              Ano {vehicle.year}
            </span>
          ) : null}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-accent uppercase">
            {vehicle.category}
          </p>
          <span className="text-[0.65rem] font-medium text-muted-foreground/80">
            Modelo ou similar
          </span>
        </div>

        <h3 className="mt-1.5 text-xl font-semibold text-foreground">{vehicle.name}</h3>

        {/* Resumo rápido em 4 especificações */}
        <ul className="mt-4 grid grid-cols-2 gap-2.5 text-xs text-muted-foreground sm:text-sm">
          <li className="flex min-w-0 items-center gap-2">
            <Gauge className="size-4 shrink-0 text-primary" />
            <span className="truncate">{vehicle.transmission}</span>
          </li>
          <li className="flex min-w-0 items-center gap-2">
            <Fuel className="size-4 shrink-0 text-primary" />
            <span className="truncate">{vehicle.fuel}</span>
          </li>
          <li className="flex min-w-0 items-center gap-2">
            <Users className="size-4 shrink-0 text-primary" />
            <span className="truncate">{vehicle.passengers} passageiros</span>
          </li>
          <li className="flex min-w-0 items-center gap-2">
            <Luggage className="size-4 shrink-0 text-primary" />
            <span className="truncate">{vehicle.luggage} malas</span>
          </li>
        </ul>

        {/* Painel expansível interno — sem abrir página gigante */}
        {expanded ? (
          <div
            id={`details-${vehicle.id}`}
            className="animate-in fade-in-50 slide-in-from-top-2 mt-4 space-y-3.5 rounded-xl border border-border/80 bg-surface/70 p-4 text-xs text-muted-foreground duration-200"
          >
            <div className="flex items-center justify-between text-[0.7rem] font-semibold text-foreground">
              <span>Especificações detalhadas</span>
              {vehicle.doors ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <DoorOpen className="size-3.5 text-primary" />
                  {vehicle.doors} portas
                </span>
              ) : null}
            </div>

            {vehicle.features.length > 0 ? (
              <ul className="grid grid-cols-2 gap-2">
                {vehicle.features.map((item) => (
                  <li key={item} className="flex items-center gap-1.5 text-foreground/90">
                    <Check className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {vehicle.description ? (
              <p className="line-clamp-3 leading-relaxed text-muted-foreground">
                {vehicle.description}
              </p>
            ) : null}

            <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-[0.68rem]">
              <span className="text-muted-foreground">
                * Valores e itens sujeitos a confirmação
              </span>
              <Link
                to="/veiculos/$id"
                params={{ id: vehicle.id }}
                search={period ? { inicio: period.start, fim: period.end } : {}}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Página completa <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>
        ) : null}

        {/* Rodapé do Card com Ações */}
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
            <div className="min-w-0">
              <p className="text-[0.68rem] text-muted-foreground">Valor demonstrativo</p>
              <p className="font-display text-2xl font-semibold text-primary">
                {vehicle.daily_rate > 0 ? brl(vehicle.daily_rate) : "A consultar"}
                {vehicle.daily_rate > 0 ? (
                  <span className="ml-1 text-xs font-sans font-normal text-muted-foreground">
                    /diária
                  </span>
                ) : null}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Ação secundária: Mostrar/Ocultar detalhes no próprio card */}
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                aria-controls={`details-${vehicle.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                {expanded ? (
                  <>
                    Ocultar detalhes
                    <ChevronUp className="size-3.5" />
                  </>
                ) : (
                  <>
                    Mostrar detalhes
                    <ChevronDown className="size-3.5" />
                  </>
                )}
              </button>

              {/* Ação principal: Escolher este veículo / Consultar disponibilidade */}
              <Button asChild variant="hero" size="sm" className="shrink-0">
                <Link
                  to="/reserva"
                  search={{
                    veiculo: vehicle.id,
                    ...(period?.start ? { inicio: period.start } : {}),
                    ...(period?.end ? { fim: period.end } : {}),
                  }}
                >
                  {isAvailable ? "Escolher este veículo" : "Consultar disponibilidade"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
