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

const faqs: readonly [string, string][] = [
  [
    "Quais documentos são necessários para alugar um veículo?",
    "É necessário apresentar CNH válida (Carteira Nacional de Habilitação) do condutor principal, documento de identidade oficial com foto (RG ou CPF) e comprovante de residência recente. Requisitos específicos de tempo de habilitação são confirmados no atendimento.",
  ],
  [
    "Qual é a idade mínima exigida?",
    "A idade mínima padrão para locação costuma ser de 21 anos com CNH definitiva, mas condições especiais ou taxas para condutores jovens podem ser consultadas diretamente com nossa equipe comercial.",
  ],
  [
    "Como funciona a retirada e entrega no Aeroporto de Fortaleza?",
    "A opção de entrega ou retirada no Aeroporto Internacional de Fortaleza (Pinto Martins) é uma facilidade disponível para simulação. Ao solicitar seu orçamento, informe os detalhes do voo para que nossa equipe avalie e confirme a logística de atendimento adequada à sua chegada.",
  ],
  [
    "Quais são as formas de pagamento aceitas?",
    "As condições comerciais, formas de pagamento (como Pix e cartões de crédito) e eventuais facilidades de parcelamento são alinhadas na proposta de orçamento formalizada pela equipe.",
  ],
  [
    "É exigida caução ou pré-autorização no cartão?",
    "Sim, como prática padrão no setor de locação de veículos, é solicitada uma garantia caução durante o período do contrato. O valor varia conforme a categoria do veículo e é liberado após a devolução e vistoria.",
  ],
  [
    "A quilometragem é livre ou controlada?",
    "Trabalhamos com opções de diárias com quilometragem livre ou pacotes específicos para viagens intermunicipais pelo Ceará. A melhor modalidade para sua rota será detalhada no orçamento.",
  ],
  [
    "Como solicito o cancelamento ou alteração de datas?",
    "Basta entrar em contato com nossa equipe pelo WhatsApp oficial informando o código da sua solicitação ou seu nome. Pedimos que avise com antecedência para reorganizarmos a disponibilidade do veículo.",
  ],
  [
    "Como funcionam os valores das diárias e opcionais?",
    "A diária básica considera 24 horas a partir do horário de retirada, com tolerância combinada em contrato. Os valores apresentados no site são simulações demonstrativas; o valor exato e a inclusão de opcionais (como cadeirinha ou motorista extra) são confirmados na proposta final.",
  ],
  [
    "Posso devolver o carro em outro local diferente da retirada?",
    "Sim, devoluções em locais alternativos em Fortaleza ou na região metropolitana podem ser combinadas previamente com nossa central de atendimento, sujeitas à taxa de retorno conforme a localidade.",
  ],
  [
    "O que acontece após enviar a solicitação pelo site?",
    "Nossa equipe em Fortaleza recebe os dados preenchidos, verifica a disponibilidade física da categoria desejada e envia a confirmação completa da cotação no seu WhatsApp com rapidez.",
  ],
];

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
          {faqs.map(([q, a], i) => (
            <AccordionItem key={q} value={`item-${i}`}>
              <AccordionTrigger className="py-6 text-left text-base font-medium text-foreground hover:no-underline">
                {q}
              </AccordionTrigger>
              <AccordionContent className="pb-6 leading-relaxed text-sm text-muted-foreground">
                {a}
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
