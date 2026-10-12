import { Link } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { company, whatsappLink } from "@/lib/env";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-surface/80 dark:bg-sidebar transition-colors">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.3fr_1fr_1fr]">
        {/* Coluna 1: Marca, slogan e dados cadastrais oficiais */}
        <div className="space-y-4">
          <Logo size={46} />
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            "{company.tagline}"
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Locação de veículos em Fortaleza com atendimento próximo, frota revisada e solicitação
            de orçamento transparente. Tradição e compromisso desde 2013.
          </p>

          <div className="space-y-1 text-xs text-muted-foreground/90 border-t border-border/60 pt-3">
            <p>
              <strong className="text-foreground">Razão Social:</strong> {company.legalName}
            </p>
            <p>
              <strong className="text-foreground">CNPJ:</strong> {company.cnpj}
            </p>
            <p className="text-[0.7rem] text-muted-foreground">* Atendimento em Fortaleza, CE.</p>
          </div>

          <div className="pt-2">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
            >
              Falar no WhatsApp: {company.phoneInternational}
            </a>
          </div>
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

        {/* Coluna 3: Contato oficial */}
        <div className="text-sm">
          <p className="eyebrow">Contato Oficial</p>
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
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="text-xs">
                <p className="text-foreground font-medium">Telefone / WhatsApp:</p>
                <a
                  href={`tel:${company.phone.replace(/[^0-9+]/g, "")}`}
                  className="hover:underline"
                >
                  {company.phoneInternational}
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="text-xs">
                <p className="text-foreground font-medium">E-mail Comercial:</p>
                <a href={`mailto:${company.email}`} className="hover:underline">
                  {company.email}
                </a>
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
              <a
                href={company.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-xs hover:underline"
              >
                @solemarrentacar
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Barra de Direitos e Créditos */}
      <div className="hairline-top">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} Sol & Mar Rent a Car · {company.legalName} · CNPJ:{" "}
            {company.cnpj}. Todos os direitos reservados · Fortaleza - CE.
          </p>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <span>Feito por</span>
            <span className="font-semibold tracking-wide text-foreground">Localway</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
