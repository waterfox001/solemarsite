export type VehicleStatus = "disponivel" | "reservado" | "em_locacao" | "manutencao";

export type ReservationStatus =
  "pendente" | "confirmada" | "em_andamento" | "concluida" | "cancelada";

export interface VehicleAdditional {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: "per_day" | "per_rental";
}

export interface SelectedAdditional {
  id: string;
  name: string;
  price: number;
  type: "per_day" | "per_rental";
  total: number;
}

export interface VehicleColorPreset {
  label: string;
  hex: string;
  border?: boolean;
}

export const VEHICLE_COLOR_PRESETS: VehicleColorPreset[] = [
  { label: "Branco", hex: "#FFFFFF", border: true },
  { label: "Preto", hex: "#111827" },
  { label: "Prata", hex: "#D1D5DB" },
  { label: "Cinza", hex: "#6B7280" },
  { label: "Azul", hex: "#1E40AF" },
  { label: "Vermelho", hex: "#DC2626" },
  { label: "Prata metálico", hex: "#E5E7EB", border: true },
  { label: "Cinza metálico", hex: "#4B5563" },
];

export interface Vehicle {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  category?: string;
  group_code?: string;
  reference_model?: string;
  similar_models?: string[];
  category_badge?: string;
  transmission?: string;
  fuel?: string;
  passengers?: number | null;
  doors?: number | null;
  luggage?: number | null;
  daily_rate: number;
  deposit_amount?: number; // Valor da caução configurável individualmente
  fleet_quantity?: number; // Quantidade de unidades na frota deste modelo (controle de estoque)
  color?: string; // Cor cadastrada do veículo
  color_hex?: string; // Amostra visual de cor
  available_additionals?: VehicleAdditional[]; // Opcionais e preços
  status: VehicleStatus;
  images: string[];
  cover_image?: string;
  is_illustrative_image?: boolean;
  features?: string[];
  description?: string;
  plate?: string | null;
  year?: number | null;
  engine?: string;
  active: boolean;
  created_at: string;
}

export interface CatalogAdditional {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: "per_day" | "per_rental";
  stock_quantity: number;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  document?: string | null;
  city?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Reservation {
  id: string;
  code: string;
  vehicle_id: string;
  customer_id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  pickup_location?: string | null;
  return_location?: string | null;
  days: number;
  daily_rate: number;
  daily_subtotal: number; // Diárias x dias
  additionals_subtotal: number; // Soma calculada dos opcionais
  rental_total: number; // Custo definitivo da locação (diárias + opcionais)
  deposit_amount: number; // Caução exigida como garantia (bloqueio temporário no cartão)
  advance_payment_amount: number; // Valor a pagar antecipadamente para reserva (regra comercial)
  balance_on_pickup: number; // Saldo restante da locação a acertar na retirada
  total: number; // Total de referência da locação
  status: ReservationStatus;
  additionals?: SelectedAdditional[];
  payment_status?: "pendente_checkout" | "aguardando_aprovacao" | "pago" | "nao_pago";
  payment_provider?: string | null;
  payment_gateway_note?: string;
  notes?: string | null;
  created_at: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string; // Opcional conforme requisito da locadora
  document?: string;
  city?: string;
  notes?: string;
}

export interface ReservationInput {
  vehicle_id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  pickup_location?: string;
  return_location?: string;
  additionals?: { id: string; name: string; price: number; type: "per_day" | "per_rental" }[];
  advance_payment_amount?: number;
  customer: CustomerInput;
}

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  em_locacao: "Em locação",
  manutencao: "Manutenção",
};

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  pendente: "Aguardando confirmação",
  confirmada: "Confirmada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};
