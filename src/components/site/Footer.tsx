import { Link } from "@tanstack/react-router";
import { Clock, Instagram, MapPin } from "lucide-react";
import { company } from "@/lib/env";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-surface/80 dark:bg-sidebar transition-colors">
      <div className="mx-auto grid max-w-[1536px] w-full gap-12 px-5 py-16 sm:px-8 lg:px-12 xl:px-16 lg:grid-cols-[1.3fr_1fr_1fr]">
        {/* Coluna 1: Marca e slogan oficial */}
        <div className="space-y-4">
          <Logo imageClassName="h-16 sm:h-20 w-auto aspect-[1242/1130]" />
          <p className="text-xs font-bold tracking-wider text-primary uppercase">
            "{company.tagline}"
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Locação de veículos em Fortaleza com atendimento próximo, frota revisada e solicitação
            de orçamento transparente. Tradição e atendimento humanizado desde 2013.
          </p>
        </div>

        {/* Coluna 2: Navegação */}
        <nav className="text-sm">
          <p className="eyebrow">Navegação</p>
          <ul className="mt-5 space-y-3 text-muted-foreground">
            <li>
              <Link to="/veiculos" className="transition-colors hover:text-foreground">
                Catálogo de veículos
              </Link>
            </li>
            <li>
              <Link to="/reserva" className="transition-colors hover:text-foreground">
                Solicitar orçamento
              </Link>
            </li>
            <li>
              <Link to="/como-funciona" className="transition-colors hover:text-foreground">
                Como funciona
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="transition-colors hover:text-foreground">
                Sobre a empresa
              </Link>
            </li>
            <li>
              <Link to="/faq" className="transition-colors hover:text-foreground">
                Perguntas frequentes
              </Link>
            </li>
            <li>
              <Link to="/contato" className="transition-colors hover:text-foreground">
                Fale conosco
              </Link>
            </li>
          </ul>
        </nav>

        {/* Coluna 3: Atendimento e Localização */}
        <div className="text-sm">
          <p className="eyebrow">Atendimento e Localização</p>
          <ul className="mt-5 space-y-4 text-muted-foreground">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-foreground font-medium text-xs">Endereço Comercial:</p>
                <span className="text-xs">{company.commercialAddress}</span>
                <p className="text-[0.68rem] text-muted-foreground/80 mt-0.5">
                  (Sede administrativa — consulte opções de entrega e retirada)
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="text-xs">
                <p className="text-foreground font-medium">Horário de Atendimento:</p>
                <span>{company.hours}</span>
              </div>
            </li>
            <li className="flex gap-3">
              <Instagram className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="text-xs">
                <p className="text-foreground font-medium">Instagram Oficial:</p>
                <a
                  href={company.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-primary font-medium"
                >
                  @solemarrentacar
                </a>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BARRA DE DIREITOS E CRÉDITOS NA ORDEM RIGOROSA SOLICITADA    */}
      {/* 1. © 2026 Sol & Mar Rent a Car. Todos os direitos reservados. */}
      {/* 2. Fortaleza, Ceará                                          */}
      {/* 3. Feito por Localway (discreto, sem moldura ou sombra)       */}
      {/* ============================================================ */}
      <div className="hairline-top">
        <div className="mx-auto flex max-w-[1536px] w-full flex-col items-center justify-center gap-1.5 px-5 py-8 text-center text-xs text-muted-foreground sm:px-8 lg:px-12 xl:px-16">
          <p className="font-medium text-foreground/90">
            © 2026 Sol & Mar Rent a Car. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">Fortaleza, Ceará</p>
          <p className="mt-1 text-[0.75rem] text-muted-foreground/75">
            Feito por <span className="text-foreground/80 font-medium">Localway</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
