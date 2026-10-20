import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  Info,
  Loader2,
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
import { listVehicles } from "@/lib/api";
import { addDaysISO, brl, daysBetween, longDate, todayISO } from "@/lib/format";
import { company, whatsappLink } from "@/lib/env";
import type { Vehicle } from "@/lib/types";
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

interface OptionItem {
  id: string;
  name: string;
  description: string;
  dailyPrice: number;
}

const DEMO_OPTIONALS: OptionItem[] = [
  {
    id: "bebe_conforto",
    name: "Bebê Conforto (0 a 1 ano)",
    description: "Item de segurança para recém-nascidos. Sujeito à disponibilidade no atendimento.",
    dailyPrice: 20,
  },
  {
    id: "cadeirinha",
    name: "Cadeirinha Infantil (1 a 4 anos)",
    description: "Assento com cinto próprio para crianças. Valor demonstrativo.",
    dailyPrice: 20,
  },
  {
    id: "assento_elevacao",
    name: "Assento de Elevação (4 a 7 anos)",
    description: "Recomendado para crianças maiores. Valor demonstrativo.",
    dailyPrice: 15,
  },
  {
    id: "condutor_adicional",
    name: "Condutor Adicional",
    description: "Autorização para mais de um motorista habilitado conduzir o veículo.",
    dailyPrice: 15,
  },
  {
    id: "protecao_vidros_pneus",
    name: "Proteção de Pneus e Vidros (demonstrativo)",
    description: "Cobertura adicional para pequenos danos em retrovisores, vidros e pneus.",
    dailyPrice: 25,
  },
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

  // Etapa 4: Dados do solicitante
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Estado de envio / conclusão
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Carrega veículos
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
  });

  const activeVehicles = useMemo(() => vehicles.filter((v) => v.active), [vehicles]);
  const chosenVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId],
  );

  // Cálculo de diárias e valores
  const rawDays = daysBetween(start, end);
  const calculatedDays = rawDays < 1 ? 1 : rawDays;

  // Total dos opcionais por dia multiplicado pelas diárias
  const optionalsDailyTotal = useMemo(() => {
    return selectedOptionals.reduce((acc, id) => {
      const opt = DEMO_OPTIONALS.find((o) => o.id === id);
      return acc + (opt ? opt.dailyPrice : 0);
    }, 0);
  }, [selectedOptionals]);

  const vehicleDailyRate = chosenVehicle ? chosenVehicle.daily_rate : 0;
  const totalEstimated = (vehicleDailyRate + optionalsDailyTotal) * calculatedDays;

  // Validação da Etapa 1
  const isPeriodValid = useMemo(() => {
    if (!start || !end) return false;
    if (end < start) return false;
    if (end === start && endTime <= startTime) return false;
    return true;
  }, [start, end, startTime, endTime]);

  // Validação da Etapa 4 (apenas dados essenciais)
  const isCustomerValid = useMemo(() => {
    const validName = customer.name.trim().length >= 3;
    const validPhone = customer.phone.replace(/\D/g, "").length >= 10;
    const validEmail = /\S+@\S+\.\S+/.test(customer.email.trim());
    return validName && validPhone && validEmail;
  }, [customer]);

  const toggleOptional = (id: string) => {
    setSelectedOptionals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Gerador de código de consulta de demonstração
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

  const handleCopySummary = () => {
    const message = generateWhatsAppMessage();
    navigator.clipboard.writeText(message);
    toast.success("Resumo do orçamento copiado para a área de transferência!");
  };

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
                  {DEMO_OPTIONALS.map((opt) => {
                    const isChecked = selectedOptionals.includes(opt.id);
                    const optTotal = opt.dailyPrice * calculatedDays;

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
                              +{brl(opt.dailyPrice)}/dia
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                            {opt.description}
                          </p>
                          <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Subtotal para {calculatedDays} diária(s):</span>
                            <strong className="text-foreground font-semibold">
                              {brl(optTotal)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-surface/70 p-4 text-xs text-muted-foreground border border-border/80">
                  <Info className="size-4 shrink-0 text-primary mt-0.5" />
                  <span className="leading-relaxed">
                    A disponibilidade dos opcionais e a tarifa final serão verificadas pela equipe
                    da Sol & Mar durante o atendimento pelo WhatsApp.
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
                    <span className="text-foreground font-semibold">
                      {brl(chosenVehicle.daily_rate * calculatedDays)}
                    </span>
                  </div>

                  {selectedOptionals.length > 0 ? (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Opcionais ({selectedOptionals.length} item[s])</span>
                      <span className="text-foreground font-semibold">
                        +{brl(optionalsDailyTotal * calculatedDays)}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-start justify-between text-muted-foreground pt-1 border-t border-border/50">
                    <span className="shrink-0">Local retirada/devolução</span>
                    <span className="text-foreground font-medium text-right text-xs max-w-[13rem] truncate">
                      {pickupLocation}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-surface/90 border border-primary/25 p-4 mt-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-foreground">Total Estimado</span>
                      <span className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
                        {brl(totalEstimated)}
                      </span>
                    </div>
                    <p className="mt-2 text-[0.7rem] text-muted-foreground leading-relaxed">
                      * Estimativa para consulta de disponibilidade. Proposta final e condições de
                      pagamento enviadas pelo WhatsApp.
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
                <span className="font-medium text-foreground">E-mail para contato *</span>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className={inputClass}
                  required
                />
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
                * Preencha seu nome, WhatsApp com DDD e e-mail para avançar para a revisão final.
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

              {/* Quadro comparativo de revisão */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-xs">
                  <p className="font-semibold text-foreground text-sm border-b border-border/70 pb-2">
                    Locação e Veículo
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Veículo / Grupo:</span>
                    <strong className="text-foreground">{chosenVehicle.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria:</span>
                    <span className="text-foreground">{chosenVehicle.category}</span>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diárias calculadas:</span>
                    <span className="text-foreground font-semibold">
                      {calculatedDays} diária(s)
                    </span>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-xs">
                  <p className="font-semibold text-foreground text-sm border-b border-border/70 pb-2">
                    Solicitante & Estimativa
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Solicitante:</span>
                    <strong className="text-foreground">{customer.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WhatsApp:</span>
                    <span className="text-foreground">{customer.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">E-mail:</span>
                    <span className="text-foreground">{customer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Opcionais:</span>
                    <span className="text-foreground text-right">
                      {selectedOptionals.length > 0
                        ? `${selectedOptionals.length} selecionado(s)`
                        : "Nenhum"}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex items-baseline justify-between">
                    <span className="font-semibold text-foreground">Total Estimado:</span>
                    <span className="font-display text-xl font-semibold text-primary">
                      {brl(totalEstimated)}
                    </span>
                  </div>
                  {customer.notes ? (
                    <div className="border-t border-border/60 pt-2 text-[0.7rem] text-muted-foreground">
                      <strong>Observações:</strong> {customer.notes}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Aviso explícito de caráter de orçamento */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="size-4" />
                  Aviso Importante sobre a Solicitação
                </p>
                <p className="mt-1 leading-relaxed text-amber-300/90 text-[0.72rem]">
                  O envio destas informações constitui um pedido de orçamento e consulta de
                  disponibilidade. A reserva e os valores finais serão confirmados diretamente pela
                  equipe da Sol & Mar Rent a Car via WhatsApp ({company.phoneInternational}),
                  respeitando os horários comerciais e o inventário oficial da empresa.
                </p>
              </div>

              {/* Botões de Envio e Cópia */}
              <div className="flex flex-col gap-3 pt-3 sm:flex-row">
                <Button
                  variant="hero"
                  size="xl"
                  className="flex-1 gap-2"
                  onClick={handleSendToWhatsApp}
                >
                  <MessageCircle className="size-5" />
                  Enviar solicitação pelo WhatsApp
                </Button>

                <Button
                  variant="glass"
                  size="xl"
                  type="button"
                  onClick={handleCopySummary}
                  className="gap-2"
                >
                  <Copy className="size-4" />
                  Copiar resumo
                </Button>
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
