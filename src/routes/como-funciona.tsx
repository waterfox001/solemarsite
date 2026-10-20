import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CarFront,
  ClipboardCheck,
  KeyRound,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { company } from "@/lib/env";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como Funciona a Locação | Sol & Mar Rent a Car" },
      {
        name: "description",
        content:
          "Veja o passo a passo para alugar seu carro na Sol & Mar: simule o período, escolha o veículo, envie sua solicitação e combine a retirada em Fortaleza.",
      },
      { property: "og:title", content: "Como Funciona | Sol & Mar Rent a Car" },
      {
        property: "og:description",
        content: "O passo a passo da sua locação em Fortaleza, da simulação à entrega.",
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    icon: CalendarDays,
    title: "1. Período e local de retirada",
    text: "Informe as datas e horários em que precisará do veículo no Aeroporto Internacional de Fortaleza ou na loja no Meireles.",
  },
  {
    icon: CarFront,
    title: "2. Escolha da categoria",
    text: "Navegue pelo catálogo demonstrativo e selecione o grupo de veículos que melhor atende sua viagem (econômico, sedã, SUV ou picape).",
  },
  {
    icon: Sparkles,
    title: "3. Opcionais e estimativa",
    text: "Indique necessidades especiais, como cadeirinha de bebê ou condutor adicional, e visualize a estimativa de diárias sem surpresas.",
  },
  {
    icon: UserRound,
    title: "4. Dados de contato básicos",
    text: "Preencha apenas nome, WhatsApp e e-mail. Não solicitamos dados de pagamento nem documentação sensível nesta fase.",
  },
  {
    icon: MessageCircle,
    title: "5. Atendimento no WhatsApp",
    text: `Nossa equipe em Fortaleza recebe seu pedido pelo WhatsApp (${company.phoneInternational}), verifica a disponibilidade física da frota e formaliza a proposta personalizada.`,
  },
  {
    icon: KeyRound,
    title: "6. Retirada e vistoria",
    text: "No dia e horário combinados, você apresenta CNH e documento válido, realiza a vistoria e inicia sua viagem com segurança.",
  },
];

function HowItWorks() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Processo Transparente"
        title={
          <>
            Do orçamento à <span className="italic text-primary">estrada</span>
          </>
        }
        description="Entenda como funciona o fluxo de locação com a Sol & Mar em Fortaleza: facilidade online com o cuidado de um atendimento humano."
      />
      <section className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <ol className="relative space-y-6 border-l border-border pl-8 sm:pl-12">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 80} className="relative">
              <span className="absolute top-6 -left-[2.85rem] grid size-10 place-items-center rounded-full bg-gradient-gold text-primary-foreground shadow-gold sm:-left-[4.1rem] sm:size-12">
                <s.icon className="size-5" />
              </span>
              <div className="card-hover rounded-2xl border border-border bg-card p-6 sm:p-8">
                <p className="eyebrow">Etapa 0{i + 1}</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <div className="mt-14 text-center">
          <Button asChild variant="hero" size="xl">
            <Link to="/reserva">Solicitar meu orçamento agora</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
