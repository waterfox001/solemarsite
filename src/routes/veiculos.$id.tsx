import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  DoorOpen,
  Fuel,
  Gauge,
  Luggage,
  MessageCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VehicleStatusBadge } from "@/components/site/StatusBadge";
import { getVehicle } from "@/lib/api";
import { company, whatsappLink } from "@/lib/env";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Search {
  inicio?: string;
  fim?: string;
}

export const Route = createFileRoute("/veiculos/$id")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(typeof s["inicio"] === "string" ? { inicio: s["inicio"] } : {}),
    ...(typeof s["fim"] === "string" ? { fim: s["fim"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Detalhes do veículo | Sol & Mar Rent a Car" },
      {
        name: "description",
        content: "Fotos, especificações e diária do veículo. Reserve online.",
      },
      { property: "og:title", content: "Detalhes do veículo | Sol & Mar Rent a Car" },
      { property: "og:description", content: "Fotos, especificações e diária. Reserve online." },
    ],
  }),
  component: VehiclePage,
});

function VehiclePage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicle(id),
  });
  const [photo, setPhoto] = useState(0);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] pt-40 text-center text-muted-foreground">Carregando…</div>
      </SiteLayout>
    );
  }
  if (!vehicle) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] pt-40 text-center">
          <h1 className="text-3xl">Veículo não encontrado</h1>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/veiculos">Ver catálogo</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const specs: { icon: typeof Gauge; label: string; value: string }[] = [];
  if (vehicle.transmission)
    specs.push({ icon: Gauge, label: "Câmbio", value: vehicle.transmission });
  if (vehicle.fuel) specs.push({ icon: Fuel, label: "Combustível", value: vehicle.fuel });
  if (vehicle.passengers)
    specs.push({ icon: Users, label: "Passageiros", value: `${vehicle.passengers} lugares` });
  if (vehicle.doors)
    specs.push({ icon: DoorOpen, label: "Portas", value: `${vehicle.doors} portas` });
  if (vehicle.luggage)
    specs.push({ icon: Luggage, label: "Malas", value: `${vehicle.luggage} malas` });
  if (vehicle.year) specs.push({ icon: Gauge, label: "Ano", value: String(vehicle.year) });

  const canBook = vehicle.status !== "manutencao";

  return (
    <SiteLayout>
      <section className="mx-auto max-w-[1536px] w-full px-5 pt-32 sm:px-8 sm:pt-40 lg:px-12 xl:px-16">
        <Link
          to="/veiculos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Voltar ao catálogo
        </Link>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="reveal">
            <div className="overflow-hidden rounded-3xl border border-border bg-surface">
              {vehicle.cover_image || vehicle.images[photo] ? (
                <img
                  src={vehicle.cover_image || vehicle.images[photo]}
                  alt={vehicle.name}
                  className="aspect-[3/2] w-full object-cover object-center"
                />
              ) : (
                <div className="grid aspect-[3/2] place-items-center text-muted-foreground bg-surface/50">
                  <Car className="size-12 text-muted-foreground/50" />
                </div>
              )}
            </div>
            {vehicle.images.length > 1 ? (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {vehicle.images.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setPhoto(i)}
                    className={cn(
                      "shrink-0 overflow-hidden rounded-xl border-2",
                      i === photo ? "border-primary" : "border-transparent opacity-70",
                    )}
                  >
                    <img src={src} alt="" className="h-20 w-32 object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="reveal reveal-delay-1">
            <div className="flex items-center gap-2">
              <VehicleStatusBadge status={vehicle.status} />
              {vehicle.is_illustrative_image ? (
                <span className="rounded-full bg-surface px-3 py-0.5 text-xs font-semibold text-muted-foreground border border-border/70">
                  Foto ilustrativa
                </span>
              ) : null}
            </div>

            {vehicle.category ? (
              <p className="eyebrow mt-5">
                {vehicle.group_code ? `${vehicle.group_code} · ` : ""}
                {vehicle.category}
              </p>
            ) : null}
            <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl leading-tight font-bold text-foreground">
              {vehicle.name}
            </h1>
            {vehicle.description ? (
              <p className="mt-4 leading-relaxed text-muted-foreground">{vehicle.description}</p>
            ) : null}

            {vehicle.similar_models && vehicle.similar_models.length > 0 ? (
              <div className="mt-4 rounded-xl border border-border/70 bg-surface/60 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Modelos do grupo: </span>
                {vehicle.similar_models.join(" · ")}
              </div>
            ) : null}

            {specs.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {specs.map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-3.5">
                    <s.icon className="size-4.5 text-primary" />
                    <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
                    <p className="font-bold text-foreground text-sm">{s.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="glass-panel mt-8 rounded-2xl p-6 border border-border/90">
              <p className="text-xs font-medium text-muted-foreground">Tarifa por diária</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-display text-4xl font-extrabold text-primary">
                  {vehicle.daily_rate > 0 ? brl(vehicle.daily_rate) : "Consulte a diária"}
                </span>
                {vehicle.daily_rate > 0 ? (
                  <span className="text-sm font-semibold text-muted-foreground">/diária</span>
                ) : null}
              </div>
              <p className="mt-2 text-[0.7rem] text-muted-foreground">
                * Valores e disponibilidade física confirmados no atendimento da locadora.
              </p>
              <Button
                asChild={canBook}
                disabled={!canBook}
                variant="hero"
                size="xl"
                className="mt-5 w-full font-bold shadow-gold h-12"
              >
                {canBook ? (
                  <Link
                    to="/reserva"
                    search={{
                      veiculo: vehicle.id,
                      ...(search.inicio ? { inicio: search.inicio } : {}),
                      ...(search.fim ? { fim: search.fim } : {}),
                    }}
                  >
                    Solicitar orçamento deste veículo
                  </Link>
                ) : (
                  <span>Indisponível no momento</span>
                )}
              </Button>
              <div className="mt-4 flex justify-center">
                <a
                  href={whatsappLink(
                    `Olá! Tenho interesse no veículo ${vehicle.name} (${vehicle.category}). Gostaria de consultar valores e datas.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors text-center"
                >
                  <MessageCircle className="size-3.5 text-primary" />
                  Dúvidas sobre este veículo? Fale no WhatsApp: {company.phoneInternational}
                </a>
              </div>
              <p className="mt-3 text-center text-[0.68rem] text-muted-foreground">
                * Modelo apresentado ou similar da categoria. Valores sujeitos à confirmação com a
                equipe.
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
