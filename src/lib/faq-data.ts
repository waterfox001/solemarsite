export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: readonly FaqItem[] = [
  {
    question: "Quais documentos são necessários para alugar um veículo?",
    answer:
      "É necessário apresentar CNH válida (Carteira Nacional de Habilitação) do condutor principal, documento de identidade oficial com foto (RG ou CPF) e comprovante de residência recente. Requisitos específicos de tempo de habilitação são confirmados no atendimento.",
  },
  {
    question: "Qual é a idade mínima exigida?",
    answer:
      "A idade mínima padrão para locação costuma ser de 21 anos com CNH definitiva, mas condições especiais ou taxas para condutores jovens podem ser consultadas diretamente com nossa equipe comercial.",
  },
  {
    question: "Como funciona a retirada e entrega no Aeroporto de Fortaleza?",
    answer:
      "A opção de entrega ou retirada no Aeroporto Internacional de Fortaleza (Pinto Martins) é uma facilidade disponível para simulação. Ao solicitar seu orçamento, informe os detalhes do voo para que nossa equipe avalie e confirme a logística de atendimento adequada à sua chegada.",
  },
  {
    question: "Quais são as formas de pagamento aceitas?",
    answer:
      "As condições comerciais, formas de pagamento (como Pix e cartões de crédito) e eventuais facilidades de parcelamento são alinhadas na proposta de orçamento formalizada pela equipe.",
  },
  {
    question: "É exigida caução ou pré-autorização no cartão?",
    answer:
      "Sim, como prática padrão no setor de locação de veículos, é solicitada uma garantia caução durante o período do contrato. O valor varia conforme a categoria do veículo e é liberado após a devolução e vistoria.",
  },
  {
    question: "A quilometragem é livre ou controlada?",
    answer:
      "Trabalhamos com opções de diárias com quilometragem livre ou pacotes específicos para viagens intermunicipais pelo Ceará. A melhor modalidade para sua rota será detalhada no orçamento.",
  },
  {
    question: "Como solicito o cancelamento ou alteração de datas?",
    answer:
      "Basta entrar em contato com nossa equipe pelo WhatsApp oficial informando o código da sua solicitação ou seu nome. Pedimos que avise com antecedência para reorganizarmos a disponibilidade do veículo.",
  },
  {
    question: "Como funcionam os valores das diárias e opcionais?",
    answer:
      "A diária básica considera 24 horas a partir do horário de retirada, com tolerância combinada em contrato. Os valores apresentados no site são simulações demonstrativas; o valor exato e a inclusão de opcionais (como cadeirinha ou motorista extra) são confirmados na proposta final.",
  },
  {
    question: "Posso devolver o carro em outro local diferente da retirada?",
    answer:
      "Sim, devoluções em locais alternativos em Fortaleza ou na região metropolitana podem ser combinadas previamente com nossa central de atendimento, sujeitas à taxa de retorno conforme a localidade.",
  },
  {
    question: "O que acontece após enviar a solicitação pelo site?",
    answer:
      "Nossa equipe em Fortaleza recebe os dados preenchidos, verifica a disponibilidade física da categoria desejada e envia a confirmação completa da cotação no seu WhatsApp com rapidez.",
  },
];
