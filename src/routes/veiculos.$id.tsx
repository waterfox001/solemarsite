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

  const specs = [
    { icon: Gauge, label: "Câmbio", value: vehicle.transmission },
    { icon: Fuel, label: "Combustível", value: vehicle.fuel },
    { icon: Users, label: "Passageiros", value: String(vehicle.passengers) },
    { icon: DoorOpen, label: "Portas", value: String(vehicle.doors) },
    { icon: Luggage, label: "Malas", value: String(vehicle.luggage) },
  ];
  const canBook = vehicle.status !== "manutencao";

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-5 pt-32 sm:px-8 sm:pt-40">
        <Link
          to="/veiculos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Voltar ao catálogo
        </Link>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="reveal">
            <div className="overflow-hidden rounded-3xl border border-border bg-surface">
              {vehicle.images[photo] ? (
                <img
                  src={vehicle.images[photo]}
                  alt={vehicle.name}
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <div className="grid aspect-[16/10] place-items-center text-muted-foreground">
                  Sem foto
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
            <VehicleStatusBadge status={vehicle.status} />
            <p className="eyebrow mt-6">{vehicle.category}</p>
            <h1 className="mt-3 text-4xl leading-tight font-semibold sm:text-5xl">
              {vehicle.name}
            </h1>
            <p className="mt-5 leading-relaxed text-muted-foreground">{vehicle.description}</p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specs.map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                  <s.icon className="size-5 text-primary" />
                  <p className="mt-3 text-xs text-muted-foreground">{s.label}</p>
                  <p className="font-semibold">{s.value}</p>
                </div>
              ))}
            </div>

            {vehicle.features.length ? (
              <ul className="mt-8 grid grid-cols-2 gap-2 text-sm">
                {vehicle.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="glass-panel mt-10 rounded-2xl p-6">
              <p className="text-xs text-muted-foreground">Diária demonstrativa a partir de</p>
              <p className="font-display text-4xl font-semibold text-primary">
                {brl(vehicle.daily_rate)}
              </p>
              <Button
                asChild={canBook}
                disabled={!canBook}
                variant="hero"
                size="xl"
                className="mt-6 w-full"
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
