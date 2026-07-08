import cors from "cors";
import express from "express";
import { v4 as uuid } from "uuid";
import { db } from "./db.js";

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

app.get("/api/employees", (req, res) => {
  res.json(db.prepare("SELECT * FROM employees ORDER BY nombre").all());
});

app.post("/api/employees", (req, res) => {
  const employee = { id: uuid(), ...pickEmployeeFields(req.body) };
  db.prepare(
    `INSERT INTO employees (id, nombre, documento, cargo, departamento, salarioBase, factorHoraExtra, telefono, fechaIngreso, estado)
     VALUES (@id, @nombre, @documento, @cargo, @departamento, @salarioBase, @factorHoraExtra, @telefono, @fechaIngreso, @estado)`,
  ).run(employee);
  res.status(201).json(employee);
});

app.put("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const existing = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Empleado no encontrado" });

  const employee = { id, ...pickEmployeeFields({ ...existing, ...req.body }) };
  db.prepare(
    `UPDATE employees SET
       nombre=@nombre, documento=@documento, cargo=@cargo, departamento=@departamento,
       salarioBase=@salarioBase, factorHoraExtra=@factorHoraExtra, telefono=@telefono,
       fechaIngreso=@fechaIngreso, estado=@estado
     WHERE id=@id`,
  ).run(employee);
  res.json(employee);
});

app.delete("/api/employees/:id", (req, res) => {
  const result = db.prepare("DELETE FROM employees WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Empleado no encontrado" });
  res.status(204).end();
});

app.get("/api/payroll-records", (req, res) => {
  res.json(db.prepare("SELECT * FROM payroll_records").all());
});

app.put("/api/payroll-records", (req, res) => {
  const { employeeId, semana, horasExtra, descuentos, estado } = req.body;
  if (!employeeId || !semana) {
    return res.status(400).json({ error: "employeeId y semana son requeridos" });
  }

  const existing = db
    .prepare("SELECT * FROM payroll_records WHERE employeeId = ? AND semana = ?")
    .get(employeeId, semana);

  const record = {
    id: existing?.id ?? uuid(),
    employeeId,
    semana,
    horasExtra: horasExtra ?? existing?.horasExtra ?? 0,
    descuentos: descuentos ?? existing?.descuentos ?? 0,
    estado: estado ?? existing?.estado ?? "Pendiente",
  };

  db.prepare(
    `INSERT INTO payroll_records (id, employeeId, semana, horasExtra, descuentos, estado)
     VALUES (@id, @employeeId, @semana, @horasExtra, @descuentos, @estado)
     ON CONFLICT(employeeId, semana) DO UPDATE SET
       horasExtra=excluded.horasExtra,
       descuentos=excluded.descuentos,
       estado=excluded.estado`,
  ).run(record);

  res.status(existing ? 200 : 201).json(record);
});

const TRANSACTION_FIELDS = ["tipo", "concepto", "categoria", "monto", "fecha", "metodoPago", "notas"];

function pickTransactionFields(body) {
  const data = {};
  for (const field of TRANSACTION_FIELDS) data[field] = body[field] ?? null;
  return data;
}

app.get("/api/transactions", (req, res) => {
  res.json(db.prepare("SELECT * FROM transactions ORDER BY fecha DESC, rowid DESC").all());
});

app.post("/api/transactions", (req, res) => {
  const transaction = { id: uuid(), ...pickTransactionFields(req.body) };
  db.prepare(
    `INSERT INTO transactions (id, tipo, concepto, categoria, monto, fecha, metodoPago, notas)
     VALUES (@id, @tipo, @concepto, @categoria, @monto, @fecha, @metodoPago, @notas)`,
  ).run(transaction);
  res.status(201).json(transaction);
});

app.put("/api/transactions/:id", (req, res) => {
  const { id } = req.params;
  const existing = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Movimiento no encontrado" });

  const transaction = { id, ...pickTransactionFields({ ...existing, ...req.body }) };
  db.prepare(
    `UPDATE transactions SET
       tipo=@tipo, concepto=@concepto, categoria=@categoria, monto=@monto,
       fecha=@fecha, metodoPago=@metodoPago, notas=@notas
     WHERE id=@id`,
  ).run(transaction);
  res.json(transaction);
});

app.delete("/api/transactions/:id", (req, res) => {
  const result = db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Movimiento no encontrado" });
  res.status(204).end();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API de Pago Planilla escuchando en http://localhost:${PORT}`);
});
