import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { seedEmployees } from "../src/utils/seedData.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "pago-planilla.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    documento TEXT NOT NULL,
    cargo TEXT NOT NULL,
    departamento TEXT NOT NULL,
    salarioBase REAL NOT NULL,
    factorHoraExtra REAL NOT NULL,
    telefono TEXT,
    fechaIngreso TEXT,
    estado TEXT NOT NULL DEFAULT 'Activo'
  );

  CREATE TABLE IF NOT EXISTS payroll_records (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    semana TEXT NOT NULL,
    horasExtra REAL NOT NULL DEFAULT 0,
    descuentos REAL NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    UNIQUE(employeeId, semana)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Gasto')),
    concepto TEXT NOT NULL,
    categoria TEXT NOT NULL,
    monto REAL NOT NULL,
    fecha TEXT NOT NULL,
    metodoPago TEXT NOT NULL DEFAULT 'Efectivo',
    notas TEXT
  );
`);

const { count } = db.prepare("SELECT COUNT(*) AS count FROM employees").get();

if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO employees
      (id, nombre, documento, cargo, departamento, salarioBase, factorHoraExtra, telefono, fechaIngreso, estado)
    VALUES
      (@id, @nombre, @documento, @cargo, @departamento, @salarioBase, @factorHoraExtra, @telefono, @fechaIngreso, @estado)
  `);
  const insertSeed = db.transaction((employees) => {
    for (const emp of employees) insert.run(emp);
  });
  insertSeed(seedEmployees);
}
