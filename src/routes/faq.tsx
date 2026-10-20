import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { company, whatsappLink } from "@/lib/env";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas Frequentes | Sol & Mar Rent a Car" },
      {
        name: "description",
        content:
          "Dúvidas sobre documentos, pagamento, retirada no aeroporto de Fortaleza, caução e diárias na Sol & Mar Rent a Car.",
      },
      { property: "og:title", content: "Perguntas Frequentes | Sol & Mar Rent a Car" },
      {
        property: "og:description",
        content: "Tire suas dúvidas sobre o processo de locação de veículos em Fortaleza.",
      },
    ],
  }),
  component: Faq,
});

import { FAQS } from "@/lib/faq-data";

function Faq() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Tire Suas Dúvidas"
        title={
          <>
            Perguntas <span className="italic text-primary">frequentes</span>
          </>
        }
        description="Respostas claras sobre documentação, retirada no aeroporto e regras de locação da Sol & Mar em Fortaleza."
      />
      <section className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <Accordion type="single" collapsible className="glass-panel rounded-3xl px-6 sm:px-8">
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.question} value={`item-${i}`}>
              <AccordionTrigger className="py-6 text-left text-base font-medium text-foreground hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-6 leading-relaxed text-sm text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="glass-panel mt-12 rounded-3xl p-6 text-center sm:p-8">
          <h3 className="text-lg font-semibold text-foreground">Ainda tem alguma dúvida?</h3>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            Nossa equipe em Fortaleza está à disposição para tirar qualquer dúvida e preparar seu
            orçamento sob medida.
          </p>
          <div className="mt-5 flex justify-center">
            <Button asChild variant="hero" size="lg" className="gap-2">
              <a
                href={whatsappLink(
                  "Olá! Tenho uma dúvida sobre as condições de locação da Sol & Mar.",
                )}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="size-4" />
                Falar com a equipe no WhatsApp ({company.phoneInternational})
              </a>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
