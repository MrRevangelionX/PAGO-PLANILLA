import { endOfMonth, format, getISOWeek, getISOWeekYear, parse, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

export const CATEGORIAS_GASTO = [
  "Suministros",
  "Servicios",
  "Transporte",
  "Alimentación",
  "Mantenimiento",
  "Otros",
];

export const CATEGORIAS_INGRESO = ["Ventas", "Servicios prestados", "Reembolsos", "Otros"];

export const METODOS_PAGO = ["Efectivo", "Transferencia", "Tarjeta"];

export function categoriasPorTipo(tipo) {
  return tipo === "Ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;
}

export function currentMonthValue(date = new Date()) {
  return format(date, "yyyy-MM");
}

export function monthValueToRange(monthValue) {
  if (!monthValue) return null;
  const anchor = parse(monthValue, "yyyy-MM", new Date());
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
}

export function formatMonthLabel(monthValue) {
  const range = monthValueToRange(monthValue);
  if (!range) return "";
  return format(range.start, "MMMM yyyy", { locale: es });
}

export function isInMonth(fecha, monthValue) {
  if (!monthValue) return true;
  return typeof fecha === "string" && fecha.startsWith(monthValue);
}

export function isInWeek(fecha, weekValue) {
  if (!weekValue || typeof fecha !== "string") return true;
  const date = new Date(`${fecha}T00:00:00`);
  const week = `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, "0")}`;
  return week === weekValue;
}

export function summarizeTransactions(rows) {
  const ingresos = rows
    .filter((t) => t.tipo === "Ingreso")
    .reduce((sum, t) => sum + Number(t.monto), 0);
  const gastos = rows
    .filter((t) => t.tipo === "Gasto")
    .reduce((sum, t) => sum + Number(t.monto), 0);
  return { ingresos, gastos, balance: ingresos - gastos, total: rows.length };
}
