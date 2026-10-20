import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  Package,
  PackageCheck,
  Palette,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VehicleStatusBadge } from "@/components/site/StatusBadge";
import {
  deleteAdditional,
  deleteReservation,
  deleteVehicle,
  listAdditionals,
  listReservations,
  listVehicles,
  saveAdditional,
  saveVehicle,
  setAdditionalActive,
  setVehicleActive,
  updateReservationStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { brl, longDate, shortDate } from "@/lib/format";
import {
  CatalogAdditional,
  Reservation,
  RESERVATION_STATUS_LABEL,
  ReservationStatus,
  Vehicle,
  VEHICLE_COLOR_PRESETS,
  VehicleStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo da Frota | Sol & Mar Rent a Car" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { email, loading, signIn, signOut, mode } = useAuth();
  const queryClient = useQueryClient();

  // Estado de login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Filtros do painel
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Edição / Cadastro de Veículo
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);
  const [isNewVehicle, setIsNewVehicle] = useState(false);

  // Gerenciamento de Fotos
  const [photoVehicle, setPhotoVehicle] = useState<Vehicle | null>(null);

  // Query de veículos
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
  });

  // Mutação para salvar veículo
  const saveMutation = useMutation({
    mutationFn: async (veh: Partial<Vehicle> & { name: string }) => {
      return await saveVehicle(veh);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", saved.id] });
      toast.success(
        isNewVehicle
          ? `Veículo "${saved.name}" cadastrado com sucesso!`
          : `Veículo "${saved.name}" atualizado com sucesso!`,
      );
      setEditingVehicle(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar veículo");
    },
  });

  // Mutação para ativar / desativar
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await setVehicleActive(id, active);
    },
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success(active ? "Veículo publicado no catálogo!" : "Veículo ocultado do catálogo!");
    },
  });

  // Mutação para exclusão
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteVehicle(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Veículo excluído com sucesso.");
    },
  });

  // Aba ativa no painel administrativo
  const [activeTab, setActiveTab] = useState<"vehicles" | "additionals" | "reservations">("vehicles");

  // Edição / Cadastro de Opcional
  const [editingAdditional, setEditingAdditional] = useState<Partial<CatalogAdditional> | null>(null);
  const [isNewAdditional, setIsNewAdditional] = useState(false);

  // Query de opcionais
  const { data: additionals = [], isLoading: isLoadingAdditionals } = useQuery({
    queryKey: ["additionals"],
    queryFn: () => listAdditionals(false),
  });

  // Mutações de Opcionais
  const saveAdditionalMutation = useMutation({
    mutationFn: async (opt: Partial<CatalogAdditional> & { name: string; price: number }) => {
      return await saveAdditional(opt);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["additionals"] });
      toast.success(
        isNewAdditional
          ? `Opcional "${saved.name}" cadastrado com sucesso!`
          : `Opcional "${saved.name}" atualizado com sucesso!`,
      );
      setEditingAdditional(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar opcional.");
    },
  });

  const toggleAdditionalMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await setAdditionalActive(id, active);
    },
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ["additionals"] });
      toast.success(active ? "Opcional ativado no catálogo!" : "Opcional desativado do catálogo!");
    },
  });

  const deleteAdditionalMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteAdditional(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["additionals"] });
      toast.success("Opcional excluído com sucesso.");
    },
  });

  // Query de Reservas
  const [reservationStatusFilter, setReservationStatusFilter] = useState<string>("all");
  const { data: reservations = [], isLoading: isLoadingReservations } = useQuery({
    queryKey: ["reservations"],
    queryFn: listReservations,
  });

  const updateReservationStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReservationStatus }) => {
      await updateReservationStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Situação da reserva atualizada!");
    },
  });

  const deleteReservationMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteReservation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Reserva removida com sucesso.");
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await signIn(loginEmail, loginPassword);
      toast.success("Autenticação realizada com sucesso!");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Falha na autenticação.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        !searchTerm.trim() ||
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.category && v.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchActive =
        filterActive === "all" ||
        (filterActive === "active" && v.active) ||
        (filterActive === "inactive" && !v.active);

      const matchStatus = filterStatus === "all" || v.status === filterStatus;

      return matchSearch && matchActive && matchStatus;
    });
  }, [vehicles, searchTerm, filterActive, filterStatus]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[70vh] items-center justify-center pt-24 text-muted-foreground">
          Carregando painel administrativo...
        </div>
      </SiteLayout>
    );
  }

  // ============================================================
  // TELA DE AUTENTICAÇÃO REAL (QUANDO NÃO LOGADO)
  // ============================================================
  if (!email) {
    return (
      <SiteLayout>
        <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-5 pt-32 pb-20 sm:pt-40">
          <div className="glass-panel rounded-3xl border border-border p-6 shadow-elevate sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="size-6" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-foreground sm:text-2xl">
                Acesso Administrativo
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Gestão da frota e catálogo da Sol & Mar Rent a Car
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <label className="block text-xs font-medium text-foreground">
                E-mail institucional
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admn@solemar.com"
                  required
                  className="mt-1.5 h-11 w-full rounded-xl border border-input bg-surface px-3.5 text-sm outline-none transition-colors focus:border-primary"
                />
              </label>

              <label className="block text-xs font-medium text-foreground">
                Senha de acesso
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1.5 h-11 w-full rounded-xl border border-input bg-surface px-3.5 text-sm outline-none transition-colors focus:border-primary"
                />
              </label>

              {loginError ? (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              ) : null}

              <Button
                type="submit"
                variant="hero"
                size="lg"
                disabled={isLoggingIn}
                className="w-full font-bold shadow-gold"
              >
                {isLoggingIn ? "Autenticando..." : "Entrar no Painel"}
              </Button>
            </form>
          </div>
        </div>
      </SiteLayout>
    );
  }

  // ============================================================
  // PAINEL ADMINISTRATIVO AUTENTICADO
  // ============================================================
  const activeCount = vehicles.filter((v) => v.active).length;
  const inactiveCount = vehicles.length - activeCount;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-[1536px] w-full px-5 pt-32 pb-24 sm:px-8 sm:pt-40 lg:px-12 xl:px-16">
        {/* Barra superior de identificação administrativa */}
        <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
              <ShieldCheck className="size-4" />
              <span>Painel de Gestão da Sol & Mar Rent a Car</span>
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {activeTab === "vehicles" && "Gestão da Frota de Veículos"}
              {activeTab === "additionals" && "Gestão de Opcionais & Acessórios"}
              {activeTab === "reservations" && "Gestão de Reservas & Disponibilidade"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conectado como <strong className="text-foreground">{email}</strong> ·{" "}
              {activeTab === "vehicles" &&
                `Gerencie individualmente os ${vehicles.length} registros da frota.`}
              {activeTab === "additionals" &&
                `Gerencie os ${additionals.length} itens de opcionais e tarifas.`}
              {activeTab === "reservations" &&
                `Acompanhe as ${reservations.length} solicitações e controle de estoque.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "vehicles" && (
              <Button
                variant="hero"
                size="sm"
                onClick={() => {
                  setIsNewVehicle(true);
                  setEditingVehicle({
                    name: "",
                    category: "Hatch",
                    transmission: "Manual",
                    fuel: "Flex",
                    passengers: 5,
                    doors: 4,
                    luggage: 2,
                    daily_rate: 0,
                    deposit_amount: 0,
                    fleet_quantity: 1,
                    color: "Prata",
                    color_hex: "#D1D5DB",
                    status: "disponivel",
                    active: true,
                    images: [],
                    description: "",
                  });
                }}
                className="gap-1.5 font-bold shadow-gold"
              >
                <Plus className="size-4" /> Cadastrar Novo Veículo
              </Button>
            )}

            {activeTab === "additionals" && (
              <Button
                variant="hero"
                size="sm"
                onClick={() => {
                  setIsNewAdditional(true);
                  setEditingAdditional({
                    name: "",
                    description: "",
                    price: 20,
                    type: "per_day",
                    stock_quantity: 5,
                    active: true,
                  });
                }}
                className="gap-1.5 font-bold shadow-gold"
              >
                <Plus className="size-4" /> Cadastrar Novo Opcional
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-3.5" /> Sair
            </Button>
          </div>
        </div>

        {/* Navegação por Abas do Painel */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-border/80 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("vehicles")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors",
              activeTab === "vehicles"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:bg-surface hover:text-foreground",
            )}
          >
            <Car className="size-4" />
            <span>Frota de Veículos</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
                activeTab === "vehicles" ? "bg-black/20 text-white" : "bg-muted text-foreground",
              )}
            >
              {vehicles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("additionals")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors",
              activeTab === "additionals"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:bg-surface hover:text-foreground",
            )}
          >
            <Layers className="size-4" />
            <span>Opcionais & Acessórios</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
                activeTab === "additionals" ? "bg-black/20 text-white" : "bg-muted text-foreground",
              )}
            >
              {additionals.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reservations")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors",
              activeTab === "reservations"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:bg-surface hover:text-foreground",
            )}
          >
            <CalendarDays className="size-4" />
            <span>Reservas & Disponibilidade</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
                activeTab === "reservations" ? "bg-black/20 text-white" : "bg-muted text-foreground",
              )}
            >
              {reservations.length}
            </span>
          </button>
        </div>

        {/* Cards de Resumo */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-[0.7rem] font-semibold text-muted-foreground uppercase">
              Total de Veículos
            </span>
            <p className="mt-1 text-2xl font-bold text-foreground">{vehicles.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-[0.7rem] font-semibold text-primary uppercase">
              Ativos no Catálogo
            </span>
            <p className="mt-1 text-2xl font-bold text-primary">{activeCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-[0.7rem] font-semibold text-muted-foreground uppercase">
              Inativos (Ocultos)
            </span>
            <p className="mt-1 text-2xl font-bold text-muted-foreground">{inactiveCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-[0.7rem] font-semibold text-accent uppercase">
              Disponíveis p/ Locação
            </span>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {vehicles.filter((v) => v.status === "disponivel").length}
            </p>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por modelo ou categoria..."
              className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive")}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="all">Publicação: Todos</option>
              <option value="active">Apenas Ativos (Públicos)</option>
              <option value="inactive">Apenas Inativos (Ocultos)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="all">Situação: Todas</option>
              <option value="disponivel">Disponível</option>
              <option value="reservado">Reservado</option>
              <option value="em_locacao">Em locação</option>
              <option value="manutencao">Manutenção</option>
            </select>
          </div>
        </div>

        {/* Lista de Veículos para Administração */}
        {isLoadingVehicles ? (
          <div className="py-20 text-center text-muted-foreground">Carregando frota...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            Nenhum veículo encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="mt-6 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-card">
            {filteredVehicles.map((vehicle) => {
              const cover = vehicle.cover_image || vehicle.images[0];
              return (
                <div
                  key={vehicle.id}
                  className={cn(
                    "flex flex-col gap-4 p-4 transition-colors hover:bg-surface/40 sm:flex-row sm:items-center sm:justify-between",
                    !vehicle.active ? "opacity-75 bg-surface/20" : "",
                  )}
                >
                  {/* Foto e Informações Básicas */}
                  <div className="flex items-start gap-4">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-surface-2">
                      {cover ? (
                        <img
                          src={cover}
                          alt={vehicle.name}
                          className="size-full object-cover object-center"
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-center p-1 text-[0.65rem] text-muted-foreground">
                          Sem foto
                        </div>
                      )}
                      {vehicle.images.length > 1 ? (
                        <span className="absolute bottom-1 right-1 rounded-md bg-background/90 px-1 py-0.5 text-[0.6rem] font-bold text-foreground">
                          +{vehicle.images.length - 1}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-foreground text-base">{vehicle.name}</h3>
                        <VehicleStatusBadge status={vehicle.status} />
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
                            vehicle.active
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {vehicle.active ? "Ativo no catálogo" : "Inativo (oculto)"}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {vehicle.category ? (
                          <span className="font-semibold text-foreground/90 uppercase text-[0.7rem]">
                            {vehicle.category}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground/75">
                            Categoria a confirmar
                          </span>
                        )}
                        <span>·</span>
                        <span>{vehicle.transmission ?? "Câmbio a confirmar"}</span>
                        <span>·</span>
                        <span>
                          {vehicle.passengers ? `${vehicle.passengers} lugares` : "Lugares a conf."}
                        </span>
                        {vehicle.year ? (
                          <>
                            <span>·</span>
                            <span>Ano {vehicle.year}</span>
                          </>
                        ) : null}
                      </div>

                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="font-bold text-primary text-sm">
                          {vehicle.daily_rate > 0
                            ? `${brl(vehicle.daily_rate)}/dia`
                            : "Consulte a diária"}
                        </span>
                        {vehicle.description ? (
                          <span className="text-[0.7rem] text-muted-foreground truncate max-w-xs">
                            {vehicle.description}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Ações e Controles */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    {/* Botão de Ativação / Desativação */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: vehicle.id,
                          active: !vehicle.active,
                        })
                      }
                      title={
                        vehicle.active
                          ? "Clique para ocultar do catálogo público"
                          : "Clique para publicar no catálogo público"
                      }
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors",
                        vehicle.active
                          ? "border border-border bg-surface text-foreground hover:bg-destructive/10 hover:text-destructive"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
                      )}
                    >
                      {vehicle.active ? (
                        <>
                          <EyeOff className="size-3.5" />
                          <span>Desativar</span>
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5" />
                          <span>Ativar</span>
                        </>
                      )}
                    </button>

                    {/* Botão Gerenciar Fotos */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPhotoVehicle(vehicle)}
                      className="gap-1.5 text-xs"
                    >
                      <ImageIcon className="size-3.5" />
                      <span>Fotos ({vehicle.images.length})</span>
                    </Button>

                    {/* Botão Editar Dados */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsNewVehicle(false);
                        setEditingVehicle({ ...vehicle });
                      }}
                      className="gap-1.5 text-xs"
                    >
                      <Pencil className="size-3.5" />
                      <span>Editar</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL / DIALOG DE EDIÇÃO / CADASTRO                          */}
        {/* ============================================================ */}
        {editingVehicle ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="glass-panel w-full max-w-2xl rounded-3xl border border-border p-6 shadow-elevate sm:p-8 animate-in fade-in-50 duration-200 my-8">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {isNewVehicle ? "Cadastrar Novo Veículo" : `Editar ${editingVehicle.name}`}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Preencha os campos confirmados. Campos não confirmados podem ficar vazios.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editingVehicle.name?.trim()) {
                    toast.error("O nome do veículo é obrigatório");
                    return;
                  }
                  saveMutation.mutate(editingVehicle as Partial<Vehicle> & { name: string });
                }}
                className="mt-6 space-y-4"
              >
                {/* Nome do Veículo */}
                <label className="block text-xs font-semibold text-foreground">
                  Nome do Veículo *
                  <input
                    type="text"
                    value={editingVehicle.name ?? ""}
                    onChange={(e) => setEditingVehicle((v) => ({ ...v, name: e.target.value }))}
                    placeholder="Ex: Chevrolet Spin 1.8 7 Lugares"
                    required
                    className="mt-1 h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </label>

                {/* Grid de Seletores: Categoria, Câmbio, Combustível, Lugares */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-foreground">
                    Categoria (quando confirmada)
                    <select
                      value={editingVehicle.category ?? ""}
                      onChange={(e) =>
                        setEditingVehicle((v) => ({
                          ...v,
                          category: e.target.value || undefined,
                        }))
                      }
                      className="mt-1 h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option value="">A confirmar pela locadora</option>
                      <option value="Hatch">Hatch</option>
                      <option value="Sedã">Sedã</option>
                      <option value="SUV">SUV</option>
                      <option value="Picape">Picape</option>
                      <option value="Minivan">Minivan</option>
                      <option value="Compacto">Compacto</option>
                    </select>
                  </label>

                  <label className="block text-xs font-semibold text-foreground">
                    Câmbio (quando confirmado)
                    <select
                      value={editingVehicle.transmission ?? ""}
                      onChange={(e) =>
                        setEditingVehicle((v) => ({
                          ...v,
                          transmission: e.target.value || undefined,
                        }))
                      }
                      className="mt-1 h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option value="">A confirmar pela locadora</option>
                      <option value="Automático">Automático</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </label>

                  <label className="block text-xs font-semibold text-foreground">
                    Combustível (quando confirmado)
                    <select
                      value={editingVehicle.fuel ?? ""}
                      onChange={(e) =>
                        setEditingVehicle((v) => ({
                          ...v,
                          fuel: e.target.value || undefined,
                        }))
                      }
                      className="mt-1 h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option value="">A confirmar pela locadora</option>
                      <option value="Flex">Flex (Gasolina / Etanol)</option>
                      <option value="Gasolina">Gasolina</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Híbrido">Híbrido</option>
                      <option value="Elétrico">Elétrico</option>
                    </select>
                  </label>

                  <label className="block text-xs font-semibold text-foreground">
                    Quantidade de Lugares
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={editingVehicle.passengers ?? ""}
                      onChange={(e) =>
                        setEditingVehicle((v) => ({
                          ...v,
                          passengers: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder="Ex: 5 ou 7 (ou deixe vazio)"
                      className="mt-1 h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </label>
                </div>

                {/* Ano e Diária */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-foreground">
                    Ano do Modelo (quando confirmado)
                    <input
                      type="number"
                      min="2010"
                      max="2030"
                      value={editingVehicle.year ?? ""}
                      onChange={(e) =>
                        setEditingVehicle((v) => ({
                          ...v,
                          year: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder="Ex: 2026 (ou deixe vazio)"
                      className="mt-1 h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-foreground">
                    Preço da Diária em R$ (0 = Consulte a diária)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editingVehicle.daily_rate ?? 0}
                      onChange={(e) =>
                        setEditingVehicle((v) => ({
                          ...v,
                          daily_rate: Number(e.target.value),
                        }))
                      }
                      className="mt-1 h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </label>
                </div>

                {/* Situação de Disponibilidade e Ativação no Catálogo */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-border/60 pt-4">
                  <label className="block text-xs font-semibold text-foreground">
                    Situação de Disponibilidade
                    <select
                      value={editingVehicle.status ?? "disponivel"}
                      onChange={(e) =>
                        setEditingVehicle((v) => ({
                          ...v,
                          status: e.target.value as VehicleStatus,
                        }))
                      }
                      className="mt-1 h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option value="disponivel">Disponível para locação</option>
                      <option value="reservado">Reservado</option>
                      <option value="em_locacao">Em locação</option>
                      <option value="manutencao">Em manutenção</option>
                    </select>
                  </label>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingVehicle.active ?? true}
                        onChange={(e) =>
                          setEditingVehicle((v) => ({
                            ...v,
                            active: e.target.checked,
                          }))
                        }
                        className="size-4 rounded border-input text-primary focus:ring-primary"
                      />
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          Ativo no Catálogo Público
                        </span>
                        <span className="text-[0.68rem] text-muted-foreground block">
                          Quando desativado, fica oculto do catálogo sem ser excluído.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Descrição / Notas */}
                <label className="block text-xs font-semibold text-foreground">
                  Descrição e Versão (informações adicionais da locadora)
                  <textarea
                    rows={3}
                    value={editingVehicle.description ?? ""}
                    onChange={(e) =>
                      setEditingVehicle((v) => ({ ...v, description: e.target.value }))
                    }
                    placeholder="Ex: Ano 2026. Versão e pacote a confirmar pela locadora."
                    className="mt-1 w-full rounded-xl border border-input bg-surface p-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </label>

                {/* Botões do Formulário */}
                <div className="flex justify-between items-center gap-3 pt-4 border-t border-border/70">
                  {!isNewVehicle && editingVehicle.id ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Tem certeza que deseja excluir o veículo "${editingVehicle.name}"?`,
                          )
                        ) {
                          deleteMutation.mutate(editingVehicle.id!);
                          setEditingVehicle(null);
                        }
                      }}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" /> Excluir Registro
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" onClick={() => setEditingVehicle(null)}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="hero"
                      disabled={saveMutation.isPending}
                      className="gap-2 font-bold shadow-gold"
                    >
                      <Save className="size-4" />
                      {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* ============================================================ */}
        {/* MODAL DE GERENCIAMENTO DE FOTOGRAFIAS DO VEÍCULO              */}
        {/* ============================================================ */}
        {photoVehicle ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="glass-panel w-full max-w-2xl rounded-3xl border border-border p-6 shadow-elevate sm:p-8 animate-in fade-in-50 duration-200 my-8">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Fotos de: {photoVehicle.name}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Envie fotos reais do veículo, defina a foto principal do catálogo ou remova
                    imagens.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoVehicle(null)}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Botão de Upload Local */}
              <div className="mt-5 rounded-2xl border-2 border-dashed border-border/80 bg-surface/40 p-6 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Upload className="size-6" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-foreground">Enviar fotos do veículo</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Selecione fotos do seu dispositivo (JPEG, PNG ou WebP). Proporção recomendada 3:2.
                </p>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-gold hover:bg-primary/90 transition-colors">
                  <Upload className="size-4" />
                  <span>Escolher Arquivos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;

                      Array.from(files).forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string;
                          if (base64) {
                            setPhotoVehicle((prev) => {
                              if (!prev) return prev;
                              const updatedImages = [...prev.images, base64];
                              const updatedVehicle: Vehicle = {
                                ...prev,
                                images: updatedImages,
                                cover_image: prev.cover_image || base64,
                              };
                              saveMutation.mutate(updatedVehicle);
                              return updatedVehicle;
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                      toast.success("Foto(s) carregada(s) e salva(s)!");
                    }}
                  />
                </label>
              </div>

              {/* Opção Foto Ilustrativa */}
              <div className="mt-4">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={photoVehicle.is_illustrative_image ?? false}
                    onChange={(e) => {
                      const updated: Vehicle = {
                        ...photoVehicle,
                        is_illustrative_image: e.target.checked,
                      };
                      setPhotoVehicle(updated);
                      saveMutation.mutate(updated);
                    }}
                    className="size-4 rounded border-input text-primary"
                  />
                  <span>
                    Marcar estas fotos como <strong>ilustrativas</strong> (exibe o aviso no catálogo
                    público para não induzir o cliente ao erro).
                  </span>
                </label>
              </div>

              {/* Galeria de Fotos Cadastradas */}
              <div className="mt-6">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                  Fotos cadastradas ({photoVehicle.images.length})
                </h4>

                {photoVehicle.images.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground bg-surface/30 rounded-xl border border-border/60">
                    Nenhuma foto cadastrada ainda. Utilize o botão acima para enviar.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {photoVehicle.images.map((imgSrc, idx) => {
                      const isCover =
                        photoVehicle.cover_image === imgSrc ||
                        (!photoVehicle.cover_image && idx === 0);

                      return (
                        <div
                          key={`photo-${idx}`}
                          className={cn(
                            "group relative aspect-[3/2] overflow-hidden rounded-xl border bg-surface-2",
                            isCover ? "border-primary ring-2 ring-primary/50" : "border-border",
                          )}
                        >
                          <img
                            src={imgSrc}
                            alt=""
                            className="size-full object-cover object-center"
                          />

                          {/* Badge de Foto Principal */}
                          {isCover ? (
                            <div className="absolute top-2 left-2 rounded-md bg-primary px-2 py-0.5 text-[0.65rem] font-bold text-primary-foreground shadow-xs">
                              Principal
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const updated: Vehicle = {
                                  ...photoVehicle,
                                  cover_image: imgSrc,
                                };
                                setPhotoVehicle(updated);
                                saveMutation.mutate(updated);
                                toast.success("Foto principal definida!");
                              }}
                              className="absolute top-2 left-2 rounded-md bg-background/90 px-2 py-0.5 text-[0.65rem] font-bold text-foreground opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm"
                            >
                              <Star className="inline size-3 mr-1 text-primary" />
                              Tornar Principal
                            </button>
                          )}

                          {/* Botão Remover Foto */}
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = photoVehicle.images.filter((_, i) => i !== idx);
                              const newCover =
                                photoVehicle.cover_image === imgSrc
                                  ? newImages[0]
                                  : photoVehicle.cover_image;
                              const updated: Vehicle = {
                                ...photoVehicle,
                                images: newImages,
                                cover_image: newCover,
                              };
                              setPhotoVehicle(updated);
                              saveMutation.mutate(updated);
                              toast.success("Foto removida.");
                            }}
                            title="Remover foto"
                            className="absolute top-2 right-2 rounded-lg bg-destructive/90 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-xs hover:bg-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end border-t border-border/70 pt-4">
                <Button variant="hero" onClick={() => setPhotoVehicle(null)}>
                  Concluir Fotos
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SiteLayout>
  );
}
