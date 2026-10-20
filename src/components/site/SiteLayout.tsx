import { type ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppAssistant } from "./WhatsAppAssistant";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-deep">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Assistente Interativo de Atendimento Integrado ao WhatsApp */}
      <WhatsAppAssistant />
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
      <div className="relative mx-auto max-w-[1536px] w-full px-5 sm:px-8 lg:px-12 xl:px-16">
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
