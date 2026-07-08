import { v4 as uuid } from "uuid";

export const DEPARTAMENTOS = [
  "Producción",
  "Almacén",
  "Administración",
  "Gerencia",
  "Ventas",
  "Mantenimiento",
];

export const seedEmployees = [
    {
    id: uuid(),
    nombre: "JULIO ENRIQUE PINEDA",
    documento: "04142747-3",
    cargo: "Operario",
    departamento: "GERENCIA",
    salarioBase: 500,
    factorHoraExtra: 1.5,
    telefono: "503 6061-4871",
    fechaIngreso: "2026-06-08",
    estado: "Activo",
  },
];
