import {
  endOfISOWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  startOfISOWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export const HORAS_SEMANALES = 44;

export function currentWeekValue(date = new Date()) {
  const week = getISOWeek(date);
  const year = getISOWeekYear(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function weekValueToRange(weekValue) {
  if (!weekValue) return null;
  const [yearStr, weekStr] = weekValue.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);
  const anchor = setISOWeek(new Date(year, 0, 4), week);
  return {
    start: startOfISOWeek(anchor),
    end: endOfISOWeek(anchor),
  };
}

export function formatWeekLabel(weekValue) {
  const range = weekValueToRange(weekValue);
  if (!range) return "";
  const week = weekValue.split("-W")[1];
  return `${format(range.start, "dd MMM", { locale: es })} – ${format(
    range.end,
    "dd MMM yyyy",
    { locale: es },
  )} · Semana ${week}`;
}

export function hourlyRate(employee) {
  return employee.salarioBase / HORAS_SEMANALES;
}

export function overtimePay(employee, horasExtra) {
  const rate = hourlyRate(employee) * (employee.factorHoraExtra || 1.5);
  return rate * (Number(horasExtra) || 0);
}

export function totalPay(employee, record) {
  const extra = overtimePay(employee, record?.horasExtra || 0);
  const descuentos = Number(record?.descuentos) || 0;
  return employee.salarioBase + extra - descuentos;
}

export function money(value) {
  return `USD ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
