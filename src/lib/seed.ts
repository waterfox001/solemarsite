import type { Customer, Reservation, Vehicle } from "./types";
import { addDaysISO, todayISO } from "./format";
import hatch from "@/assets/car-hatch.jpg";
import sedan from "@/assets/car-sedan.jpg";
import suv from "@/assets/car-suv.jpg";
import pickup from "@/assets/car-pickup.jpg";

/**
 * DADOS DE EXEMPLO (placeholders editáveis).
 * Substitua pelos veículos reais no painel administrativo.
 */
export const seedVehicles: Vehicle[] = [
  {
    id: "v-hatch-economico",
    name: "Hatch Compacto (exemplo)",
    category: "Econômico",
    transmission: "Manual",
    fuel: "Flex",
    passengers: 5,
    doors: 4,
    luggage: 1,
    daily_rate: 129,
    status: "disponivel",
    images: [hatch],
    features: ["Ar-condicionado", "Direção elétrica", "Bluetooth", "Vidros elétricos"],
    description:
      "Ideal para a cidade e para o dia a dia: econômico, ágil e fácil de estacionar. Texto de exemplo — edite no painel.",
    plate: "ABC-0001",
    year: 2024,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "v-sedan-executivo",
    name: "Sedan Executivo (exemplo)",
    category: "Executivo",
    transmission: "Automático",
    fuel: "Flex",
    passengers: 5,
    doors: 4,
    luggage: 3,
    daily_rate: 249,
    status: "disponivel",
    images: [sedan],
    features: ["Câmbio automático", "Couro", "Piloto automático", "Sensor de ré"],
    description:
      "Conforto e presença para viagens de negócios e traslados executivos. Texto de exemplo — edite no painel.",
    plate: "ABC-0002",
    year: 2025,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "v-suv-familia",
    name: "SUV Compacto (exemplo)",
    category: "SUV",
    transmission: "Automático",
    fuel: "Flex",
    passengers: 5,
    doors: 4,
    luggage: 3,
    daily_rate: 289,
    status: "disponivel",
    images: [suv],
    features: ["Altura elevada", "Central multimídia", "Câmera de ré", "Porta-malas amplo"],
    description:
      "Espaço, segurança e altura livre do solo para estradas e viagens em família. Texto de exemplo — edite no painel.",
    plate: "ABC-0003",
    year: 2025,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "v-pickup-trabalho",
    name: "Picape Cabine Dupla (exemplo)",
    category: "Picape",
    transmission: "Manual",
    fuel: "Diesel",
    passengers: 5,
    doors: 4,
    luggage: 4,
    daily_rate: 349,
    status: "manutencao",
    images: [pickup],
    features: ["Tração 4x4", "Caçamba", "Ar-condicionado", "Robustez"],
    description:
      "Força para trabalho, obra e trilha, com conforto de cabine dupla. Texto de exemplo — edite no painel.",
    plate: "ABC-0004",
    year: 2024,
    active: true,
    created_at: new Date().toISOString(),
  },
];

export const seedCustomers: Customer[] = [
  {
    id: "c-exemplo-1",
    name: "Cliente Exemplo",
    email: "cliente@exemplo.com",
    phone: "(00) 00000-0000",
    document: "000.000.000-00",
    city: "Cidade/UF",
    notes: null,
    created_at: new Date().toISOString(),
  },
];

export const seedReservations: Reservation[] = [
  {
    id: "r-exemplo-1",
    code: "SM000001",
    vehicle_id: "v-sedan-executivo",
    customer_id: "c-exemplo-1",
    start_date: addDaysISO(todayISO(), 3),
    end_date: addDaysISO(todayISO(), 6),
    pickup_location: "Loja Sol & Mar",
    return_location: "Loja Sol & Mar",
    days: 3,
    daily_rate: 249,
    total: 747,
    status: "confirmada",
    notes: "Reserva de exemplo",
    created_at: new Date().toISOString(),
  },
];
