import { supabase } from "./supabase";
import { readDB, uid, writeDB } from "./local-store";
import { daysBetween, overlaps } from "./format";
import type {
  Customer,
  Reservation,
  ReservationInput,
  ReservationStatus,
  Vehicle,
  VehicleStatus,
} from "./types";

/**
 * Camada de dados única. Usa o Supabase externo quando as variáveis de
 * ambiente estão preenchidas; caso contrário, mantém tudo no navegador
 * (modo demonstração). Nenhum serviço proprietário envolvido.
 */

const isRemoteEnabled = () => supabase !== null;

const ACTIVE_STATUSES: ReservationStatus[] = ["pendente", "confirmada", "em_andamento"];

const genCode = () => `SM${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

/* ----------------------------- VEÍCULOS ----------------------------- */

export async function listVehicles(): Promise<Vehicle[]> {
  if (isRemoteEnabled()) {
    const { data, error } = await supabase!
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Vehicle[];
  }
  return readDB().vehicles;
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  if (isRemoteEnabled()) {
    const { data, error } = await supabase!.from("vehicles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as Vehicle | null) ?? null;
  }
  return readDB().vehicles.find((v) => v.id === id) ?? null;
}

export async function saveVehicle(input: Partial<Vehicle> & { name: string }): Promise<Vehicle> {
  if (isRemoteEnabled()) {
    if (input.id) {
      const { id, created_at: _created, ...patch } = input;
      const { data, error } = await supabase!
        .from("vehicles")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Vehicle;
    }
    const { id: _ignored, created_at: _created2, ...payload } = input;
    const { data, error } = await supabase!.from("vehicles").insert(payload).select().single();
    if (error) throw error;
    return data as Vehicle;
  }

  const db = readDB();
  if (input.id) {
    const index = db.vehicles.findIndex((v) => v.id === input.id);
    const current = db.vehicles[index];
    if (index < 0 || !current) throw new Error("Veículo não encontrado");
    const updated: Vehicle = { ...current, ...input } as Vehicle;
    db.vehicles[index] = updated;
    writeDB(db);
    return updated;
  }
  const created: Vehicle = {
    id: uid("v"),
    name: input.name,
    category: input.category ?? "Econômico",
    transmission: input.transmission ?? "Manual",
    fuel: input.fuel ?? "Flex",
    passengers: input.passengers ?? 5,
    doors: input.doors ?? 4,
    luggage: input.luggage ?? 2,
    daily_rate: input.daily_rate ?? 0,
    status: input.status ?? "disponivel",
    images: input.images ?? [],
    features: input.features ?? [],
    description: input.description ?? "",
    plate: input.plate ?? null,
    year: input.year ?? null,
    active: input.active ?? true,
    created_at: new Date().toISOString(),
  };
  db.vehicles.unshift(created);
  writeDB(db);
  return created;
}

export async function deleteVehicle(id: string): Promise<void> {
  if (isRemoteEnabled()) {
    const { error } = await supabase!.from("vehicles").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readDB();
  db.vehicles = db.vehicles.filter((v) => v.id !== id);
  writeDB(db);
}

export async function setVehicleStatus(id: string, status: VehicleStatus): Promise<void> {
  if (isRemoteEnabled()) {
    const { error } = await supabase!.from("vehicles").update({ status }).eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readDB();
  db.vehicles = db.vehicles.map((v) => (v.id === id ? { ...v, status } : v));
  writeDB(db);
}

/* ----------------------------- RESERVAS ----------------------------- */

export async function listReservations(): Promise<Reservation[]> {
  if (isRemoteEnabled()) {
    const { data, error } = await supabase!
      .from("reservations")
      .select("*")
      .order("start_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Reservation[];
  }
  return [...readDB().reservations].sort((a, b) => a.start_date.localeCompare(b.start_date));
}

/** Reservas ativas que conflitam com o período informado. */
export async function conflictingReservations(
  vehicleId: string,
  start: string,
  end: string,
  ignoreId?: string,
): Promise<Reservation[]> {
  if (isRemoteEnabled()) {
    const { data, error } = await supabase!
      .from("reservations")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .in("status", ACTIVE_STATUSES)
      .lte("start_date", end)
      .gte("end_date", start);
    if (error) throw error;
    return ((data ?? []) as Reservation[]).filter((r) => r.id !== ignoreId);
  }
  return readDB().reservations.filter(
    (r) =>
      r.vehicle_id === vehicleId &&
      r.id !== ignoreId &&
      ACTIVE_STATUSES.includes(r.status) &&
      overlaps(r.start_date, r.end_date, start, end),
  );
}

export async function isVehicleAvailable(vehicleId: string, start: string, end: string) {
  const conflicts = await conflictingReservations(vehicleId, start, end);
  return conflicts.length === 0;
}

/** Veículos livres em um período (considera status e conflitos de datas). */
export async function availableVehicles(start: string, end: string): Promise<Vehicle[]> {
  const [vehicles, reservations] = await Promise.all([listVehicles(), listReservations()]);
  return vehicles.filter((vehicle) => {
    if (!vehicle.active) return false;
    if (vehicle.status === "manutencao") return false;
    const busy = reservations.some(
      (r) =>
        r.vehicle_id === vehicle.id &&
        ACTIVE_STATUSES.includes(r.status) &&
        overlaps(r.start_date, r.end_date, start, end),
    );
    return !busy;
  });
}

export async function createReservation(
  input: ReservationInput,
): Promise<{ reservation: Reservation; vehicle: Vehicle }> {
  const vehicle = await getVehicle(input.vehicle_id);
  if (!vehicle) throw new Error("Veículo não encontrado.");
  if (vehicle.status === "manutencao") throw new Error("Este veículo está em manutenção.");
  if (input.end_date < input.start_date) throw new Error("Período inválido.");

  const conflicts = await conflictingReservations(vehicle.id, input.start_date, input.end_date);
  if (conflicts.length > 0) {
    throw new Error("Este veículo já possui reserva neste período. Escolha outras datas.");
  }

  const days = daysBetween(input.start_date, input.end_date);
  const total = days * vehicle.daily_rate;

  if (isRemoteEnabled()) {
    const { data: customer, error: customerError } = await supabase!
      .from("customers")
      .insert({
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone,
        document: input.customer.document ?? null,
        city: input.customer.city ?? null,
        notes: input.customer.notes ?? null,
      })
      .select()
      .single();
    if (customerError) throw customerError;

    const { data, error } = await supabase!
      .from("reservations")
      .insert({
        vehicle_id: vehicle.id,
        customer_id: (customer as Customer).id,
        start_date: input.start_date,
        end_date: input.end_date,
        pickup_location: input.pickup_location ?? null,
        return_location: input.return_location ?? null,
        days,
        daily_rate: vehicle.daily_rate,
        total,
        status: "pendente",
      })
      .select()
      .single();
    if (error) {
      if (String(error.message).includes("reservations_no_overlap")) {
        throw new Error("Este veículo acabou de ser reservado neste período.");
      }
      throw error;
    }
    return { reservation: data as Reservation, vehicle };
  }

  const db = readDB();
  const customer: Customer = {
    id: uid("c"),
    name: input.customer.name,
    email: input.customer.email,
    phone: input.customer.phone,
    document: input.customer.document ?? null,
    city: input.customer.city ?? null,
    notes: input.customer.notes ?? null,
    created_at: new Date().toISOString(),
  };
  const reservation: Reservation = {
    id: uid("r"),
    code: genCode(),
    vehicle_id: vehicle.id,
    customer_id: customer.id,
    start_date: input.start_date,
    end_date: input.end_date,
    pickup_location: input.pickup_location ?? null,
    return_location: input.return_location ?? null,
    days,
    daily_rate: vehicle.daily_rate,
    total,
    status: "pendente",
    notes: null,
    created_at: new Date().toISOString(),
  };
  db.customers.unshift(customer);
  db.reservations.unshift(reservation);
  writeDB(db);
  return { reservation, vehicle };
}

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  if (isRemoteEnabled()) {
    const { error } = await supabase!.from("reservations").update({ status }).eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readDB();
  db.reservations = db.reservations.map((r) => (r.id === id ? { ...r, status } : r));
  writeDB(db);
}

export async function deleteReservation(id: string) {
  if (isRemoteEnabled()) {
    const { error } = await supabase!.from("reservations").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readDB();
  db.reservations = db.reservations.filter((r) => r.id !== id);
  writeDB(db);
}

/* ----------------------------- CLIENTES ----------------------------- */

export async function listCustomers(): Promise<Customer[]> {
  if (isRemoteEnabled()) {
    const { data, error } = await supabase!
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Customer[];
  }
  return readDB().customers;
}

export async function deleteCustomer(id: string) {
  if (isRemoteEnabled()) {
    const { error } = await supabase!.from("customers").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readDB();
  db.customers = db.customers.filter((c) => c.id !== id);
  writeDB(db);
}
