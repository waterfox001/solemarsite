import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Clock,
  Headphones,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { VehicleCard } from "@/components/site/VehicleCard";
import { listVehicles } from "@/lib/api";
import { addDaysISO, todayISO } from "@/lib/format";
import { company, whatsappLink } from "@/lib/env";
import hero from "@/assets/hero-coast.jpg";
import aboutImage from "@/assets/about-team.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sol & Mar Rent a Car | Locação de Veículos em Fortaleza" },
      {
        name: "description",
        content:
          "Explore Fortaleza no seu ritmo com a Sol & Mar Rent a Car. Locação com frota revisada, diárias transparentes e atendimento humano desde 2013.",
      },
      { property: "og:title", content: "Sol & Mar Rent a Car | Fortaleza - CE" },
      {
        property: "og:description",
        content:
          "Explore Fortaleza no seu ritmo. Praticidade, atendimento próximo e frota revisada.",
      },
    ],
  }),
  component: Home,
});

const HOURS = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "21:00",
  "22:00",
];

const steps = [
  {
    icon: CalendarDays,
    title: "1. Período e local",
    text: "Informe as datas e horários de retirada e devolução no Aeroporto Internacional de Fortaleza.",
  },
  {
    icon: CarFront,
    title: "2. Escolha o veículo",
    text: "Compare categorias, itens de conforto e diárias do catálogo demonstrativo com total clareza.",
  },
  {
    icon: Sparkles,
    title: "3. Opcionais & Dados",
    text: "Adicione itens demonstrativos (como cadeirinha ou motorista extra) e informe seu contato básico.",
  },
  {
    icon: MessageCircle,
    title: "4. Envio pelo WhatsApp",
    text: "Receba o resumo estruturado e envie para nossa equipe confirmar a disponibilidade e o valor.",
  },
];

const perks = [
  {
    icon: ShieldCheck,
    title: "Frota revisada",
    text: "Manutenção preventiva rigorosa e checklist de segurança antes de cada locação.",
  },
  {
    icon: Sparkles,
    title: "Sem surpresas",
    text: "Orçamento claro e detalhado antes do fechamento, sem taxas escondidas.",
  },
  {
    icon: Headphones,
    title: "Atendimento próximo",
    text: `Equipe disponível em Fortaleza pelo telefone e WhatsApp (${company.phoneInternational}) para tirar qualquer dúvida.`,
  },
  {
    icon: MapPin,
    title: "Retirada no Aeroporto",
    text: "Ponto estratégico no Aeroporto Internacional de Fortaleza para você não perder tempo.",
  },
];

function Home() {
  const navigate = useNavigate();
  const [start, setStart] = useState(todayISO());
  const [startTime, setStartTime] = useState("09:00");
  const [end, setEnd] = useState(addDaysISO(todayISO(), 3));
  const [endTime, setEndTime] = useState("09:00");
  const [pickupLocation] = useState(company.defaultPickupLocation);
  const [category, setCategory] = useState("Todas");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: listVehicles });
  const featured = vehicles.filter((v) => v.active).slice(0, 3);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);

    if (end < start) {
      setValidationError("A data de devolução não pode ser anterior à data de retirada.");
      return;
    }

    if (end === start && endTime <= startTime) {
      setValidationError(
        "Para devolução no mesmo dia, selecione um horário posterior ao da retirada.",
      );
      return;
    }

    navigate({
      to: "/reserva",
      search: {
        inicio: start,
        fim: end,
        horaInicio: startTime,
        horaFim: endTime,
        localRetirada: pickupLocation,
        localDevolucao: pickupLocation,
        ...(category !== "Todas" ? { categoria: category } : {}),
      },
    });
  };

  return (
    <SiteLayout>
      {/* ---------------- HERO ---------------- */}
      <section className="relative min-h-[94vh] overflow-hidden">
        <img
          src={hero}
          alt="Carro em estrada litorânea ao pôr do sol"
          width={1920}
          height={1200}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/35" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />

        <div className="relative mx-auto flex min-h-[94vh] max-w-7xl flex-col justify-end px-5 pt-36 pb-16 sm:px-8 sm:pb-24">
          <div className="max-w-3xl">
            <span className="eyebrow reveal">"{company.tagline}"</span>
            <h1 className="reveal reveal-delay-1 mt-4 text-[2.5rem] leading-[1.05] font-semibold sm:text-6xl lg:text-7xl">
              Explore Fortaleza <span className="text-gradient-gold italic">no seu ritmo</span>.
            </h1>
            <p className="reveal reveal-delay-2 mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Encontre o veículo ideal para sua próxima viagem e descubra Fortaleza com mais
              liberdade, conforto e praticidade. Conte com a Sol & Mar Rent a Car desde 2013.
            </p>
          </div>

          {/* Widget de busca completo com datas, horários e local */}
          <Reveal delay={240} className="mt-10 w-full">
            <form
              onSubmit={handleSearchSubmit}
              className="glass-panel space-y-4 rounded-3xl p-5 shadow-elevate sm:p-7 lg:max-w-5xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                <span className="text-xs font-semibold tracking-wider text-primary uppercase">
                  Simulação de Locação
                </span>
                <span className="text-xs text-muted-foreground">
                  Local provisório: <strong className="text-foreground">{pickupLocation}</strong>
                </span>
              </div>

              {/* Grid de campos */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Retirada: Data */}
                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Data de Retirada</span>
                  <input
                    type="date"
                    value={start}
                    min={todayISO()}
                    onChange={(e) => {
                      setStart(e.target.value);
                      if (e.target.value > end) setEnd(e.target.value);
                      setValidationError(null);
                    }}
                    className="h-11 rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    required
                  />
                </label>

                {/* Retirada: Horário */}
                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="size-3.5 text-primary" />
                    Horário de Retirada
                  </span>
                  <select
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setValidationError(null);
                    }}
                    className="h-11 rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Devolução: Data */}
                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Data de Devolução</span>
                  <input
                    type="date"
                    value={end}
                    min={start}
                    onChange={(e) => {
                      setEnd(e.target.value);
                      setValidationError(null);
                    }}
                    className="h-11 rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    required
                  />
                </label>

                {/* Devolução: Horário */}
                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="size-3.5 text-primary" />
                    Horário de Devolução
                  </span>
                  <select
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setValidationError(null);
                    }}
                    className="h-11 rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Linha auxiliar: Categoria + Botão de Consulta */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Categoria preferida:</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-9 rounded-lg border border-input bg-surface px-2.5 text-xs text-foreground outline-none focus:border-primary"
                  >
                    <option value="Todas">Todas as categorias</option>
                    <option value="Econômico">Econômico</option>
                    <option value="Executivo">Executivo</option>
                    <option value="SUV">SUV</option>
                    <option value="Picape">Picape</option>
                  </select>
                </label>

                <Button type="submit" variant="hero" size="xl" className="w-full sm:w-auto">
                  Consultar veículos disponíveis
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              {/* Mensagem de validação de datas */}
              {validationError ? (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              ) : null}
            </form>
          </Reveal>
        </div>
      </section>

      {/* ---------------- DESTAQUES DA FROTA ---------------- */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Nossa frota em Fortaleza"
            title={
              <>
                Veículos para cada <span className="italic text-primary">tipo de viagem</span>
              </>
            }
            description="Do compacto ágil para o trânsito da cidade ao SUV para as praias e litoral. Dados demonstrativos para consulta."
          />
          <Reveal delay={120}>
            <Button asChild variant="glass" size="lg">
              <Link to="/veiculos">
                Ver catálogo completo
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((vehicle, index) => (
            <Reveal key={vehicle.id} delay={index * 110}>
              <VehicleCard vehicle={vehicle} period={{ start, end }} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- COMO FUNCIONA ---------------- */}
      <section className="border-y border-border bg-surface/40 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Como funciona"
            title="Quatro passos simples até a sua viagem"
            description="Transparência e atendimento humano desde o primeiro contato até a entrega das chaves."
            align="center"
          />
          <ol className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 100}>
                <div className="card-hover h-full rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-xl bg-primary/12 text-primary">
                      <step.icon className="size-6" />
                    </span>
                    <span className="font-display text-3xl text-border">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={360} className="mt-12 text-center">
            <Button asChild variant="hero" size="xl">
              <Link to="/reserva">Solicitar orçamento agora</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ---------------- SOBRE / DIFERENCIAIS ---------------- */}
      <section className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <img
              src={aboutImage}
              alt="Atendimento Sol & Mar Rent a Car em Fortaleza"
              width={1400}
              height={1000}
              loading="lazy"
              className="rounded-3xl border border-border object-cover shadow-elevate"
            />
            <div className="glass-panel absolute -bottom-8 -right-4 hidden rounded-2xl p-6 sm:block lg:-right-10">
              <p className="font-display text-3xl font-semibold text-primary">Desde 2013</p>
              <p className="mt-1 max-w-[10rem] text-xs text-muted-foreground">
                Atendimento próximo e confiança em Fortaleza, Ceará
              </p>
            </div>
          </div>
        </Reveal>

        <div>
          <SectionHeading
            eyebrow="Sobre a Sol & Mar"
            title="Locação sem burocracia, do jeito que deve ser"
            description="Atuando em Fortaleza desde agosto de 2013, oferecemos locação de veículos com atendimento personalizado, foco na segurança e transparência nos valores."
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {perks.map((perk, index) => (
              <Reveal as="li" key={perk.title} delay={index * 90}>
                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-primary">
                    <perk.icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{perk.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {perk.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- CTA FINAL ---------------- */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-surface p-10 sm:p-16">
          <div className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">Pronto para sua viagem em Fortaleza?</p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold sm:text-4xl">
                Envie sua solicitação e combine os detalhes com nossa equipe.
              </h2>
              <p className="mt-4 text-sm text-muted-foreground">
                Dúvidas sobre modelos ou datas? Ligue para {company.phoneInternational} ou fale
                conosco direto no WhatsApp.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="xl">
                <Link to="/reserva">Solicitar orçamento</Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <a href={whatsappLink()} target="_blank" rel="noreferrer">
                  Falar no WhatsApp ({company.phoneInternational})
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
