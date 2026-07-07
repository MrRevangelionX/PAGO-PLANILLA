import { useMemo } from "react";
import { FiUsers, FiDollarSign, FiClock, FiAlertCircle } from "react-icons/fi";
import StatCard from "../common/StatCard";
import Badge from "../common/Badge";
import {
  currentWeekValue,
  formatWeekLabel,
  money,
  overtimePay,
  totalPay,
} from "../../utils/payrollCalc";

export default function DashboardPage({ employees, payrollRecords }) {
  const week = currentWeekValue();

  const activeEmployees = employees.filter((e) => e.estado === "Activo");

  const weekData = useMemo(() => {
    return activeEmployees.map((emp) => {
      const record =
        payrollRecords.find((r) => r.employeeId === emp.id && r.semana === week) || {
          horasExtra: 0,
          descuentos: 0,
          estado: "Pendiente",
        };
      return { emp, record, total: totalPay(emp, record) };
    });
  }, [activeEmployees, payrollRecords, week]);

  const totalPlanilla = weekData.reduce((sum, r) => sum + r.total, 0);
  const totalHorasExtra = weekData.reduce(
    (sum, r) => sum + (Number(r.record.horasExtra) || 0),
    0,
  );
  const pendientes = weekData.filter((r) => r.record.estado === "Pendiente").length;

  const topOvertime = [...weekData]
    .sort((a, b) => (b.record.horasExtra || 0) - (a.record.horasExtra || 0))
    .filter((r) => r.record.horasExtra > 0)
    .slice(0, 5);

  return (
    <div>
      <div className="stat-grid">
        <StatCard
          icon={FiUsers}
          label="Empleados activos"
          value={activeEmployees.length}
          sub={`${employees.length} registrados en total`}
        />
        <StatCard
          icon={FiDollarSign}
          label="Planilla semana actual"
          value={money(totalPlanilla)}
          sub={formatWeekLabel(week)}
        />
        <StatCard
          icon={FiClock}
          label="Horas extra (semana)"
          value={totalHorasExtra}
          sub="Acumulado de todos los empleados activos"
        />
        <StatCard
          icon={FiAlertCircle}
          label="Pagos pendientes"
          value={pendientes}
          sub="Por confirmar esta semana"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Mayor cantidad de horas extra</h2>
            <p>{formatWeekLabel(week)}</p>
          </div>
        </div>
        <div className="card-body">
          {topOvertime.length === 0 ? (
            <div className="empty-state">
              <p>Aún no se registran horas extra para la semana actual.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topOvertime.map(({ emp, record, total }) => (
                <div
                  key={emp.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 9,
                    background: "var(--surface-alt)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="name-cell-text">
                    <strong>{emp.nombre}</strong>
                    <span>{emp.cargo} · {emp.departamento}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span className="cell-muted">
                      {record.horasExtra} h extra · {money(overtimePay(emp, record.horasExtra))}
                    </span>
                    <span className="cell-strong">{money(total)}</span>
                    <Badge tone={record.estado === "Pagado" ? "success" : "warning"}>
                      {record.estado}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
