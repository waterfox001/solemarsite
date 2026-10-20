import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  HelpCircle,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { company, whatsappLink } from "@/lib/env";
import { seedVehicles } from "@/lib/seed";
import { cn } from "@/lib/utils";

// Opções iniciais configuráveis centralmente
export const ASSISTANT_TOPICS = [
  { id: "alugar", label: "Quero alugar um carro", icon: Sparkles, type: "rental" },
  { id: "disponibilidade", label: "Consultar disponibilidade", icon: Calendar, type: "rental" },
  { id: "valores", label: "Consultar valores da frota", icon: Clock, type: "rental" },
  { id: "frota", label: "Saber mais sobre a frota", icon: Check, type: "info" },
  {
    id: "ajuste",
    label: "Alterar ou esclarecer uma solicitação",
    icon: MessageCircle,
    type: "simple",
  },
  { id: "duvida", label: "Tenho outra dúvida", icon: HelpCircle, type: "simple" },
] as const;

export const LOCATIONS = [
  "Sede Meireles (Av. da Abolição, 1894)",
  "Aeroporto Internacional de Fortaleza (provisório / sob consulta)",
  "Hotel / Orla de Fortaleza (sob consulta)",
] as const;

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

interface RentalData {
  topic: string;
  categoryOrVehicle: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  pickupLocation: string;
  returnLocation: string;
  name: string;
  notes: string;
  simpleQuestion: string;
}

const INITIAL_RENTAL_DATA: RentalData = {
  topic: "",
  categoryOrVehicle: "",
  pickupDate: "",
  pickupTime: "09:00",
  returnDate: "",
  returnTime: "18:00",
  pickupLocation: LOCATIONS[0],
  returnLocation: LOCATIONS[0],
  name: "",
  notes: "",
  simpleQuestion: "",
};

const STORAGE_KEY = "solemar_assistant_state_v1";

export function WhatsAppAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<
    | "welcome"
    | "rental_vehicle"
    | "rental_dates"
    | "rental_location"
    | "rental_name"
    | "rental_notes"
    | "rental_summary"
    | "simple_question"
    | "simple_summary"
  >("welcome");

  const [data, setData] = useState<RentalData>(INITIAL_RENTAL_DATA);
  const [freeInput, setFreeInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lê informações da URL se existirem para reaproveitar no chat
  const searchParams = useRouterState({
    select: (s) => (s.location.search as Record<string, string | undefined>) ?? {},
  });

  // Carrega estado da sessão
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) setData(parsed.data);
        if (parsed.step) setStep(parsed.step);
      }
    } catch {
      // Ignora erro de storage
    }
  }, []);

  // Salva na sessão
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
    } catch {
      // Ignora
    }
  }, [step, data]);

  // Se a rota tiver parâmetros como 'veiculo', pré-configura
  useEffect(() => {
    if (searchParams.veiculo && !data.categoryOrVehicle) {
      const found = seedVehicles.find((v) => v.id === searchParams.veiculo);
      if (found) {
        setData((prev) => ({
          ...prev,
          categoryOrVehicle: `${found.name} (${found.category})`,
          pickupDate: searchParams.inicio || prev.pickupDate,
          returnDate: searchParams.fim || prev.returnDate,
        }));
      }
    }
  }, [searchParams, data.categoryOrVehicle]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, step]);

  const resetConversation = () => {
    setData(INITIAL_RENTAL_DATA);
    setStep("welcome");
    setFreeInput("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignora
    }
  };

  const handleSelectTopic = (topic: (typeof ASSISTANT_TOPICS)[number]) => {
    setData((prev) => ({ ...prev, topic: topic.label }));
    if (topic.type === "rental") {
      setStep("rental_vehicle");
    } else if (topic.type === "info") {
      setData((prev) => ({
        ...prev,
        simpleQuestion: "Gostaria de conhecer os modelos e categorias disponíveis na frota.",
      }));
      setStep("simple_summary");
    } else {
      setStep("simple_question");
    }
  };

  const handleSelectVehicle = (value: string) => {
    setData((prev) => ({ ...prev, categoryOrVehicle: value }));
    setStep("rental_dates");
  };

  const handleConfirmDates = () => {
    if (!data.pickupDate || !data.returnDate) return;
    setStep("rental_location");
  };

  const handleConfirmLocation = () => {
    setStep("rental_name");
  };

  const handleConfirmName = () => {
    if (!data.name.trim()) return;
    setStep("rental_notes");
  };

  const handleFinishRental = () => {
    setStep("rental_summary");
  };

  const handleFinishSimple = () => {
    if (!freeInput.trim()) return;
    setData((prev) => ({ ...prev, simpleQuestion: freeInput.trim() }));
    setStep("simple_summary");
  };

  // Gerador da mensagem final para o WhatsApp
  const finalWhatsAppText = useMemo(() => {
    if (step === "rental_summary") {
      return [
        `*SOLICITAÇÃO VIA SITE — SOL & MAR RENT A CAR*`,
        ``,
        data.name ? `*Nome do Solicitante:* ${data.name}` : `*Solicitante:* Contato pelo site`,
        `*Assunto:* ${data.topic || "Locação de Veículo"}`,
        `*Categoria/Veículo:* ${data.categoryOrVehicle || "A definir"}`,
        `*Retirada:* ${data.pickupDate || "A combinar"} às ${data.pickupTime}`,
        `*Local de Retirada:* ${data.pickupLocation}`,
        `*Devolução:* ${data.returnDate || "A combinar"} às ${data.returnTime}`,
        `*Local de Devolução:* ${data.returnLocation}`,
        data.notes ? `*Observações:* ${data.notes}` : "",
        ``,
        `_Mensagem preparada pelo assistente do site. Aguardo confirmação de disponibilidade e orçamento formal._`,
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      `*CONTATO VIA SITE — SOL & MAR RENT A CAR*`,
      ``,
      data.name ? `*Nome:* ${data.name}` : "",
      `*Assunto:* ${data.topic || "Dúvida geral"}`,
      `*Mensagem:* ${data.simpleQuestion || "Gostaria de mais informações sobre locação."}`,
      ``,
      `_Contato iniciado através do site solemarrentacar.com.br_`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [step, data]);

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(finalWhatsAppText)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      {/* Botão Flutuante com Pulsação Suave */}
      <div className="fixed right-5 bottom-5 z-40 flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Fechar assistente de atendimento" : "Abrir assistente no WhatsApp"}
          aria-expanded={isOpen}
          className={cn(
            "group relative grid size-14 place-items-center rounded-full bg-gradient-gold text-primary-foreground shadow-gold transition-all duration-300 hover:scale-105 active:scale-95",
            !isOpen && "motion-safe:animate-pulse",
          )}
        >
          {/* Anel luminoso pulsante para chamar atenção com elegância */}
          {!isOpen ? (
            <span className="absolute -inset-1 rounded-full bg-primary/20 blur-sm pointer-events-none" />
          ) : null}

          {isOpen ? (
            <X className="size-6 transition-transform duration-200 group-hover:rotate-90" />
          ) : (
            <MessageCircle className="size-6 transition-transform duration-200" />
          )}
        </button>
      </div>

      {/* Painel Interativo de Atendimento */}
      {isOpen ? (
        <div
          role="dialog"
          aria-label="Assistente de Atendimento Sol & Mar"
          className="animate-in fade-in-50 slide-in-from-bottom-4 fixed right-4 bottom-22 z-50 flex w-[23rem] max-w-[calc(100vw-2rem)] flex-col rounded-3xl border border-border bg-card/95 shadow-elevate backdrop-blur-xl duration-200 max-h-[82vh] overflow-hidden"
        >
          {/* Cabeçalho do Chat */}
          <div className="flex items-center justify-between border-b border-border/80 bg-surface/70 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/logo%20sol%20e%20mar.jpeg"
                  alt="Sol & Mar"
                  className="size-9 rounded-xl object-cover ring-1 ring-border shadow-xs"
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-xs text-foreground truncate">
                  Sol & Mar Rent a Car
                </p>
                <p className="text-[0.68rem] text-muted-foreground font-medium">
                  Atendimento oficial · Fortaleza - CE
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetConversation}
                title="Recomeçar atendimento"
                className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Fechar assistente"
                className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Área Rolável de Mensagens e Interações */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {/* Mensagem Inicial de Boas-Vindas */}
            <div className="flex items-start gap-2.5">
              <img
                src="/logo%20sol%20e%20mar.jpeg"
                alt=""
                className="size-6 rounded-lg object-cover ring-1 ring-border mt-0.5 shrink-0"
              />
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface p-3 text-foreground leading-relaxed shadow-2xs">
                <p className="font-semibold text-xs text-primary mb-1">Assistente Sol & Mar</p>
                <p>
                  Olá! ☀️ Seja bem-vindo(a) à <strong>Sol & Mar Rent a Car</strong>. Como podemos
                  ajudar na sua próxima viagem?
                </p>
                <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                  Organizamos sua solicitação aqui para atendimento ágil no WhatsApp oficial.
                </p>
              </div>
            </div>

            {/* ETAPA 1: ESCOLHA DE TÓPICO / MENSAGEM LIVRE */}
            {step === "welcome" && (
              <div className="space-y-2 pt-1 animate-in fade-in-50">
                <p className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  Selecione uma opção para começar:
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {ASSISTANT_TOPICS.map((topic) => {
                    const Icon = topic.icon;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => handleSelectTopic(topic)}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-surface/50 p-2.5 text-left font-medium text-foreground transition-all hover:border-primary/60 hover:bg-surface hover:shadow-xs active:scale-[0.99]"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="size-3.5 text-primary shrink-0" />
                          <span>{topic.label}</span>
                        </span>
                        <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-border/70 pt-2.5 mt-2">
                  <p className="text-[0.68rem] text-muted-foreground mb-1.5">
                    Ou digite uma mensagem livre diretamente:
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Ex: Gostaria de saber os horários de domingo..."
                      value={freeInput}
                      onChange={(e) => setFreeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && freeInput.trim()) {
                          handleFinishSimple();
                        }
                      }}
                      className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
                    />
                    <Button
                      size="sm"
                      variant="hero"
                      disabled={!freeInput.trim()}
                      onClick={handleFinishSimple}
                      className="h-auto px-3"
                    >
                      <Send className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* SEPARADOR DE TÓPICO ESCOLHIDO */}
            {data.topic && step !== "welcome" && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground p-2.5 font-medium shadow-xs">
                  {data.topic}
                </div>
              </div>
            )}

            {/* ETAPA DE LOCAÇÃO 1: CATEGORIA OU VEÍCULO */}
            {step === "rental_vehicle" && (
              <div className="space-y-2 pt-1 animate-in fade-in-50">
                <div className="rounded-2xl rounded-tl-sm bg-surface p-3 text-foreground leading-relaxed">
                  <p className="font-semibold text-xs mb-1">
                    Qual categoria de veículo você prefere?
                  </p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    A locação é confirmada por categoria (com modelo de referência ou similar):
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {seedVehicles.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVehicle(`${v.name} (${v.category})`)}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-surface/50 p-2.5 text-left transition-all hover:border-primary/60 hover:bg-surface"
                    >
                      <div>
                        <p className="font-semibold text-foreground text-xs">{v.category}</p>
                        <p className="text-[0.68rem] text-muted-foreground">
                          {v.reference_model || v.name}
                        </p>
                      </div>
                      <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectVehicle("Ainda em dúvida / Quero recomendação")}
                    className="rounded-xl border border-dashed border-border p-2 text-center text-xs text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                  >
                    Ainda estou em dúvida (ajudem-me a escolher)
                  </button>
                </div>
              </div>
            )}

            {/* VEÍCULO ESCOLHIDO */}
            {data.categoryOrVehicle && step !== "welcome" && step !== "rental_vehicle" && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground p-2.5 font-medium">
                  {data.categoryOrVehicle}
                </div>
              </div>
            )}

            {/* ETAPA DE LOCAÇÃO 2: DATAS E HORÁRIOS */}
            {step === "rental_dates" && (
              <div className="space-y-2.5 pt-1 animate-in fade-in-50">
                <div className="rounded-2xl rounded-tl-sm bg-surface p-3 text-foreground leading-relaxed">
                  <p className="font-semibold text-xs mb-1">Para quais datas você precisa?</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Informe os dias previstos de retirada e devolução em Fortaleza:
                  </p>
                </div>

                <div className="space-y-2 rounded-2xl border border-border/80 bg-surface/40 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[0.65rem] font-semibold text-muted-foreground block mb-1">
                        Retirada:
                      </label>
                      <input
                        type="date"
                        value={data.pickupDate}
                        onChange={(e) => setData({ ...data, pickupDate: e.target.value })}
                        className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[0.65rem] font-semibold text-muted-foreground block mb-1">
                        Horário:
                      </label>
                      <input
                        type="time"
                        value={data.pickupTime}
                        onChange={(e) => setData({ ...data, pickupTime: e.target.value })}
                        className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                    <div>
                      <label className="text-[0.65rem] font-semibold text-muted-foreground block mb-1">
                        Devolução:
                      </label>
                      <input
                        type="date"
                        value={data.returnDate}
                        onChange={(e) => setData({ ...data, returnDate: e.target.value })}
                        className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[0.65rem] font-semibold text-muted-foreground block mb-1">
                        Horário:
                      </label>
                      <input
                        type="time"
                        value={data.returnTime}
                        onChange={(e) => setData({ ...data, returnTime: e.target.value })}
                        className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="hero"
                    disabled={!data.pickupDate || !data.returnDate}
                    onClick={handleConfirmDates}
                    className="w-full font-bold mt-1"
                  >
                    Confirmar datas
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* DATAS CONFIRMADAS */}
            {data.pickupDate &&
              data.returnDate &&
              (step === "rental_location" ||
                step === "rental_name" ||
                step === "rental_notes" ||
                step === "rental_summary") && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground p-2.5 font-medium">
                    De {data.pickupDate} ({data.pickupTime}) até {data.returnDate} (
                    {data.returnTime})
                  </div>
                </div>
              )}

            {/* ETAPA DE LOCAÇÃO 3: LOCAL */}
            {step === "rental_location" && (
              <div className="space-y-2 pt-1 animate-in fade-in-50">
                <div className="rounded-2xl rounded-tl-sm bg-surface p-3 text-foreground leading-relaxed">
                  <p className="font-semibold text-xs mb-1">Onde deseja retirar o carro?</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Selecione o local de preferência (a devolução usará o mesmo local por padrão):
                  </p>
                </div>

                <div className="space-y-1.5">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setData((prev) => ({
                          ...prev,
                          pickupLocation: loc,
                          returnLocation: loc,
                        }));
                        setStep("rental_name");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-xl border p-2.5 text-left font-medium text-xs transition-all",
                        data.pickupLocation === loc
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                          : "border-border/80 bg-surface/50 text-foreground hover:bg-surface",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        <span>{loc}</span>
                      </span>
                      <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* LOCAL CONFIRMADO */}
            {data.pickupLocation &&
              (step === "rental_name" || step === "rental_notes" || step === "rental_summary") && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground p-2.5 font-medium">
                    {data.pickupLocation}
                  </div>
                </div>
              )}

            {/* ETAPA DE LOCAÇÃO 4: NOME DO SOLICITANTE */}
            {step === "rental_name" && (
              <div className="space-y-2.5 pt-1 animate-in fade-in-50">
                <div className="rounded-2xl rounded-tl-sm bg-surface p-3 text-foreground leading-relaxed">
                  <p className="font-semibold text-xs mb-1">Como podemos te chamar?</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Informe seu nome para personalizarmos o atendimento no WhatsApp:
                  </p>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && data.name.trim()) handleConfirmName();
                    }}
                    className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="hero"
                    disabled={!data.name.trim()}
                    onClick={handleConfirmName}
                    className="h-auto px-3 font-bold"
                  >
                    Avançar
                  </Button>
                </div>
              </div>
            )}

            {/* NOME CONFIRMADO */}
            {data.name && (step === "rental_notes" || step === "rental_summary") && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground p-2.5 font-medium">
                  {data.name}
                </div>
              </div>
            )}

            {/* ETAPA DE LOCAÇÃO 5: OBSERVAÇÕES OU FINALIZAR */}
            {step === "rental_notes" && (
              <div className="space-y-2.5 pt-1 animate-in fade-in-50">
                <div className="rounded-2xl rounded-tl-sm bg-surface p-3 text-foreground leading-relaxed">
                  <p className="font-semibold text-xs mb-1">
                    Alguma observação especial? (opcional)
                  </p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Ex: necessidade de cadeira de bebê, voo chegando à noite, condutor adicional:
                  </p>
                </div>

                <textarea
                  rows={2}
                  placeholder="Observações ou dúvidas adicionais..."
                  value={data.notes}
                  onChange={(e) => setData({ ...data, notes: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />

                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("rental_name")}
                    className="text-[0.7rem] text-muted-foreground hover:underline"
                  >
                    Voltar
                  </button>
                  <Button
                    size="sm"
                    variant="hero"
                    onClick={handleFinishRental}
                    className="font-bold"
                  >
                    Ver resumo da solicitação
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* DÚVIDA SIMPLES / PERGUNTA LIVRE */}
            {step === "simple_question" && (
              <div className="space-y-2.5 pt-1 animate-in fade-in-50">
                <div className="rounded-2xl rounded-tl-sm bg-surface p-3 text-foreground leading-relaxed">
                  <p className="font-semibold text-xs mb-1">Qual a sua dúvida ou solicitação?</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Digite abaixo o que você precisa para nossa equipe já receber o contexto:
                  </p>
                </div>

                <textarea
                  rows={3}
                  placeholder="Escreva sua mensagem aqui..."
                  value={freeInput}
                  onChange={(e) => setFreeInput(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  autoFocus
                />

                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("welcome")}
                    className="text-[0.7rem] text-muted-foreground hover:underline"
                  >
                    Voltar às opções
                  </button>
                  <Button
                    size="sm"
                    variant="hero"
                    disabled={!freeInput.trim()}
                    onClick={handleFinishSimple}
                    className="font-bold"
                  >
                    Preparar mensagem
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* RESUMO FINAL: LOCAÇÃO */}
            {step === "rental_summary" && (
              <div className="space-y-3 pt-1 animate-in fade-in-50">
                <div className="rounded-2xl rounded-tl-sm bg-surface p-3 text-foreground leading-relaxed">
                  <p className="font-bold text-xs text-primary mb-1">
                    Pronto! Veja o resumo da sua solicitação:
                  </p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Revise as informações antes de continuar o atendimento no WhatsApp oficial:
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface/60 p-3 space-y-2 text-xs">
                  <div>
                    <span className="text-[0.68rem] text-muted-foreground block">Solicitante:</span>
                    <strong className="text-foreground">{data.name}</strong>
                  </div>
                  <div>
                    <span className="text-[0.68rem] text-muted-foreground block">Categoria:</span>
                    <strong className="text-foreground">{data.categoryOrVehicle}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[0.7rem]">
                    <div>
                      <span className="text-muted-foreground block">Retirada:</span>
                      <span>
                        {data.pickupDate} às {data.pickupTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Devolução:</span>
                      <span>
                        {data.returnDate} às {data.returnTime}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[0.68rem] text-muted-foreground block">Local:</span>
                    <span className="text-foreground text-[0.7rem]">{data.pickupLocation}</span>
                  </div>
                  {data.notes ? (
                    <div>
                      <span className="text-[0.68rem] text-muted-foreground block">
                        Observações:
                      </span>
                      <span className="text-foreground text-[0.7rem]">{data.notes}</span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 pt-1">
                  <Button
                    variant="hero"
                    size="default"
                    className="w-full gap-2 font-bold shadow-gold"
                    onClick={handleOpenWhatsApp}
                  >
                    <MessageCircle className="size-4" />
                    Continuar atendimento pelo WhatsApp
                  </Button>

                  <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground px-1">
                    <button
                      type="button"
                      onClick={() => setStep("rental_vehicle")}
                      className="hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="size-3" /> Alterar dados
                    </button>
                    <span>{company.phoneInternational}</span>
                  </div>
                </div>
              </div>
            )}

            {/* RESUMO FINAL: DÚVIDA SIMPLES */}
            {step === "simple_summary" && (
              <div className="space-y-3 pt-1 animate-in fade-in-50">
                <div className="rounded-2xl rounded-tl-sm bg-surface p-3 text-foreground leading-relaxed">
                  <p className="font-bold text-xs text-primary mb-1">
                    Sua mensagem está pronta para envio!
                  </p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Ao clicar no botão, o WhatsApp abrirá com sua dúvida para nossa equipe em
                    Fortaleza:
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface/60 p-3 space-y-2 text-xs">
                  <div>
                    <span className="text-[0.68rem] text-muted-foreground block">Assunto:</span>
                    <strong className="text-foreground">{data.topic || "Atendimento"}</strong>
                  </div>
                  <div>
                    <span className="text-[0.68rem] text-muted-foreground block">Mensagem:</span>
                    <p className="text-foreground text-[0.72rem] italic">"{data.simpleQuestion}"</p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Button
                    variant="hero"
                    size="default"
                    className="w-full gap-2 font-bold shadow-gold"
                    onClick={handleOpenWhatsApp}
                  >
                    <MessageCircle className="size-4" />
                    Continuar atendimento pelo WhatsApp
                  </Button>

                  <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground px-1">
                    <button
                      type="button"
                      onClick={() => setStep("welcome")}
                      className="hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="size-3" /> Outra dúvida
                    </button>
                    <span>{company.phoneInternational}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Rodapé do Assistente */}
          <div className="border-t border-border/80 bg-surface/40 px-4 py-2.5 text-center text-[0.65rem] text-muted-foreground">
            Atendimento oficial · Resposta direta no WhatsApp da Sol & Mar
          </div>
        </div>
      ) : null}
    </>
  );
}
