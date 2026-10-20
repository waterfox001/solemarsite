import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MessageCircle, RotateCcw, Search, SlidersHorizontal, Users } from "lucide-react";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { VehicleCard } from "@/components/site/VehicleCard";
import { listVehicles } from "@/lib/api";
import { company, whatsappLink } from "@/lib/env";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/veiculos/")({
  loader: async () => {
    const vehicles = await listVehicles();
    return { vehicles };
  },
  head: () => ({
    meta: [
      { title: "Catálogo de Veículos | Sol & Mar Rent a Car" },
      {
        name: "description",
        content:
          "Conheça a frota da Sol & Mar em Fortaleza: econômicos, sedãs, SUVs e picapes com diárias transparentes.",
      },
      { property: "og:title", content: "Catálogo de Veículos | Sol & Mar Rent a Car" },
      {
        property: "og:description",
        content: "Econômicos, executivos, SUVs e picapes para alugar em Fortaleza.",
      },
    ],
  }),
  component: Catalog,
});

export function Catalog() {
  const loaderData = Route.useLoaderData();
  const { data: vehicles = loaderData?.vehicles ?? [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
    initialData: loaderData?.vehicles,
  });

  const [category, setCategory] = useState("Todos");
  const [transmission, setTransmission] = useState("Todos");
  const [passengers, setPassengers] = useState("Todos");
  const [sortOrder, setSortOrder] = useState<"default" | "price-asc" | "price-desc">("default");
  const [query, setQuery] = useState("");

  const active = vehicles.filter((v) => v.active);

  // Categorias presentes no catálogo da frota
  const categories = useMemo(() => {
    const list = Array.from(new Set(active.map((v) => v.category).filter(Boolean))) as string[];
    return ["Todos", ...list];
  }, [active]);

  const hasActiveFilters =
    category !== "Todos" ||
    transmission !== "Todos" ||
    passengers !== "Todos" ||
    sortOrder !== "default" ||
    query.trim().length > 0;

  const resetFilters = () => {
    setCategory("Todos");
    setTransmission("Todos");
    setPassengers("Todos");
    setSortOrder("default");
    setQuery("");
  };

  const filtered = useMemo(() => {
    let result = active.filter((v) => {
      const matchCat = category === "Todos" || v.category === category;
      const matchTrans = transmission === "Todos" || v.transmission === transmission;
      const matchPass =
        passengers === "Todos" ||
        (passengers === "ate5" && (v.passengers ?? 0) <= 5) ||
        (passengers === "mais5" && (v.passengers ?? 0) > 5);
      const matchQuery =
        !query.trim() ||
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        (v.category && v.category.toLowerCase().includes(query.toLowerCase())) ||
        (v.features ?? []).some((f) => f.toLowerCase().includes(query.toLowerCase()));

      return matchCat && matchTrans && matchPass && matchQuery;
    });

    if (sortOrder === "price-asc") {
      result = [...result].sort((a, b) => a.daily_rate - b.daily_rate);
    } else if (sortOrder === "price-desc") {
      result = [...result].sort((a, b) => b.daily_rate - a.daily_rate);
    }

    return result;
  }, [active, category, transmission, passengers, sortOrder, query]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Nossa Frota"
        title={
          <>
            Encontre o veículo <span className="italic text-primary">ideal</span> para sua viagem
          </>
        }
        description="Filtre por categoria, câmbio e capacidade. Locação por grupo com veículos de referência e modelos similares revisados em Fortaleza."
      />

      <section className="mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 xl:px-16">
        {/* Painel de Filtros Responsivo */}
        <div className="glass-panel space-y-4 rounded-3xl p-5 sm:p-6 shadow-elevate">
          {/* Linha 1: Categorias como pílulas de toque amigáveis */}
          <div className="flex flex-col gap-2">
            <span className="text-[0.68rem] font-semibold tracking-wider text-muted-foreground uppercase">
              Categorias
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                    category === c
                      ? "border-primary bg-primary text-primary-foreground font-semibold"
                      : "border-border text-muted-foreground hover:bg-surface hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Linha 2: Controles secundários e Busca */}
          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-4">
            {/* Câmbio */}
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span>Transmissão</span>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="h-10 rounded-xl border border-input bg-surface px-3 text-xs text-foreground outline-none focus:border-primary sm:text-sm"
              >
                <option value="Todos">Todos os câmbios</option>
                <option value="Manual">Manual</option>
                <option value="Automático">Automático</option>
              </select>
            </label>

            {/* Passageiros */}
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span>Passageiros</span>
              <select
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                className="h-10 rounded-xl border border-input bg-surface px-3 text-xs text-foreground outline-none focus:border-primary sm:text-sm"
              >
                <option value="Todos">Qualquer capacidade</option>
                <option value="ate5">Até 5 pessoas</option>
                <option value="mais5">Mais de 5 pessoas</option>
              </select>
            </label>

            {/* Ordenação por valor */}
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span>Ordenar por diária</span>
              <select
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value as "default" | "price-asc" | "price-desc")
                }
                className="h-10 rounded-xl border border-input bg-surface px-3 text-xs text-foreground outline-none focus:border-primary sm:text-sm"
              >
                <option value="default">Destaques</option>
                <option value="price-asc">Menor diária primeiro</option>
                <option value="price-desc">Maior diária primeiro</option>
              </select>
            </label>

            {/* Busca textual */}
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span>Buscar modelo ou item</span>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: ar-condicionado, suv..."
                  className="h-10 w-full rounded-xl border border-input bg-surface pr-3 pl-9 text-xs text-foreground outline-none focus:border-primary sm:text-sm"
                />
              </div>
            </label>
          </div>

          {/* Barra de status dos filtros e botão de reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            <p>
              Mostrando <strong className="text-foreground">{filtered.length}</strong> de{" "}
              {active.length} modelos cadastrados na demonstração
            </p>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:underline"
              >
                <RotateCcw className="size-3.5" />
                Limpar filtros
              </button>
            ) : null}
          </div>
        </div>

        {/* Grade de Cards da Frota */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-start">
          {filtered.map((v, i) => (
            <Reveal key={v.id} delay={(i % 3) * 80}>
              <VehicleCard vehicle={v} />
            </Reveal>
          ))}
        </div>

        {!isLoading && filtered.length === 0 ? (
          <div className="glass-panel mx-auto my-16 max-w-md rounded-2xl p-8 text-center">
            <SlidersHorizontal className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhum veículo encontrado</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Não encontramos modelos com a combinação de filtros selecionada. Tente ajustar os
              critérios ou limpe os filtros para ver toda a frota.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <RotateCcw className="size-3.5" />
                Restaurar todos os filtros
              </button>
              <a
                href={whatsappLink(
                  "Olá! Gostaria de consultar modelos e disponibilidade na Sol & Mar Rent a Car.",
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-2 transition-colors"
              >
                <MessageCircle className="size-3.5 text-primary" />
                Falar no WhatsApp ({company.phoneInternational})
              </a>
            </div>
          </div>
        ) : null}
      </section>
    </SiteLayout>
  );
}
