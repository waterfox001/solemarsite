import { Link } from "@tanstack/react-router";
import { ArrowRight, Car, Fuel, Gauge, Sparkles, Users } from "lucide-react";
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
  const cover = vehicle.cover_image || vehicle.images[0];
  const isAvailable = vehicle.status === "disponivel";

  // Apenas especificações reais confirmadas (sem ar-condicionado, direção, bluetooth ou presunções)
  const confirmedSpecs: { icon: typeof Gauge; label: string }[] = [];

  if (vehicle.transmission && vehicle.transmission.trim().length > 0) {
    confirmedSpecs.push({
      icon: Gauge,
      label: vehicle.transmission,
    });
  }

  if (vehicle.fuel && vehicle.fuel.trim().length > 0) {
    confirmedSpecs.push({
      icon: Fuel,
      label: vehicle.fuel,
    });
  }

  if (vehicle.passengers && vehicle.passengers > 0) {
    confirmedSpecs.push({
      icon: Users,
      label: `${vehicle.passengers} lugares`,
    });
  }

  if (vehicle.year && vehicle.year > 2000) {
    confirmedSpecs.push({
      icon: Sparkles,
      label: `Ano ${vehicle.year}`,
    });
  }

  return (
    <article
      className={cn(
        "card-hover group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 w-full shadow-xs hover:border-primary/50 hover:shadow-md",
      )}
    >
      {/* ======================================================== */}
      {/* FOTO DO VEÍCULO (PROTAGONISTA - PROPORÇÃO 3:2 NATIVA)   */}
      {/* ======================================================== */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-surface-2 border-b border-border/60">
        {cover ? (
          <img
            src={cover}
            alt={vehicle.name}
            loading="lazy"
            className="size-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center size-full gap-2 text-muted-foreground bg-surface/50 p-6 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-surface border border-border/60 text-primary">
              <Car className="size-6" />
            </div>
            <span className="text-xs font-semibold text-foreground/80">{vehicle.name}</span>
          </div>
        )}

        {/* Badges superiores: Disponibilidade e Categoria (quando confirmada) */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
          <VehicleStatusBadge status={vehicle.status} />
          {vehicle.is_illustrative_image ? (
            <span className="rounded-md bg-background/90 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground backdrop-blur-md shadow-xs ring-1 ring-border/50">
              Foto ilustrativa
            </span>
          ) : null}
        </div>

        {vehicle.category && vehicle.category.trim().length > 0 ? (
          <div className="absolute top-3 right-3 z-10">
            <span className="rounded-full bg-background/90 px-2.5 py-0.5 text-[0.7rem] font-bold text-foreground backdrop-blur-md shadow-xs ring-1 ring-border/60 uppercase tracking-wider">
              {vehicle.category}
            </span>
          </div>
        ) : null}
      </div>

      {/* ======================================================== */}
      {/* CORPO DO CARTÃO PÚBLICO (SIMPLES, DIRETO E PROFISSIONAL)  */}
      {/* ======================================================== */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Nome do Veículo (permite quebrar em 2 linhas se necessário) */}
        <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground leading-snug">
          {vehicle.name}
        </h3>

        {/* Especificações confirmadas (somente as que existem) */}
        {confirmedSpecs.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {confirmedSpecs.map((spec) => {
              const Icon = spec.icon;
              return (
                <div
                  key={spec.label}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-foreground/90 border border-border/50"
                >
                  <Icon className="size-3.5 text-primary shrink-0" />
                  <span>{spec.label}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* ======================================================== */}
        {/* ÁREA DE PREÇO REAL E AÇÃO PARA COTAÇÃO                   */}
        {/* ======================================================== */}
        <div className="mt-auto pt-5">
          <div className="border-t border-border/80 pt-4 flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Bloco de Preço */}
            <div>
              {vehicle.daily_rate && vehicle.daily_rate > 0 ? (
                <div>
                  <span className="text-[0.68rem] font-medium text-muted-foreground block">
                    Diária confirmada
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-2xl font-extrabold text-primary">
                      {brl(vehicle.daily_rate)}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">/diária</span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-[0.68rem] font-medium text-muted-foreground block">
                    Tarifa de locação
                  </span>
                  <span className="font-display text-lg sm:text-xl font-bold text-foreground">
                    Consulte a diária
                  </span>
                </div>
              )}
            </div>

            {/* Botão de Ação: Selecionar e continuar cotação */}
            <Button
              asChild
              variant="hero"
              size="default"
              className="h-11 font-bold shadow-gold px-4 text-xs sm:text-sm shrink-0"
            >
              <Link
                to="/reserva"
                search={{
                  veiculo: vehicle.id,
                  ...(period?.start ? { inicio: period.start } : {}),
                  ...(period?.end ? { fim: period.end } : {}),
                }}
              >
                <span>{isAvailable ? "Selecionar" : "Consultar disponibilidade"}</span>
                <ArrowRight className="size-3.5 ml-1.5 shrink-0" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
