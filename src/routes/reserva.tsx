import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Car,
  CarFront,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHero, SiteLayout } from "@/components/site/SiteLayout";
import { createReservation, listAdditionals, listVehicles } from "@/lib/api";
import { addDaysISO, brl, daysBetween, longDate, todayISO } from "@/lib/format";
import { company, whatsappLink } from "@/lib/env";
import type { CatalogAdditional, Vehicle } from "@/lib/types";
import {
  buildReservationWhatsAppMessage,
  CheckoutBreakdown,
  CheckoutSessionResult,
  preparePaymentCheckoutSession,
} from "@/lib/checkout";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/site/DateRangePicker";

interface Search {
  inicio?: string;
  fim?: string;
  horaInicio?: string;
  horaFim?: string;
  localRetirada?: string;
  localDevolucao?: string;
  categoria?: string;
  veiculo?: string;
}

export const Route = createFileRoute("/reserva")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(typeof s["inicio"] === "string" ? { inicio: s["inicio"] } : {}),
    ...(typeof s["fim"] === "string" ? { fim: s["fim"] } : {}),
    ...(typeof s["horaInicio"] === "string" ? { horaInicio: s["horaInicio"] } : {}),
    ...(typeof s["horaFim"] === "string" ? { horaFim: s["horaFim"] } : {}),
    ...(typeof s["localRetirada"] === "string" ? { localRetirada: s["localRetirada"] } : {}),
    ...(typeof s["localDevolucao"] === "string" ? { localDevolucao: s["localDevolucao"] } : {}),
    ...(typeof s["categoria"] === "string" ? { categoria: s["categoria"] } : {}),
    ...(typeof s["veiculo"] === "string" ? { veiculo: s["veiculo"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Solicitar Orçamento de Locação | Sol & Mar Rent a Car" },
      {
        name: "description",
        content:
          "Simule e solicite seu orçamento de aluguel de veículo em Fortaleza. Escolha datas, horários e categoria sem burocracia.",
      },
      { property: "og:title", content: "Solicitar Orçamento | Sol & Mar Rent a Car" },
      {
        property: "og:description",
        content: "Simule e envie seu pedido de orçamento de locação de veículo pelo WhatsApp.",
      },
    ],
  }),
  component: ReservationFlow,
});

const STEPS = [
  "Dados da locação",
  "Escolha do veículo",
  "Revisão e opcionais",
  "Seus dados",
  "Revisão e envio",
];

const HOURS = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "21:00",
  "22:00",
];

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-surface px-4 text-sm text-foreground outline-none transition-colors focus:border-primary sm:text-base";

function ReservationFlow() {
  const search = Route.useSearch();

  // Etapa atual: 0 (Locação), 1 (Veículo), 2 (Valores/Opcionais), 3 (Dados), 4 (Envio)
  const initialStep = search.veiculo ? 1 : 0;
  const [step, setStep] = useState(initialStep);

  // Etapa 1: Dados da locação
  const [start, setStart] = useState(search.inicio ?? todayISO());
  const [startTime, setStartTime] = useState(search.horaInicio ?? "09:00");
  const [end, setEnd] = useState(search.fim ?? addDaysISO(todayISO(), 3));
  const [endTime, setEndTime] = useState(search.horaFim ?? "09:00");
  const [pickupLocation, setPickupLocation] = useState(
    search.localRetirada ?? company.defaultPickupLocation,
  );
  const [returnLocation, setReturnLocation] = useState(
    search.localDevolucao ?? company.defaultPickupLocation,
  );

  // Etapa 2: Escolha do veículo
  const [vehicleId, setVehicleId] = useState<string | null>(search.veiculo ?? null);

  // Etapa 3: Opcionais selecionados (conjunto de IDs)
  const [selectedOptionals, setSelectedOptionals] = useState<string[]>([]);

  // Etapa 4: Dados do solicitante (e-mail opcional)
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Sessão de checkout e reserva finalizada (preparação de pagamento)
  const [confirmedSession, setConfirmedSession] = useState<CheckoutSessionResult | null>(null);

  // Carrega veículos
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
  });

  // Carrega opcionais ativos cadastrados pela locadora
  const { data: catalogAdditionals = [], isLoading: isLoadingAdditionals } = useQuery({
    queryKey: ["additionals", "active"],
    queryFn: () => listAdditionals(true),
  });

  const activeVehicles = useMemo(() => vehicles.filter((v) => v.active), [vehicles]);
  const chosenVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId],
  );

  // Cálculo de diárias e valores
  const rawDays = daysBetween(start, end);
  const calculatedDays = rawDays < 1 ? 1 : rawDays;

  // Total dos opcionais selecionados (por diária ou taxa única)
  const optionalsSubtotal = useMemo(() => {
    return selectedOptionals.reduce((acc, id) => {
      const opt = catalogAdditionals.find((o) => o.id === id);
      if (!opt) return acc;
      const optCost = opt.type === "per_day" ? opt.price * calculatedDays : opt.price;
      return acc + optCost;
    }, 0);
  }, [selectedOptionals, catalogAdditionals, calculatedDays]);

  const vehicleDailyRate = chosenVehicle ? chosenVehicle.daily_rate : 0;
  const dailySubtotal = vehicleDailyRate * calculatedDays;
  const rentalTotal = dailySubtotal + optionalsSubtotal;
  const depositAmount = chosenVehicle?.deposit_amount ?? 0;
  const advancePaymentAmount = 0; // Regra comercial configurada (sinal antecipado opcional)
  const balanceOnPickup = rentalTotal; // Saldo a acertar na retirada

  // Validação da Etapa 1
  const isPeriodValid = useMemo(() => {
    if (!start || !end) return false;
    if (end < start) return false;
    if (end === start && endTime <= startTime) return false;
    return true;
  }, [start, end, startTime, endTime]);

  // Validação da Etapa 4 (Nome e WhatsApp são obrigatórios; e-mail é estritamente opcional)
  const isCustomerValid = useMemo(() => {
    const validName = customer.name.trim().length >= 3;
    const validPhone = customer.phone.replace(/\D/g, "").length >= 10;
    const validEmail = !customer.email.trim() || /\S+@\S+\.\S+/.test(customer.email.trim());
    return validName && validPhone && validEmail;
  }, [customer]);

  const toggleOptional = (id: string) => {
    setSelectedOptionals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Mutação para registrar a reserva no sistema com status "pendente" e preparar sessão de checkout
  const finalizeReservationMutation = useMutation({
    mutationFn: async () => {
      if (!chosenVehicle) throw new Error("Selecione um veículo");
      const selectedList = selectedOptionals
        .map((id) => catalogAdditionals.find((o) => o.id === id))
        .filter((o): o is CatalogAdditional => Boolean(o))
        .map((o) => ({
          id: o.id,
          name: o.name,
          price: o.price,
          type: o.type,
        }));

      const { reservation, vehicle } = await createReservation({
        vehicle_id: chosenVehicle.id,
        start_date: start,
        end_date: end,
        start_time: startTime,
        end_time: endTime,
        pickup_location: pickupLocation,
        return_location: returnLocation,
        additionals: selectedList,
        advance_payment_amount: advancePaymentAmount,
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim() || undefined,
          notes: customer.notes.trim() || undefined,
        },
      });

      const session = await preparePaymentCheckoutSession(reservation, vehicle, {
        id: reservation.customer_id,
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim() || null,
        created_at: reservation.created_at,
      });
      return session;
    },
    onSuccess: (session) => {
      setConfirmedSession(session);
      toast.success("Reserva provisória registrada com sucesso!");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao processar reserva.");
    },
  });

  // Gerador de código provisório de consulta antes de confirmar
  const quoteCode = useMemo(() => {
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `SM-COT-${rand}`;
  }, []);

  // Construção da mensagem formatada para WhatsApp
  const generateWhatsAppMessage = () => {
    const optNames = selectedOptionals
      .map((id) => DEMO_OPTIONALS.find((o) => o.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    const text = [
      `*SOLICITAÇÃO DE ORÇAMENTO — SOL & MAR RENT A CAR*`,
      `Protocolo: ${quoteCode}`,
      ``,
      `*Dados da Locação em Fortaleza:*`,
      `• Retirada: ${longDate(start)} às ${startTime}`,
      `• Local Retirada: ${pickupLocation}`,
      `• Devolução: ${longDate(end)} às ${endTime}`,
      `• Local Devolução: ${returnLocation}`,
      `• Período: ${calculatedDays} diária(s)`,
      ``,
      `*Veículo Selecionado:*`,
      `• Veículo: ${chosenVehicle?.name ?? "Não especificado"}${chosenVehicle?.category ? ` (${chosenVehicle.category})` : ""}`,
      vehicleDailyRate > 0
        ? `• Diária: ${brl(vehicleDailyRate)}`
        : `• Diária: Consulte a diária (a confirmar com a equipe)`,
      optNames ? `• Opcionais selecionados: ${optNames}` : `• Opcionais: Nenhum`,
      vehicleDailyRate > 0
        ? `• Total estimado: ${brl(totalEstimated)}`
        : `• Total: A confirmar com a equipe`,
      ``,
      `*Dados do Solicitante:*`,
      `• Nome: ${customer.name}`,
      `• WhatsApp: ${customer.phone}`,
      `• E-mail: ${customer.email}`,
      customer.notes.trim() ? `• Observações: ${customer.notes.trim()}` : "",
      ``,
      `_Obs: Solicitação de orçamento e disponibilidade sujeita à confirmação pela equipe da Sol & Mar Rent a Car._`,
    ]
      .filter(Boolean)
      .join("\n");

    return text;
  };

  const handleSendToWhatsApp = () => {
    const message = generateWhatsAppMessage();
    setSubmittedMessage(message);
    const url = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast.success("Solicitação pronta! Redirecionando para o WhatsApp da Sol & Mar...");
  };

  if (confirmedSession) {
    const b = confirmedSession.breakdown;
    const whatsappText = buildReservationWhatsAppMessage(b);
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-5 pt-32 pb-24 sm:px-8 sm:pt-40">
          <div className="glass-panel animate-in fade-in space-y-6 rounded-3xl border border-border p-6 shadow-elevate sm:p-8">
            {/* Header de Sucesso / Pendente */}
            <div className="flex flex-col items-center text-center">
              <div className="grid size-16 place-items-center rounded-3xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                <CheckCircle2 className="size-9 stroke-[2.2]" />
              </div>
              <span className="mt-4 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-500">
                Reserva Provisória Registrada · Aguardando Confirmação
              </span>
              <h1 className="mt-2 text-2xl font-display font-bold text-foreground sm:text-3xl">
                Protocolo: #{b.reservationCode}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm max-w-lg">
                Sua reserva provisória foi registrada com sucesso no sistema da Sol & Mar Rent a
                Car. A unidade deste modelo foi pré-reservada para o período informado.
              </p>
            </div>

            {/* Quadro de Discriminação dos Valores Conforme Regra Comercial */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 text-xs">
              <h3 className="font-bold text-foreground text-sm border-b border-border/70 pb-2">
                Resumo Discriminado da Reserva
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-[0.68rem] text-muted-foreground uppercase font-bold block">
                    1. Veículo Escolhido
                  </span>
                  <p className="font-bold text-foreground text-sm mt-0.5">{b.vehicleName}</p>
                  {b.vehicleCategory ? (
                    <span className="text-accent font-semibold text-[0.7rem]">
                      Categoria: {b.vehicleCategory}
                    </span>
                  ) : null}
                </div>

                <div>
                  <span className="text-[0.68rem] text-muted-foreground uppercase font-bold block">
                    2. Período da Locação ({b.days} diárias)
                  </span>
                  <p className="font-medium text-foreground mt-0.5">{b.periodText}</p>
                  <p className="text-muted-foreground text-[0.7rem] mt-0.5">
                    Retirada: {b.pickupLocation}
                  </p>
                </div>
              </div>

              {/* Tabela de Valores */}
              <div className="border-t border-border/70 pt-3 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    3. Valor das diárias ({b.days}x {brl(b.dailyRate)}):
                  </span>
                  <span className="font-semibold text-foreground">{brl(b.dailySubtotal)}</span>
                </div>

                {b.additionals.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>4. Opcionais selecionados ({b.additionals.length} item[ns]):</span>
                      <span className="font-semibold text-foreground">
                        +{brl(b.additionalsSubtotal)}
                      </span>
                    </div>
                    {b.additionals.map((opt) => (
                      <div
                        key={opt.id}
                        className="flex justify-between pl-3 text-[0.7rem] text-muted-foreground/80"
                      >
                        <span>
                          • {opt.name} (
                          {opt.type === "per_day" ? `${brl(opt.price)}/dia` : "taxa única"}):
                        </span>
                        <span>{brl(opt.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-between text-muted-foreground">
                    <span>4. Opcionais:</span>
                    <span>Nenhum opcional selecionado</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-bold text-foreground">
                  <span>Valor Total da Locação:</span>
                  <span className="text-primary text-base">{brl(b.rentalTotal)}</span>
                </div>
              </div>

              {/* Destaque Explicativo da Caução (Garantia por Bloqueio no Cartão) */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-amber-500">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-4" />
                    5. Caução de Garantia da Locação:
                  </span>
                  <span className="text-sm">
                    {b.depositAmount > 0 ? brl(b.depositAmount) : "A combinar na retirada"}
                  </span>
                </div>
                <p className="text-[0.72rem] text-amber-300/90 leading-relaxed">
                  <strong>Importante:</strong> A caução é uma garantia temporária exigida para a
                  locação deste veículo e funciona como um{" "}
                  <strong>bloqueio (pré-autorização) de limite no cartão de crédito</strong> no ato
                  da retirada. O valor <strong>é liberado integralmente</strong> após a devolução do
                  veículo sem avarias. <strong>Não é cobrança definitiva nem antecipada.</strong>
                </p>
              </div>

              {/* Pagamento e Saldo */}
              <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>6. Valor a pagar antecipadamente para reservar:</span>
                  <span className="font-bold text-foreground">
                    {brl(b.advancePaymentAmount)} (R$ 0,00)
                  </span>
                </div>
                <div className="flex justify-between font-bold text-foreground border-t border-border/60 pt-1.5">
                  <span>7. Valor restante da locação a acertar na retirada:</span>
                  <span className="text-primary font-semibold">{brl(b.balanceOnPickup)}</span>
                </div>
                <p className="text-[0.68rem] text-muted-foreground pt-1">
                  * Formas de pagamento aceitas na retirada: PIX, cartão de crédito ou débito.
                </p>
              </div>

              {/* Dados do Cliente */}
              <div className="border-t border-border/70 pt-3 text-[0.72rem] text-muted-foreground flex flex-wrap gap-4">
                <span>
                  <strong>Cliente:</strong> {b.customerName}
                </span>
                <span>
                  <strong>WhatsApp:</strong> {b.customerPhone}
                </span>
                {b.customerEmail ? (
                  <span>
                    <strong>E-mail:</strong> {b.customerEmail}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Aviso sobre Integração e Confirmação */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
              <span className="font-bold text-foreground block mb-1">
                Próximo Passo: Validação pelo WhatsApp
              </span>
              Nossa equipe comercial da Sol & Mar confirmará a disponibilidade física, contrato e
              orientará sobre a liberação da pré-autorização da caução. Clique no botão abaixo para
              abrir a conversa com os dados preenchidos.
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                variant="hero"
                size="xl"
                className="flex-1 gap-2 font-bold shadow-gold"
                onClick={() => {
                  const url = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(whatsappText)}`;
                  window.open(url, "_blank");
                }}
              >
                <MessageCircle className="size-5" />
                Conversar no WhatsApp com a Reserva #{b.reservationCode}
              </Button>

              <Button
                variant="outline"
                size="xl"
                onClick={() => {
                  navigator.clipboard.writeText(whatsappText);
                  toast.success("Resumo da reserva copiado!");
                }}
                className="gap-2"
              >
                <Copy className="size-4" />
                Copiar Resumo
              </Button>
            </div>

            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConfirmedSession(null);
                  setStep(0);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Iniciar nova simulação
              </Button>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Solicitação de Orçamento"
        title={
          <>
            Simule sua locação em <span className="italic text-primary">Fortaleza</span>
          </>
        }
        description="Preencha os dados em 5 passos rápidos para solicitar seu orçamento personalizado diretamente com a equipe da Sol & Mar."
      />

      <section className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        {/* Barra de Progresso das 5 Etapas */}
        <div className="mb-10">
          <ol className="grid grid-cols-5 gap-2">
            {STEPS.map((label, i) => (
              <li key={label} className="min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    // Permite voltar livremente a etapas já acessadas
                    if (i < step) setStep(i);
                  }}
                  disabled={i > step}
                  className={cn(
                    "w-full text-left transition-opacity",
                    i > step ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                  )}
                >
                  <div
                    className={cn(
                      "h-1.5 w-full rounded-full transition-colors duration-300",
                      i <= step ? "bg-primary" : "bg-border",
                    )}
                  />
                  <p
                    className={cn(
                      "mt-2.5 truncate text-[0.68rem] font-medium sm:text-xs",
                      i === step
                        ? "font-semibold text-primary"
                        : i < step
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    <span className="hidden sm:inline">{i + 1}. </span>
                    {label}
                  </p>
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* ============================================================ */}
        {/* ETAPA 1: DADOS DA LOCAÇÃO                                     */}
        {/* ============================================================ */}
        {step === 0 ? (
          <div className="glass-panel animate-in fade-in space-y-6 rounded-3xl p-6 shadow-elevate sm:p-8">
            <div className="border-b border-border/70 pb-4">
              <h2 className="text-xl font-semibold sm:text-2xl">
                1. Onde e quando você precisa do veículo?
              </h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Informe o período da sua estadia em Fortaleza para simular a quantidade de diárias.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Local de Retirada */}
              <label className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:col-span-2">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <MapPin className="size-4 text-primary" />
                  Local de Retirada
                </span>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className={inputClass}
                >
                  <option value="Aeroporto Internacional de Fortaleza">
                    Aeroporto Internacional de Fortaleza (opção provisória a confirmar)
                  </option>
                  <option value="Avenida da Abolição, 1894, Meireles (Sede comercial - a combinar)">
                    Avenida da Abolição, 1894, Meireles (Sede comercial - entrega a combinar)
                  </option>
                  <option value="A combinar com a equipe comercial em Fortaleza">
                    A combinar com a equipe comercial em Fortaleza (hotel / endereço)
                  </option>
                </select>
                <span className="text-[0.7rem] text-muted-foreground">
                  * Opção provisória de simulação. A operação exata de entrega/retirada será
                  alinhada diretamente com a equipe da Sol & Mar.
                </span>
              </label>

              {/* Período da locação com DateRangePicker interativo */}
              <div className="sm:col-span-2">
                <DateRangePicker
                  start={start}
                  end={end}
                  onChangeRange={(s, e) => {
                    setStart(s);
                    setEnd(e);
                  }}
                  startTime={startTime}
                  endTime={endTime}
                  onChangeStartTime={(t) => setStartTime(t)}
                  onChangeEndTime={(t) => setEndTime(t)}
                  hours={HOURS}
                />
              </div>

              {/* Local de Devolução */}
              <label className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:col-span-2">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <MapPin className="size-4 text-primary" />
                  Local de Devolução
                </span>
                <select
                  value={returnLocation}
                  onChange={(e) => setReturnLocation(e.target.value)}
                  className={inputClass}
                >
                  <option value="Aeroporto Internacional de Fortaleza">
                    Aeroporto Internacional de Fortaleza (opção provisória a confirmar)
                  </option>
                  <option value="Avenida da Abolição, 1894, Meireles (Sede comercial - a combinar)">
                    Avenida da Abolição, 1894, Meireles (Sede comercial - entrega a combinar)
                  </option>
                  <option value="A combinar com a equipe comercial em Fortaleza">
                    A combinar com a equipe comercial em Fortaleza (hotel / endereço)
                  </option>
                </select>
              </label>
            </div>

            {/* Alerta de consistência */}
            {!isPeriodValid ? (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>A data e horário de devolução devem ser posteriores aos da retirada.</span>
              </div>
            ) : null}

            {/* Rodapé da Etapa 1 */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-5">
              <div className="text-xs text-muted-foreground">
                <span>Período calculado: </span>
                <strong className="text-foreground">
                  {isPeriodValid ? `${calculatedDays} diária(s)` : "Período inválido"}
                </strong>
              </div>

              <Button variant="hero" size="lg" disabled={!isPeriodValid} onClick={() => setStep(1)}>
                Avançar para escolha do veículo
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* ============================================================ */}
        {/* ETAPA 2: ESCOLHA DO VEÍCULO                                   */}
        {/* ============================================================ */}
        {step === 1 ? (
          <div className="animate-in fade-in space-y-6">
            <div className="glass-panel flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold sm:text-2xl">
                  2. Selecione a categoria ou modelo
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {longDate(start)} ({startTime}) → {longDate(end)} ({endTime}) ·{" "}
                  <strong className="text-foreground">{calculatedDays} diária(s)</strong>
                </p>
              </div>
              <Button variant="glass" size="sm" onClick={() => setStep(0)}>
                Alterar período
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              * O catálogo abaixo apresenta grupos de veículos demonstrativos. A confirmação do
              modelo exato ou similar ocorrerá com a equipe de atendimento.
            </p>

            {isLoadingVehicles ? (
              <div className="flex justify-center py-20">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {activeVehicles.map((v) => {
                  const isSelected = vehicleId === v.id;
                  const estimatedForVehicle = v.daily_rate * calculatedDays;

                  return (
                    <div
                      key={v.id}
                      onClick={() => setVehicleId(v.id)}
                      className={cn(
                        "card-hover group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card p-4 transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary/60 bg-surface/90"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <div className="flex gap-4">
                        {v.cover_image || v.images[0] ? (
                          <img
                            src={v.cover_image || v.images[0]}
                            alt={v.name}
                            className="h-24 w-32 shrink-0 rounded-xl object-cover bg-surface-2"
                          />
                        ) : (
                          <div className="grid h-24 w-32 shrink-0 place-items-center rounded-xl bg-surface-2 text-xs text-muted-foreground">
                            <Car className="size-6 text-muted-foreground/60" />
                          </div>
                        )}

                        <div className="flex flex-1 flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[0.68rem] font-bold tracking-wider text-accent uppercase">
                                {v.group_code ? `${v.group_code} · ` : ""}
                                {v.category}
                              </span>
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[0.68rem] font-bold text-primary">
                                  <Check className="size-3" /> Selecionado
                                </span>
                              ) : null}
                            </div>
                            <h3 className="font-bold text-foreground text-sm sm:text-base mt-0.5">
                              {v.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {[
                                v.transmission,
                                v.fuel,
                                v.passengers ? `${v.passengers} lugares` : null,
                                v.year ? `Ano ${v.year}` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>

                          <div className="mt-2 flex items-baseline justify-between border-t border-border/50 pt-1.5">
                            <span className="text-[0.68rem] text-muted-foreground">
                              {v.daily_rate > 0 ? `${brl(v.daily_rate)}/dia` : "Tarifa"}
                            </span>
                            <span className="font-semibold text-primary text-sm sm:text-base">
                              {v.daily_rate > 0 ? brl(estimatedForVehicle) : "Consulte a diária"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ações de navegação da Etapa 2 */}
            <div className="flex justify-between gap-4 border-t border-border/70 pt-6">
              <Button variant="glass" size="lg" onClick={() => setStep(0)}>
                <ArrowLeft className="size-4" /> Voltar aos dados da locação
              </Button>
              <Button variant="hero" size="lg" disabled={!vehicleId} onClick={() => setStep(2)}>
                Avançar para opcionais e valores
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* ============================================================ */}
        {/* ETAPA 3: REVISÃO DE VALORES E OPCIONAIS                      */}
        {/* ============================================================ */}
        {step === 2 && chosenVehicle ? (
          <div className="animate-in fade-in space-y-8">
            <div className="border-b border-border/70 pb-4">
              <h2 className="text-xl font-bold sm:text-2xl text-foreground">
                3. Opcionais e estimativa de valores
              </h2>
              <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                Selecione serviços opcionais para compor sua cotação. Nenhum pagamento é cobrado
                neste momento.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.35fr_1.05fr]">
              {/* Coluna da Esquerda: Lista de Opcionais com espaçamento generoso */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
                    Serviços e Itens Opcionais
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {selectedOptionals.length} selecionado(s)
                  </span>
                </div>

                <div className="space-y-3.5">
                  {isLoadingAdditionals ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Carregando opcionais disponíveis...
                    </div>
                  ) : catalogAdditionals.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground bg-card">
                      Nenhum opcional cadastrado no momento. Você pode prosseguir com a locação
                      padrão do veículo.
                    </div>
                  ) : (
                    catalogAdditionals.map((opt) => {
                      const isChecked = selectedOptionals.includes(opt.id);
                      const optTotal =
                        opt.type === "per_day" ? opt.price * calculatedDays : opt.price;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => toggleOptional(opt.id)}
                          className={cn(
                            "card-hover flex cursor-pointer items-start gap-4 rounded-2xl border p-4.5 transition-all",
                            isChecked
                              ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs"
                              : "border-border/90 bg-card hover:border-primary/40",
                          )}
                        >
                          <div
                            className={cn(
                              "mt-1 grid size-5.5 shrink-0 place-items-center rounded-md border transition-colors",
                              isChecked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-surface",
                            )}
                          >
                            {isChecked ? <Check className="size-3.5 stroke-[3]" /> : null}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-bold text-foreground text-sm sm:text-base">
                                {opt.name}
                              </p>
                              <span className="text-xs sm:text-sm font-bold text-primary shrink-0 bg-primary/10 px-2.5 py-1 rounded-lg">
                                +{brl(opt.price)}
                                <span className="text-[0.68rem] font-normal text-muted-foreground ml-1">
                                  {opt.type === "per_day" ? "/dia" : "taxa única"}
                                </span>
                              </span>
                            </div>
                            {opt.description ? (
                              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                {opt.description}
                              </p>
                            ) : null}
                            <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {opt.type === "per_day"
                                  ? `Subtotal para ${calculatedDays} diária(s):`
                                  : "Taxa fixa para todo o período:"}
                              </span>
                              <strong className="text-foreground font-semibold">
                                {brl(optTotal)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-surface/70 p-4 text-xs text-muted-foreground border border-border/80">
                  <Info className="size-4 shrink-0 text-primary mt-0.5" />
                  <span className="leading-relaxed">
                    A disponibilidade dos itens e a conferência dos acessórios serão checadas
                    diretamente pela equipe da Sol & Mar na validação do pedido.
                  </span>
                </div>
              </div>

              {/* Coluna da Direita: Quadro Resumo de Valores Claro e Arejado */}
              <div className="glass-panel space-y-6 rounded-3xl p-6 sm:p-7 shadow-elevate h-fit border border-border/90">
                <div className="flex items-center justify-between border-b border-border/70 pb-3.5">
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Resumo da Cotação
                  </h3>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {calculatedDays} {calculatedDays === 1 ? "diária" : "diárias"}
                  </span>
                </div>

                {/* Miniatura e Dados do Veículo */}
                <div className="flex items-center gap-3.5 rounded-2xl bg-surface/60 p-3.5 border border-border/60">
                  {chosenVehicle.images[0] ? (
                    <img
                      src={chosenVehicle.images[0]}
                      alt={chosenVehicle.name}
                      className="size-16 sm:size-18 rounded-xl object-cover bg-surface-2 shrink-0 ring-1 ring-border/50"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.68rem] font-bold text-accent uppercase tracking-wider">
                      {chosenVehicle.group_code ? `${chosenVehicle.group_code} · ` : ""}
                      {chosenVehicle.category}
                    </p>
                    <p className="font-bold text-sm sm:text-base text-foreground truncate">
                      {chosenVehicle.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Diária base:{" "}
                      <strong className="text-foreground">{brl(chosenVehicle.daily_rate)}</strong>
                    </p>
                  </div>
                </div>

                {/* Separação Visual das Linhas de Custo */}
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Diárias do veículo ({calculatedDays}x)</span>
                    <span className="text-foreground font-semibold">{brl(dailySubtotal)}</span>
                  </div>

                  {selectedOptionals.length > 0 ? (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Opcionais selecionados</span>
                      <span className="text-foreground font-semibold">
                        +{brl(optionalsSubtotal)}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-start justify-between text-muted-foreground pt-1 border-t border-border/50">
                    <span className="shrink-0">Local retirada</span>
                    <span className="text-foreground font-medium text-right text-xs max-w-[13rem] truncate">
                      {pickupLocation}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-surface/90 border border-primary/25 p-4 mt-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-foreground">Total da Locação</span>
                      <span className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
                        {brl(rentalTotal)}
                      </span>
                    </div>

                    {/* Exibição da Caução de Garantia */}
                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="size-3.5 text-amber-500" />
                        Caução de garantia:
                      </span>
                      <span className="font-bold text-amber-500">
                        {depositAmount > 0 ? brl(depositAmount) : "A combinar"}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.68rem] text-muted-foreground leading-relaxed">
                      * A caução é garantia via bloqueio temporário no cartão de crédito na
                      retirada, liberada na devolução.
                    </p>
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full font-bold shadow-gold text-sm sm:text-base h-12"
                  onClick={() => setStep(3)}
                >
                  Continuar para identificação
                  <ArrowRight className="size-4 ml-1.5" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between gap-4 border-t border-border/70 pt-6">
              <Button variant="glass" size="lg" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4" /> Voltar à escolha do veículo
              </Button>
              <Button variant="hero" size="lg" onClick={() => setStep(3)}>
                Continuar <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* ============================================================ */}
        {/* ETAPA 4: DADOS DO SOLICITANTE                                 */}
        {/* ============================================================ */}
        {step === 3 ? (
          <div className="glass-panel animate-in fade-in space-y-6 rounded-3xl p-6 shadow-elevate sm:p-8">
            <div className="border-b border-border/70 pb-4">
              <h2 className="text-xl font-semibold sm:text-2xl">
                4. Como nossa equipe deve entrar em contato?
              </h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Apenas informações essenciais para prepararmos o orçamento. Não solicitamos dados de
                pagamento nem documentos completos neste momento.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:col-span-2">
                <span className="font-medium text-foreground">Nome completo *</span>
                <input
                  type="text"
                  placeholder="Seu nome e sobrenome"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <MessageCircle className="size-4 text-primary" />
                  Telefone / WhatsApp *
                </span>
                <input
                  type="tel"
                  placeholder="(85) 99999-9999"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className={inputClass}
                  required
                />
                <span className="text-[0.68rem] text-muted-foreground">
                  Usaremos para enviar o retorno do orçamento.
                </span>
              </label>

              <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">E-mail para contato (opcional)</span>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com (opcional)"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className={inputClass}
                />
                <span className="text-[0.68rem] text-muted-foreground">
                  Opcional. Se informado, usaremos para enviar confirmação e cópia da proposta.
                </span>
              </label>

              <label className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:col-span-2">
                <span className="font-medium text-foreground">
                  Observações ou necessidades (opcional)
                </span>
                <textarea
                  placeholder="Ex: número do voo de chegada, horário estimado de pouso ou dúvidas específicas..."
                  value={customer.notes}
                  onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-input bg-surface p-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                />
              </label>
            </div>

            {!isCustomerValid ? (
              <p className="text-xs text-muted-foreground">
                * Preencha seu nome e WhatsApp com DDD para avançar para a revisão final. O e-mail é
                opcional.
              </p>
            ) : null}

            <div className="flex justify-between gap-4 border-t border-border/70 pt-6">
              <Button variant="glass" size="lg" onClick={() => setStep(2)}>
                <ArrowLeft className="size-4" /> Voltar aos opcionais
              </Button>
              <Button
                variant="hero"
                size="lg"
                disabled={!isCustomerValid}
                onClick={() => setStep(4)}
              >
                Avançar para revisão e envio
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* ============================================================ */}
        {/* ETAPA 5: REVISÃO E ENVIO DA SOLICITAÇÃO                      */}
        {/* ============================================================ */}
        {step === 4 && chosenVehicle ? (
          <div className="animate-in fade-in space-y-6">
            <div className="glass-panel space-y-6 rounded-3xl p-6 shadow-elevate sm:p-8">
              <div className="border-b border-border/70 pb-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
                    Código Provisório: {quoteCode}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                  5. Revise seus dados antes de enviar
                </h2>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Esta mensagem será encaminhada para o WhatsApp oficial da Sol & Mar Rent a Car (
                  {company.phoneInternational}) para verificação de disponibilidade e proposta
                  formal.
                </p>
              </div>

              {/* Quadro comparativo de revisão completo */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Coluna 1: Dados da Locação e Veículo */}
                <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-xs">
                  <p className="font-semibold text-foreground text-sm border-b border-border/70 pb-2">
                    1. Veículo & Período da Locação
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Veículo Escolhido:</span>
                    <strong className="text-foreground">{chosenVehicle.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria:</span>
                    <span className="text-foreground">
                      {chosenVehicle.category || "A confirmar"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retirada:</span>
                    <span className="text-foreground">
                      {longDate(start)} às {startTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Local Retirada:</span>
                    <span className="text-foreground text-right">{pickupLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Devolução:</span>
                    <span className="text-foreground">
                      {longDate(end)} às {endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Local Devolução:</span>
                    <span className="text-foreground text-right">{returnLocation}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2 font-medium">
                    <span className="text-muted-foreground">Quantidade de diárias:</span>
                    <span className="text-foreground font-bold">{calculatedDays} diária(s)</span>
                  </div>
                </div>

                {/* Coluna 2: Solicitante & Contato */}
                <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-xs">
                  <p className="font-semibold text-foreground text-sm border-b border-border/70 pb-2">
                    Dados do Solicitante
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome completo:</span>
                    <strong className="text-foreground">{customer.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone / WhatsApp:</span>
                    <span className="text-foreground">{customer.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">E-mail:</span>
                    <span className="text-foreground">
                      {customer.email.trim() ? customer.email : "Não informado (opcional)"}
                    </span>
                  </div>
                  {customer.notes.trim() ? (
                    <div className="border-t border-border/60 pt-2 text-[0.72rem] text-muted-foreground">
                      <strong>Observações:</strong> {customer.notes.trim()}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Quadro de Discriminação de Valores */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-xs">
                <p className="font-semibold text-foreground text-sm border-b border-border/70 pb-2">
                  Discriminação Detalhada dos Valores
                </p>

                <div className="flex justify-between text-muted-foreground">
                  <span>
                    Valor das diárias ({calculatedDays}x {brl(vehicleDailyRate)}):
                  </span>
                  <span className="font-semibold text-foreground">{brl(dailySubtotal)}</span>
                </div>

                {selectedOptionals.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Opcionais selecionados ({selectedOptionals.length} item[ns]):</span>
                      <span className="font-semibold text-foreground">
                        +{brl(optionalsSubtotal)}
                      </span>
                    </div>
                    {selectedOptionals.map((id) => {
                      const opt = catalogAdditionals.find((o) => o.id === id);
                      if (!opt) return null;
                      const optCost =
                        opt.type === "per_day" ? opt.price * calculatedDays : opt.price;
                      return (
                        <div
                          key={opt.id}
                          className="flex justify-between pl-3 text-[0.7rem] text-muted-foreground"
                        >
                          <span>
                            • {opt.name} (
                            {opt.type === "per_day" ? `${brl(opt.price)}/dia` : "taxa única"}):
                          </span>
                          <span>{brl(optCost)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Opcionais selecionados:</span>
                    <span>Nenhum item adicional</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-bold text-foreground">
                  <span>Valor Total da Locação (custo efetivo):</span>
                  <span className="text-primary text-base font-display">{brl(rentalTotal)}</span>
                </div>

                {/* Destaque Explicativo da Caução Exigida */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1 mt-2">
                  <div className="flex items-center justify-between font-bold text-amber-500 text-xs sm:text-sm">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="size-4" />
                      Valor da Caução Exigida (Garantia da Locação):
                    </span>
                    <span>{depositAmount > 0 ? brl(depositAmount) : "A combinar na retirada"}</span>
                  </div>
                  <p className="text-[0.72rem] text-amber-300/90 leading-relaxed pt-1">
                    <strong>Garantia temporária:</strong> A caução é bloqueada no cartão de crédito
                    na retirada (pré-autorização) e liberada integralmente após a devolução do
                    veículo sem avarias.{" "}
                    <strong>
                      Não é uma cobrança definitiva e não compõe a receita das diárias.
                    </strong>
                  </p>
                </div>

                {/* Condições de Pagamento */}
                <div className="rounded-xl border border-border/80 bg-surface/60 p-4 space-y-1.5 mt-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Valor a pagar antecipadamente para reservar:</span>
                    <span className="font-bold text-foreground">
                      {brl(advancePaymentAmount)} (R$ 0,00)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-foreground border-t border-border/60 pt-1.5">
                    <span>Valor restante da locação a acertar na retirada:</span>
                    <span className="text-primary font-semibold">{brl(balanceOnPickup)}</span>
                  </div>
                  <p className="text-[0.7rem] text-muted-foreground pt-1">
                    * O saldo da locação pode ser pago na retirada via PIX, cartão de crédito ou
                    débito.
                  </p>
                </div>
              </div>

              {/* Botões de Finalização e Envio */}
              <div className="space-y-3 pt-2">
                <Button
                  variant="hero"
                  size="xl"
                  disabled={finalizeReservationMutation.isPending}
                  className="w-full gap-2 font-bold shadow-gold text-sm sm:text-base h-13"
                  onClick={() => finalizeReservationMutation.mutate()}
                >
                  {finalizeReservationMutation.isPending ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      <span>Registrando reserva provisória...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-5" />
                      <span>Confirmar Solicitação de Reserva</span>
                    </>
                  )}
                </Button>

                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <Button
                    variant="glass"
                    size="lg"
                    className="flex-1 gap-2 text-xs"
                    onClick={handleSendToWhatsApp}
                  >
                    <MessageCircle className="size-4" />
                    Enviar diretamente pelo WhatsApp
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    type="button"
                    onClick={handleCopySummary}
                    className="gap-2 text-xs"
                  >
                    <Copy className="size-4" />
                    Copiar resumo
                  </Button>
                </div>
              </div>
            </div>

            {/* Ação de retorno */}
            <div className="flex justify-between">
              <Button variant="ghost" size="lg" onClick={() => setStep(3)}>
                <ArrowLeft className="size-4" /> Voltar e editar dados
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link to="/">Voltar à página inicial</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </SiteLayout>
  );
}
