import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, MapPin, Phone, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { company, whatsappLink } from "@/lib/env";
import aboutImage from "@/assets/about-team.jpg";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a Sol & Mar Rent a Car | Fortaleza, CE" },
      {
        name: "description",
        content:
          "Conheça a Sol & Mar Rent a Car: tradição em locação de veículos em Fortaleza desde agosto de 2013, com atendimento próximo e transparente.",
      },
      { property: "og:title", content: "Sobre a Sol & Mar Rent a Car | Fortaleza, CE" },
      {
        property: "og:description",
        content: "Tradição em locação de veículos em Fortaleza desde 2013.",
      },
    ],
  }),
  component: About,
});

const values = [
  {
    title: "Transparência total",
    text: "Orçamento sem taxas escondidas antes de você fechar, para você viajar com tranquilidade.",
  },
  {
    title: "Cuidado e segurança",
    text: "Todos os veículos passam por checagem criteriosa e higienização antes de cada entrega.",
  },
  {
    title: "Atendimento próximo",
    text: "Você conversa diretamente com pessoas em Fortaleza prontas para entender suas necessidades.",
  },
];

function About() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Nossa História"
        title={
          <>
            Desde 2013, o seu caminho <span className="italic text-primary">em Fortaleza</span>
          </>
        }
        description="Fundada em 2 de agosto de 2013, a Sol & Mar Rent a Car nasceu com o compromisso de tornar a locação de veículos mais simples, humana e acessível no Ceará."
      />

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <img
              src={aboutImage}
              alt="Atendimento Sol & Mar Rent a Car em Fortaleza"
              width={1400}
              height={1000}
              loading="lazy"
              className="rounded-3xl border border-border shadow-elevate object-cover"
            />
            <div className="glass-panel absolute -bottom-6 -right-3 rounded-2xl p-5 sm:block sm:-right-6">
              <p className="text-xs font-semibold text-accent uppercase">Slogan</p>
              <p className="font-semibold text-sm text-foreground mt-0.5">"{company.tagline}"</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120} className="space-y-6">
          <div>
            <span className="eyebrow">Compromisso e Proximidade</span>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl text-foreground">
              Mobilidade pensada para quem visita ou vive em Fortaleza
            </h2>
          </div>

          <p className="leading-relaxed text-muted-foreground text-sm sm:text-base">
            Com sede localizada no bairro Meireles, na Avenida da Abolição, a Sol & Mar Rent a Car
            acompanha turistas, famílias e profissionais que necessitam de veículos revisados para
            se locomover pela capital e pelas famosas praias do litoral cearense.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-border/70 py-5 text-xs">
            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Início das Atividades</p>
                <p className="text-muted-foreground">{company.establishedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Sede Administrativa</p>
                <p className="text-muted-foreground">Meireles, Fortaleza - CE</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Telefone / WhatsApp</p>
                <a
                  href={`tel:${company.phone.replace(/[^0-9+]/g, "")}`}
                  className="text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  {company.phoneInternational}
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface/60 p-3.5 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Razão Social:</strong> {company.legalName} ·{" "}
              <strong className="text-foreground">CNPJ:</strong> {company.cnpj}
            </p>
            <p className="mt-1 text-[0.7rem]">
              * O endereço na Av. da Abolição, 1894 é a sede comercial administrativa da empresa.
              Consulte as opções de entrega e retirada de veículos para a sua viagem.
            </p>
          </div>

          <div className="grid gap-3 pt-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-semibold text-primary text-sm">{v.title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Button asChild variant="hero" size="lg">
              <Link to="/reserva">
                Solicitar orçamento
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <a href={whatsappLink()} target="_blank" rel="noreferrer">
                Falar no WhatsApp ({company.phoneInternational})
              </a>
            </Button>
          </div>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
