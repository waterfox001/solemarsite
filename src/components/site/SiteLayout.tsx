import { useState, type ReactNode } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { company, whatsappLink } from "@/lib/env";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Button } from "@/components/ui/button";

export function SiteLayout({ children }: { children: ReactNode }) {
  const [popupOpen, setPopupOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-deep">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Pop-up Compacto do WhatsApp Flutuante */}
      {popupOpen ? (
        <div
          role="dialog"
          aria-label="Atendimento Sol & Mar no WhatsApp"
          className="animate-in fade-in-50 slide-in-from-bottom-3 fixed right-5 bottom-20 z-50 w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-card/95 p-4 shadow-elevate backdrop-blur-xl duration-200"
        >
          {/* Cabeçalho do Pop-up */}
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src="/logo%20sol%20e%20mar.jpeg"
                  alt="Sol & Mar"
                  className="size-9 rounded-lg object-cover ring-1 ring-border"
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-foreground truncate">
                  Sol & Mar Rent a Car
                </p>
                <p className="text-[0.65rem] text-muted-foreground">
                  Fortaleza, CE · {company.phoneInternational}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPopupOpen(false)}
              aria-label="Fechar janela do WhatsApp"
              className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Mensagem e Saudação */}
          <div className="my-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Olá! Como podemos ajudar?</p>
            <p className="text-[0.75rem]">
              Consulte modelos disponíveis, tire dúvidas sobre retirada no Aeroporto de Fortaleza ou
              peça um orçamento sob medida.
            </p>
            <p className="text-[0.68rem] text-muted-foreground/80">
              * O envio de mensagem não gera confirmação automática de reserva.
            </p>
          </div>

          {/* Botão de Ação */}
          <div className="space-y-2 pt-1">
            <Button asChild variant="hero" size="sm" className="w-full gap-2 text-xs">
              <a
                href={whatsappLink(
                  "Olá! Gostaria de consultar veículos e valores na Sol & Mar Rent a Car.",
                )}
                target="_blank"
                rel="noreferrer"
                onClick={() => setPopupOpen(false)}
              >
                <MessageCircle className="size-4" />
                Iniciar conversa no WhatsApp
              </a>
            </Button>
            <a
              href={`tel:${company.phone.replace(/[^0-9+]/g, "")}`}
              className="flex items-center justify-center gap-1.5 text-[0.7rem] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="size-3" /> Ou ligue: {company.phoneInternational}
            </a>
          </div>
        </div>
      ) : null}

      {/* Botão Flutuante que Alterna o Pop-up */}
      <button
        type="button"
        onClick={() => setPopupOpen((prev) => !prev)}
        aria-label={popupOpen ? "Fechar janela de atendimento" : "Abrir atendimento no WhatsApp"}
        aria-expanded={popupOpen}
        className="fixed right-5 bottom-5 z-40 grid size-13 place-items-center rounded-full bg-gradient-gold text-primary-foreground shadow-gold transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        {popupOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-36 pb-16 sm:pt-44 sm:pb-20">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <p className="eyebrow reveal">{eyebrow}</p>
        <h1 className="reveal reveal-delay-1 mt-5 max-w-3xl text-4xl leading-[1.05] font-semibold sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="reveal reveal-delay-2 mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
