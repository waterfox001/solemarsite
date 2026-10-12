export const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export const shortDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

export const longDate = (iso: string) => {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const addDaysISO = (iso: string, days: number) => {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Diárias cobradas entre duas datas (mínimo de 1). */
export const daysBetween = (start: string, end: string) => {
  const a = new Date(`${start}T12:00:00`).getTime();
  const b = new Date(`${end}T12:00:00`).getTime();
  const diff = Math.round((b - a) / 86400000);
  return Math.max(1, diff);
};

export const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart <= bEnd && bStart <= aEnd;
