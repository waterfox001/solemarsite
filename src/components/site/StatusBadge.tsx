import { cn } from "@/lib/utils";
import {
  RESERVATION_STATUS_LABEL,
  VEHICLE_STATUS_LABEL,
  type ReservationStatus,
  type VehicleStatus,
} from "@/lib/types";

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-semibold tracking-wide uppercase";

const vehicleTone: Record<VehicleStatus, string> = {
  disponivel: "border-success/40 bg-success/10 text-success",
  reservado: "border-primary/40 bg-primary/10 text-primary",
  em_locacao: "border-accent/40 bg-accent/10 text-accent",
  manutencao: "border-destructive/40 bg-destructive/10 text-destructive",
};

const reservationTone: Record<ReservationStatus, string> = {
  pendente: "border-warning/40 bg-warning/10 text-warning",
  confirmada: "border-success/40 bg-success/10 text-success",
  em_andamento: "border-accent/40 bg-accent/10 text-accent",
  concluida: "border-border bg-surface-2 text-muted-foreground",
  cancelada: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function VehicleStatusBadge({
  status,
  className,
}: {
  status: VehicleStatus;
  className?: string;
}) {
  return (
    <span className={cn(base, vehicleTone[status], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {VEHICLE_STATUS_LABEL[status]}
    </span>
  );
}

export function ReservationStatusBadge({
  status,
  className,
}: {
  status: ReservationStatus;
  className?: string;
}) {
  return (
    <span className={cn(base, reservationTone[status], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {RESERVATION_STATUS_LABEL[status]}
    </span>
  );
}
