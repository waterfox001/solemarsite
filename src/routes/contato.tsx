import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Clock, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { company, whatsappLink } from "@/lib/env";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Fale Conosco | Sol & Mar Rent a Car - Fortaleza" },
      {
        name: "description",
        content: `Entre em contato com a Sol & Mar Rent a Car em Fortaleza. Atendimento via WhatsApp (${company.phoneInternational}), telefone e Instagram no Meireles.`,
      },
      { property: "og:title", content: "Fale Conosco | Sol & Mar Rent a Car" },
      {
        property: "og:description",
        content: "WhatsApp, telefone, Instagram e endereço em Fortaleza, Ceará.",
      },
    ],
  }),
  component: Contact,
});

const field =
  "h-12 w-full rounded-xl border border-input bg-surface px-4 text-sm outline-none focus:border-primary text-foreground";

function Contact() {
  const [form, setForm] = useState({ name: "", message: "" });
  const items = [
    {
      icon: Phone,
      label: "Telefone / WhatsApp Comercial",
      value: `${company.phone} (${company.phoneInternational})`,
      note: "Atendimento direto para orçamentos e dúvidas",
    },
    {
      icon: Instagram,
      label: "Instagram Oficial",
      value: "@solemarrentacar",
      note: "Acompanhe nossa frota e dicas de Fortaleza",
    },
    {
      icon: MapPin,
      label: "Endereço Comercial",
      value: company.commercialAddress,
      note: "Sede administrativa (consulte locais de entrega e retirada)",
    },
    {
      icon: Clock,
      label: "Horário de Atendimento",
      value: company.hours,
      note: "Horário padrão comercial da equipe",
    },
    {
      icon: Building2,
      label: "Dados Cadastrais Oficiais",
      value: `${company.legalName} · CNPJ: ${company.cnpj}`,
      note: "Empresa constituída e registrada desde 2013",
    },
  ];

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Canais de Atendimento"
        title={
          <>
            Vamos conversar sobre a sua <span className="italic text-primary">locação</span>
          </>
        }
        description="Fale diretamente com nossa equipe em Fortaleza por WhatsApp ou telefone para tirar dúvidas ou planejar sua viagem com total transparência."
      />
      <section className="mx-auto grid max-w-[1536px] w-full gap-8 px-5 pb-24 sm:px-8 lg:px-12 xl:px-16 lg:grid-cols-2">
        <div className="grid gap-3.5">
          {items.map((i) => (
            <div
              key={i.label}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4.5 sm:p-5"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <i.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{i.label}</p>
                <p className="break-words font-semibold text-foreground text-sm sm:text-base mt-0.5">
                  {i.value}
                </p>
                {i.note ? (
                  <p className="text-[0.68rem] text-muted-foreground/80 mt-0.5">{i.note}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <form
          className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            const message = form.name.trim()
              ? `Olá! Sou ${form.name.trim()}. ${form.message.trim()}`
              : form.message.trim();
            window.open(whatsappLink(message), "_blank");
          }}
        >
          <h2 className="text-xl font-semibold sm:text-2xl text-foreground">
            Envie uma mensagem direta
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Preencha seus dados para iniciar a conversa no WhatsApp oficial da Sol & Mar Rent a Car.
          </p>

          <input
            required
            placeholder="Seu nome completo"
            className={field}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            required
            placeholder="Como podemos te ajudar? (Datas desejadas, categoria de interesse, opções de retirada em Fortaleza...)"
            rows={5}
            className="w-full rounded-xl border border-input bg-surface p-4 text-sm outline-none focus:border-primary text-foreground"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <Button type="submit" variant="hero" size="xl" className="gap-2 mt-2">
            <MessageCircle className="size-5" />
            Enviar pelo WhatsApp
          </Button>
          <p className="text-[0.68rem] text-muted-foreground text-center">
            * O envio da mensagem abrirá o WhatsApp com o número oficial (
            {company.phoneInternational}).
          </p>
        </form>
      </section>
    </SiteLayout>
  );
}
