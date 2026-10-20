import { isSupabaseConfigured } from "./env";
import { daysBetween, uid as makeId, readDB, writeDB } from "./local-store";
import { supabase } from "./supabase";
import type {
  CatalogAdditional,
  Customer,
  Reservation,
  ReservationInput,
  ReservationStatus,
  SelectedAdditional,
  Vehicle,
  VehicleStatus,
} from "./types";

const isRemoteEnabled = () => isSupabaseConfigured && Boolean(supabase);

const ACTIVE_STATUSES: ReservationStatus[] = ["pendente", "confirmada", "em_andamento"];

export const uid = makeId;

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && aEnd >= bStart;
}

function genCode() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SM${rand}`;
}

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
    return (data as Vehicle) ?? null;
  }
  return readDB().vehicles.find((v) => v.id === id) ?? null;
}

export async function saveVehicle(input: Partial<Vehicle> & { name: string }): Promise<Vehicle> {
  if (isRemoteEnabled()) {
    if (input.id) {
      const { id, created_at: _created, ...payload } = input;
      const { data, error } = await supabase!
        .from("vehicles")
        .update(payload)
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
    const updated: Vehicle = {
      ...current,
      ...input,
      fleet_quantity:
        input.fleet_quantity !== undefined
          ? Number(input.fleet_quantity)
          : (current.fleet_quantity ?? 1),
      deposit_amount:
        input.deposit_amount !== undefined ? Number(input.deposit_amount) : current.deposit_amount,
    } as Vehicle;
    db.vehicles[index] = updated;
    writeDB(db);
    return updated;
  }

  const created: Vehicle = {
    id: uid("v"),
    name: input.name,
    brand: input.brand,
    model: input.model,
    category: input.category,
    transmission: input.transmission,
    fuel: input.fuel,
    passengers: input.passengers ?? null,
    doors: input.doors ?? null,
    luggage: input.luggage ?? null,
    daily_rate: input.daily_rate ?? 0,
    deposit_amount: input.deposit_amount !== undefined ? Number(input.deposit_amount) : undefined,
    fleet_quantity:
      input.fleet_quantity !== undefined ? Math.max(1, Number(input.fleet_quantity)) : 1,
    color: input.color,
    color_hex: input.color_hex,
    available_additionals: input.available_additionals ?? [],
    status: input.status ?? "disponivel",
    images: input.images ?? [],
    cover_image: input.cover_image,
    is_illustrative_image: input.is_illustrative_image ?? false,
    features: input.features ?? [],
    description: input.description ?? "",
    plate: input.plate ?? null,
    year: input.year ?? null,
    engine: input.engine,
    active: input.active !== undefined ? input.active : true,
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

export async function setVehicleActive(id: string, active: boolean): Promise<void> {
  if (isRemoteEnabled()) {
    const { error } = await supabase!.from("vehicles").update({ active }).eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readDB();
  db.vehicles = db.vehicles.map((v) => (v.id === id ? { ...v, active } : v));
  writeDB(db);
}

export async function setVehicleDailyRate(id: string, daily_rate: number): Promise<void> {
  if (isRemoteEnabled()) {
    const { error } = await supabase!.from("vehicles").update({ daily_rate }).eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readDB();
  db.vehicles = db.vehicles.map((v) => (v.id === id ? { ...v, daily_rate } : v));
  writeDB(db);
}

export async function setVehicleDeposit(id: string, deposit_amount: number): Promise<void> {
  if (isRemoteEnabled()) {
    const { error } = await supabase!.from("vehicles").update({ deposit_amount }).eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readDB();
  db.vehicles = db.vehicles.map((v) => (v.id === id ? { ...v, deposit_amount } : v));
  writeDB(db);
}

export async function setVehicleFleetQuantity(id: string, fleet_quantity: number): Promise<void> {
  const qty = Math.max(1, Number(fleet_quantity));
  if (isRemoteEnabled()) {
    const { error } = await supabase!.from("vehicles").update({ fleet_quantity: qty }).eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readDB();
  db.vehicles = db.vehicles.map((v) => (v.id === id ? { ...v, fleet_quantity: qty } : v));
  writeDB(db);
}

export async function setVehicleColor(
  id: string,
  color: string,
  color_hex?: string,
): Promise<void> {
  if (isRemoteEnabled()) {
    const { error } = await supabase!.from("vehicles").update({ color, color_hex }).eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readDB();
  db.vehicles = db.vehicles.map((v) => (v.id === id ? { ...v, color, color_hex } : v));
  writeDB(db);
}

export async function setVehicleCoverImage(id: string, cover_image: string): Promise<void> {
  if (isRemoteEnabled()) {
    const { error } = await supabase!.from("vehicles").update({ cover_image }).eq("id", id);
    if (error) throw error;
    return;
  }
  const db = readDB();
  db.vehicles = db.vehicles.map((v) => (v.id === id ? { ...v, cover_image } : v));
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
    let query = supabase!
      .from("reservations")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .in("status", ACTIVE_STATUSES)
      .lte("start_date", end)
      .gte("end_date", start);
    if (ignoreId) {
      query = query.neq("id", ignoreId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Reservation[];
  }
  const db = readDB();
  return db.reservations.filter((r) => {
    if (r.id === ignoreId) return false;
    if (r.vehicle_id !== vehicleId) return false;
    if (!ACTIVE_STATUSES.includes(r.status)) return false;
    return overlaps(r.start_date, r.end_date, start, end);
  });
}

/**
 * Controle de Disponibilidade e Estoque da Frota:
 * Verifica quantas unidades existem na frota para o veículo e quantas já estão reservadas
 * no período solicitado, garantindo que se houver 2 unidades e 1 reservada, a outra continua disponível.
 */
export async function getVehicleAvailability(
  vehicleId: string,
  start?: string,
  end?: string,
  ignoreReservationId?: string,
): Promise<{
  isAvailable: boolean;
  availableUnits: number;
  totalUnits: number;
  reservedUnits: number;
}> {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) {
    return { isAvailable: false, availableUnits: 0, totalUnits: 0, reservedUnits: 0 };
  }
  const totalUnits = Math.max(1, vehicle.fleet_quantity ?? 1);

  if (!vehicle.active || vehicle.status === "manutencao") {
    return { isAvailable: false, availableUnits: 0, totalUnits, reservedUnits: 0 };
  }

  if (!start || !end) {
    const isAvail = vehicle.status === "disponivel";
    return {
      isAvailable: isAvail,
      availableUnits: isAvail ? totalUnits : 0,
      totalUnits,
      reservedUnits: isAvail ? 0 : totalUnits,
    };
  }

  const conflicts = await conflictingReservations(vehicleId, start, end, ignoreReservationId);
  const reservedUnits = conflicts.length;
  const availableUnits = Math.max(0, totalUnits - reservedUnits);
  const isAvailable = availableUnits > 0 && vehicle.status !== "manutencao";

  return {
    isAvailable,
    availableUnits,
    totalUnits,
    reservedUnits,
  };
}

export async function isVehicleAvailable(vehicleId: string, start: string, end: string) {
  const check = await getVehicleAvailability(vehicleId, start, end);
  return check.isAvailable;
}

/** Veículos livres em um período (considera status, estoque e conflitos de datas). */
export async function availableVehicles(start: string, end: string): Promise<Vehicle[]> {
  const vehicles = await listVehicles();
  const checks = await Promise.all(
    vehicles.map(async (v) => {
      const avail = await getVehicleAvailability(v.id, start, end);
      return { vehicle: v, isAvailable: avail.isAvailable };
    }),
  );
  return checks.filter((c) => c.isAvailable).map((c) => c.vehicle);
}

export async function createReservation(
  input: ReservationInput,
): Promise<{ reservation: Reservation; vehicle: Vehicle }> {
  const vehicle = await getVehicle(input.vehicle_id);
  if (!vehicle) throw new Error("Veículo não encontrado.");
  if (vehicle.status === "manutencao") throw new Error("Este veículo está em manutenção.");
  if (input.end_date < input.start_date) throw new Error("Período de locação inválido.");

  // Validação real de unidades disponíveis no estoque da frota para as datas
  const availability = await getVehicleAvailability(vehicle.id, input.start_date, input.end_date);
  if (!availability.isAvailable) {
    throw new Error(
      `Todas as unidades deste veículo (${availability.totalUnits}) já estão reservadas para o período solicitado. Por favor, escolha outro modelo ou ajuste as datas.`,
    );
  }

  const days = daysBetween(input.start_date, input.end_date);
  const dailyTotal = days * (vehicle.daily_rate || 0);

  // Cálculo discriminado de adicionais
  let additionalsTotal = 0;
  const processedAdditionals: SelectedAdditional[] = (input.additionals || []).map((add) => {
    const cost = add.type === "per_day" ? add.price * days : add.price;
    additionalsTotal += cost;
    return {
      id: add.id,
      name: add.name,
      price: add.price,
      type: add.type,
      total: cost,
    };
  });

  // O total da locação (diárias + opcionais) é o custo efetivo dos serviços
  const rentalTotal = dailyTotal + additionalsTotal;
  // A caução é garantia de segurança (bloqueio temporário no cartão, liberada na devolução)
  const depositAmount = vehicle.deposit_amount || 0;
  // Regra comercial: valor antecipado exigido para confirmar reserva (0 por padrão até configuração)
  const advancePaymentAmount = input.advance_payment_amount ?? 0;
  // Saldo restante da locação a ser pago na retirada do veículo
  const balanceOnPickup = Math.max(0, rentalTotal - advancePaymentAmount);
  const grandTotal = rentalTotal + depositAmount;

  if (isRemoteEnabled()) {
    const { data: customer, error: customerError } = await supabase!
      .from("customers")
      .insert({
        name: input.customer.name,
        email: input.customer.email ? input.customer.email.trim() : null,
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
        start_time: input.start_time ?? "09:00",
        end_time: input.end_time ?? "09:00",
        pickup_location: input.pickup_location ?? null,
        return_location: input.return_location ?? null,
        days,
        daily_rate: vehicle.daily_rate,
        daily_subtotal: dailyTotal,
        additionals_subtotal: additionalsTotal,
        rental_total: rentalTotal,
        deposit_amount: depositAmount,
        advance_payment_amount: advancePaymentAmount,
        balance_on_pickup: balanceOnPickup,
        total: grandTotal,
        status: "pendente",
        additionals: processedAdditionals,
        payment_status: "pendente_checkout",
        payment_provider: null,
        payment_gateway_note:
          "Ponto de checkout preparado. Reserva aguardando definição do provedor de pagamento da locadora.",
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
    email: input.customer.email ? input.customer.email.trim() : null,
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
    start_time: input.start_time ?? "09:00",
    end_time: input.end_time ?? "09:00",
    pickup_location: input.pickup_location ?? null,
    return_location: input.return_location ?? null,
    days,
    daily_rate: vehicle.daily_rate,
    daily_subtotal: dailyTotal,
    additionals_subtotal: additionalsTotal,
    rental_total: rentalTotal,
    deposit_amount: depositAmount,
    advance_payment_amount: advancePaymentAmount,
    balance_on_pickup: balanceOnPickup,
    total: grandTotal,
    status: "pendente",
    additionals: processedAdditionals,
    payment_status: "pendente_checkout",
    payment_provider: null,
    payment_gateway_note:
      "Ponto de checkout preparado. Aguardando ativação oficial do gateway do proprietário.",
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

/* ----------------------------- OPCIONAIS & ACESSÓRIOS ----------------------------- */

export async function listAdditionals(onlyActive = false): Promise<CatalogAdditional[]> {
  if (isRemoteEnabled()) {
    try {
      let query = supabase!.from("additionals").select("*").order("created_at", { ascending: true });
      if (onlyActive) {
        query = query.eq("active", true);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) return data as CatalogAdditional[];
    } catch {
      // fallback para local db
    }
  }
  const db = readDB();
  const list = db.additionals ?? [];
  return onlyActive ? list.filter((a) => a.active) : list;
}

export async function getAdditional(id: string): Promise<CatalogAdditional | null> {
  const list = await listAdditionals(false);
  return list.find((a) => a.id === id) ?? null;
}

export async function saveAdditional(
  input: Partial<CatalogAdditional> & { name: string; price: number },
): Promise<CatalogAdditional> {
  const db = readDB();
  db.additionals = db.additionals ?? [];

  if (input.id) {
    const index = db.additionals.findIndex((a) => a.id === input.id);
    if (index >= 0) {
      const updated: CatalogAdditional = {
        ...db.additionals[index],
        ...input,
        price: Number(input.price) || 0,
        stock_quantity:
          input.stock_quantity !== undefined
            ? Number(input.stock_quantity)
            : (db.additionals[index].stock_quantity ?? 1),
      };
      db.additionals[index] = updated;
      writeDB(db);
      return updated;
    }
  }

  const created: CatalogAdditional = {
    id: input.id || uid("opt"),
    name: input.name,
    description: input.description ?? "",
    price: Number(input.price) || 0,
    type: input.type ?? "per_day",
    stock_quantity: input.stock_quantity !== undefined ? Number(input.stock_quantity) : 1,
    active: input.active !== undefined ? input.active : true,
    created_at: new Date().toISOString(),
  };

  db.additionals.push(created);
  writeDB(db);
  return created;
}

export async function deleteAdditional(id: string): Promise<void> {
  const db = readDB();
  db.additionals = (db.additionals ?? []).filter((a) => a.id !== id);
  writeDB(db);
}

export async function setAdditionalActive(id: string, active: boolean): Promise<void> {
  const db = readDB();
  db.additionals = (db.additionals ?? []).map((a) => (a.id === id ? { ...a, active } : a));
  writeDB(db);
}

