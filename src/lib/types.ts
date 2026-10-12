export type VehicleStatus = "disponivel" | "reservado" | "em_locacao" | "manutencao";

export type ReservationStatus =
  "pendente" | "confirmada" | "em_andamento" | "concluida" | "cancelada";

export interface Vehicle {
  id: string;
  name: string;
  category: string;
  transmission: string;
  fuel: string;
  passengers: number;
  doors: number;
  luggage: number;
  daily_rate: number;
  status: VehicleStatus;
  images: string[];
  features: string[];
  description: string;
  plate?: string | null;
  year?: number | null;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
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
  pickup_location?: string | null;
  return_location?: string | null;
  days: number;
  daily_rate: number;
  total: number;
  status: ReservationStatus;
  notes?: string | null;
  created_at: string;
}

export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  document?: string;
  city?: string;
  notes?: string;
}

export interface ReservationInput {
  vehicle_id: string;
  start_date: string;
  end_date: string;
  pickup_location?: string;
  return_location?: string;
  customer: CustomerInput;
}

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  em_locacao: "Em locação",
  manutencao: "Manutenção",
};

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};
