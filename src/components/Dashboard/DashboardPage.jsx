import { useMemo } from "react";
import { subMonths, subWeeks, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FiUsers,
  FiDollarSign,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";
import StatCard from "../common/StatCard";
import Badge from "../common/Badge";
import {
  currentWeekValue,
  formatWeekLabel,
  weekValueToRange,
  money,
  overtimePay,
  totalPay,
} from "../../utils/payrollCalc";
import {
  currentMonthValue,
  formatMonthLabel,
  isInMonth,
  isInWeek,
  summarizeTransactions,
} from "../../utils/financeCalc";

function TrendBars({ data, max }) {
  return (
    <div className="trend-list">
      {data.map((row) => (
        <div className="trend-row" key={row.key}>
          <div className="trend-row-head">
            <span className="trend-row-label">{row.label}</span>
            <span className={`trend-row-balance ${row.balance >= 0 ? "positive" : "negative"}`}>
              {row.balance >= 0 ? "+ " : "− "}
              {money(Math.abs(row.balance))}
            </span>
          </div>
          <div className="trend-bar">
            <div className="trend-bar-track">
              <div
                className="trend-bar-fill ingreso"
                style={{ width: `${max ? (row.ingresos / max) * 100 : 0}%` }}
              />
            </div>
            <span className="trend-bar-value">{money(row.ingresos)}</span>
          </div>
          <div className="trend-bar">
            <div className="trend-bar-track">
              <div
                className="trend-bar-fill gasto"
                style={{ width: `${max ? (row.gastos / max) * 100 : 0}%` }}
              />
            </div>
            <span className="trend-bar-value">{money(row.gastos)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendLegend() {
  return (
    <div className="trend-legend">
      <span className="trend-legend-item">
        <i className="trend-dot ingreso" /> Ingresos
      </span>
      <span className="trend-legend-item">
        <i className="trend-dot gasto" /> Gastos
      </span>
    </div>
  );
}

export default function DashboardPage({ employees, payrollRecords, transactions }) {
  const week = currentWeekValue();
  const month = currentMonthValue();

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

  const weekFinance = useMemo(
    () => summarizeTransactions(transactions.filter((t) => isInWeek(t.fecha, week))),
    [transactions, week],
  );

  const monthFinance = useMemo(
    () => summarizeTransactions(transactions.filter((t) => isInMonth(t.fecha, month))),
    [transactions, month],
  );

  const weeklyTrend = useMemo(() => {
    const weeks = Array.from({ length: 6 }, (_, i) => currentWeekValue(subWeeks(new Date(), 5 - i)));
    return weeks.map((w) => {
      const range = weekValueToRange(w);
      const summary = summarizeTransactions(transactions.filter((t) => isInWeek(t.fecha, w)));
      return {
        key: w,
        label: `${format(range.start, "dd MMM", { locale: es })} – ${format(range.end, "dd MMM", { locale: es })}`,
        ...summary,
      };
    });
  }, [transactions]);

  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => currentMonthValue(subMonths(new Date(), 5 - i)));
    return months.map((m) => {
      const label = formatMonthLabel(m);
      const summary = summarizeTransactions(transactions.filter((t) => isInMonth(t.fecha, m)));
      return { key: m, label: label.charAt(0).toUpperCase() + label.slice(1), ...summary };
    });
  }, [transactions]);

  const weeklyMax = Math.max(1, ...weeklyTrend.flatMap((w) => [w.ingresos, w.gastos]));
  const monthlyMax = Math.max(1, ...monthlyTrend.flatMap((m) => [m.ingresos, m.gastos]));

  return (
    <div>
      <div className="card" style={{ marginBottom: 22 }}>
        <div className="card-header">
          <div>
            <h2>Planilla</h2>
            <p>{formatWeekLabel(week)}</p>
          </div>
        </div>
        <div className="card-body">
          <div className="stat-grid" style={{ marginBottom: 0 }}>
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
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
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

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="card-header">
          <div>
            <h2>Gastos e ingresos</h2>
            <p>Resumen del mes y de la semana actual</p>
          </div>
        </div>
        <div className="card-body">
          <div className="stat-grid" style={{ marginBottom: 18 }}>
            <StatCard
              icon={FiTrendingUp}
              label="Ingresos del mes"
              value={money(monthFinance.ingresos)}
              sub={formatMonthLabel(month)}
            />
            <StatCard
              icon={FiTrendingDown}
              label="Gastos del mes"
              value={money(monthFinance.gastos)}
              sub={formatMonthLabel(month)}
            />
            <StatCard
              icon={FiDollarSign}
              label="Balance del mes"
              value={money(monthFinance.balance)}
              sub={monthFinance.balance >= 0 ? "Superávit del periodo" : "Déficit del periodo"}
            />
          </div>
          <div className="stat-grid" style={{ marginBottom: 0 }}>
            <StatCard
              icon={FiTrendingUp}
              label="Ingresos semana actual"
              value={money(weekFinance.ingresos)}
              sub={formatWeekLabel(week)}
            />
            <StatCard
              icon={FiTrendingDown}
              label="Gastos semana actual"
              value={money(weekFinance.gastos)}
              sub={formatWeekLabel(week)}
            />
            <StatCard
              icon={FiDollarSign}
              label="Balance semana actual"
              value={money(weekFinance.balance)}
              sub={weekFinance.balance >= 0 ? "Superávit del periodo" : "Déficit del periodo"}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Ingresos y gastos por semana</h2>
              <p>Últimas 6 semanas</p>
            </div>
            <TrendLegend />
          </div>
          <div className="card-body">
            <TrendBars data={weeklyTrend} max={weeklyMax} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2>Ingresos y gastos por mes</h2>
              <p>Últimos 6 meses</p>
            </div>
            <TrendLegend />
          </div>
          <div className="card-body">
            <TrendBars data={monthlyTrend} max={monthlyMax} />
          </div>
        </div>
      </div>
    </div>
  );
}
