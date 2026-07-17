import cors from "cors";
import express from "express";
import { v4 as uuid } from "uuid";
import { pool } from "./db.js";
import { runMigrations } from "./migrate.js";
import { seedEmployees } from "../src/utils/seedData.js";

const app = express();
app.use(cors());
app.use(express.json());

const EMPLOYEE_FIELDS = [
  "nombre",
  "documento",
  "cargo",
  "departamento",
  "salarioBase",
  "factorHoraExtra",
  "telefono",
  "fechaIngreso",
  "estado",
];

function pickEmployeeFields(body) {
  const data = {};
  for (const field of EMPLOYEE_FIELDS) data[field] = body[field] ?? null;
  return data;
}

app.get("/api/employees", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM employees ORDER BY nombre");
  res.json(rows);
});

app.post("/api/employees", async (req, res) => {
  const employee = { id: uuid(), ...pickEmployeeFields(req.body) };
  await pool.execute(
    `INSERT INTO employees (id, nombre, documento, cargo, departamento, salarioBase, factorHoraExtra, telefono, fechaIngreso, estado)
     VALUES (:id, :nombre, :documento, :cargo, :departamento, :salarioBase, :factorHoraExtra, :telefono, :fechaIngreso, :estado)`,
    employee,
  );
  res.status(201).json(employee);
});

app.put("/api/employees/:id", async (req, res) => {
  const { id } = req.params;
  const [existingRows] = await pool.execute("SELECT * FROM employees WHERE id = :id", { id });
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: "Empleado no encontrado" });

  const employee = { id, ...pickEmployeeFields({ ...existing, ...req.body }) };
  await pool.execute(
    `UPDATE employees SET
       nombre=:nombre, documento=:documento, cargo=:cargo, departamento=:departamento,
       salarioBase=:salarioBase, factorHoraExtra=:factorHoraExtra, telefono=:telefono,
       fechaIngreso=:fechaIngreso, estado=:estado
     WHERE id=:id`,
    employee,
  );
  res.json(employee);
});

app.delete("/api/employees/:id", async (req, res) => {
  const [result] = await pool.execute("DELETE FROM employees WHERE id = :id", { id: req.params.id });
  if (result.affectedRows === 0) return res.status(404).json({ error: "Empleado no encontrado" });
  res.status(204).end();
});

app.get("/api/payroll-records", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM payroll_records");
  res.json(rows);
});

app.put("/api/payroll-records", async (req, res) => {
  const { employeeId, semana, horasExtra, descuentos, estado } = req.body;
  if (!employeeId || !semana) {
    return res.status(400).json({ error: "employeeId y semana son requeridos" });
  }

  const [existingRows] = await pool.execute(
    "SELECT * FROM payroll_records WHERE employeeId = :employeeId AND semana = :semana",
    { employeeId, semana },
  );
  const existing = existingRows[0];

  const record = {
    id: existing?.id ?? uuid(),
    employeeId,
    semana,
    horasExtra: horasExtra ?? existing?.horasExtra ?? 0,
    descuentos: descuentos ?? existing?.descuentos ?? 0,
    estado: estado ?? existing?.estado ?? "Pendiente",
  };

  await pool.execute(
    `INSERT INTO payroll_records (id, employeeId, semana, horasExtra, descuentos, estado)
     VALUES (:id, :employeeId, :semana, :horasExtra, :descuentos, :estado)
     ON DUPLICATE KEY UPDATE
       horasExtra = VALUES(horasExtra),
       descuentos = VALUES(descuentos),
       estado = VALUES(estado)`,
    record,
  );

  res.status(existing ? 200 : 201).json(record);
});

const TRANSACTION_FIELDS = ["tipo", "concepto", "categoria", "monto", "fecha", "metodoPago", "notas"];

function pickTransactionFields(body) {
  const data = {};
  for (const field of TRANSACTION_FIELDS) data[field] = body[field] ?? null;
  return data;
}

app.get("/api/transactions", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, tipo, concepto, categoria, monto, fecha, metodoPago, notas FROM transactions ORDER BY fecha DESC, seq DESC",
  );
  res.json(rows);
});

app.post("/api/transactions", async (req, res) => {
  const transaction = { id: uuid(), ...pickTransactionFields(req.body) };
  await pool.execute(
    `INSERT INTO transactions (id, tipo, concepto, categoria, monto, fecha, metodoPago, notas)
     VALUES (:id, :tipo, :concepto, :categoria, :monto, :fecha, :metodoPago, :notas)`,
    transaction,
  );
  res.status(201).json(transaction);
});

app.put("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const [existingRows] = await pool.execute("SELECT * FROM transactions WHERE id = :id", { id });
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: "Movimiento no encontrado" });

  const transaction = { id, ...pickTransactionFields({ ...existing, ...req.body }) };
  await pool.execute(
    `UPDATE transactions SET
       tipo=:tipo, concepto=:concepto, categoria=:categoria, monto=:monto,
       fecha=:fecha, metodoPago=:metodoPago, notas=:notas
     WHERE id=:id`,
    transaction,
  );
  res.json(transaction);
});

app.delete("/api/transactions/:id", async (req, res) => {
  const [result] = await pool.execute("DELETE FROM transactions WHERE id = :id", { id: req.params.id });
  if (result.affectedRows === 0) return res.status(404).json({ error: "Movimiento no encontrado" });
  res.status(204).end();
});

async function seedIfEmpty() {
  const [[{ count }]] = await pool.query("SELECT COUNT(*) AS count FROM employees");
  if (count > 0) return;

  for (const emp of seedEmployees) {
    await pool.execute(
      `INSERT INTO employees (id, nombre, documento, cargo, departamento, salarioBase, factorHoraExtra, telefono, fechaIngreso, estado)
       VALUES (:id, :nombre, :documento, :cargo, :departamento, :salarioBase, :factorHoraExtra, :telefono, :fechaIngreso, :estado)`,
      emp,
    );
  }
}

const PORT = process.env.API_PORT || 4000;

await runMigrations();
await seedIfEmpty();

app.listen(PORT, () => {
  console.log(`API de Pago Planilla escuchando en http://localhost:${PORT}`);
});
