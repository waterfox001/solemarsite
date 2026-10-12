import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { company } from "@/lib/env";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { to: "/", label: "Home" },
  { to: "/veiculos", label: "Veículos" },
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/sobre", label: "Sobre" },
  { to: "/faq", label: "FAQ" },
  { to: "/contato", label: "Contato" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "glass-panel border-b border-border py-2.5 shadow-sm"
          : "border-b border-transparent py-4",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 sm:px-8">
        <Logo size={42} className="shrink-0" />

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface/60"
              activeProps={{ className: "text-foreground font-semibold bg-surface/80 shadow-xs" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          <a
            href={`tel:${company.phone.replace(/[^0-9+]/g, "")}`}
            className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary lg:flex"
            title="Ligar ou enviar mensagem para a Sol & Mar"
          >
            <Phone className="size-3.5 text-primary" />
            <span>{company.phoneInternational}</span>
          </a>

          {/* Seletor de Tema Claro / Escuro */}
          <ThemeToggle />

          <Button asChild variant="hero" size="sm" className="hidden sm:inline-flex">
            <Link to="/reserva">Solicitar orçamento</Link>
          </Button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-foreground hover:bg-surface transition-colors lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="glass-panel mx-4 mt-3 rounded-2xl border border-border p-4 shadow-elevate lg:hidden animate-in fade-in-50 duration-200">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl px-4 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                activeProps={{ className: "text-primary font-semibold bg-surface" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <a
              href={`tel:${company.phone.replace(/[^0-9+]/g, "")}`}
              className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs font-medium text-foreground hover:text-primary transition-colors"
            >
              <Phone className="size-4 text-primary" />
              <span>Telefone / WhatsApp: {company.phoneInternational}</span>
            </a>

            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-muted-foreground">Alternar aparência</span>
              <ThemeToggle />
            </div>
          </div>

          <Button asChild variant="hero" size="lg" className="mt-3 w-full">
            <Link to="/reserva">Solicitar orçamento</Link>
          </Button>
        </div>
      ) : null}
    </header>
  );
}
