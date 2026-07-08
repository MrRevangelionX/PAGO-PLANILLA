import { useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import {
  FiDownload,
  FiFileText,
  FiX,
  FiCheckCircle,
  FiClock,
  FiInbox,
} from "react-icons/fi";
import Badge from "../common/Badge";
import { DEPARTAMENTOS } from "../../utils/seedData";
import {
  currentWeekValue,
  formatWeekLabel,
  hourlyRate,
  money,
  overtimePay,
  totalPay,
} from "../../utils/payrollCalc";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils";
import { tableCustomStyles } from "../../utils/dataTableStyles";

function findRecord(records, employeeId, semana) {
  return records.find((r) => r.employeeId === employeeId && r.semana === semana);
}

export default function PayrollPage({ employees, payrollRecords, onUpsertRecord }) {
  const [week, setWeek] = useState(currentWeekValue());
  const [search, setSearch] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [estadoPago, setEstadoPago] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);

  async function upsertRecord(employeeId, patch) {
    try {
      await onUpsertRecord(employeeId, week, patch);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "No se pudo guardar el registro",
        text: error.message,
      });
    }
  }

  const weekRows = useMemo(() => {
    return employees
      .filter((emp) => !soloActivos || emp.estado === "Activo")
      .map((emp) => {
        const record = findRecord(payrollRecords, emp.id, week) || {
          horasExtra: 0,
          descuentos: 0,
          estado: "Pendiente",
        };
        return {
          id: emp.id,
          employee: emp,
          record,
          total: totalPay(emp, record),
          extraPay: overtimePay(emp, record.horasExtra),
        };
      });
  }, [employees, payrollRecords, week, soloActivos]);

  const filteredRows = useMemo(() => {
    return weekRows.filter(({ employee, record }) => {
      const matchesSearch =
        !search || employee.nombre.toLowerCase().includes(search.toLowerCase());
      const matchesDepto = !departamento || employee.departamento === departamento;
      const matchesEstado = !estadoPago || record.estado === estadoPago;
      return matchesSearch && matchesDepto && matchesEstado;
    });
  }, [weekRows, search, departamento, estadoPago]);

  const summary = useMemo(() => {
    const totalPlanilla = filteredRows.reduce((sum, r) => sum + r.total, 0);
    const totalHorasExtra = filteredRows.reduce(
      (sum, r) => sum + (Number(r.record.horasExtra) || 0),
      0,
    );
    const pendientes = filteredRows.filter((r) => r.record.estado === "Pendiente").length;
    return { totalPlanilla, totalHorasExtra, pendientes, total: filteredRows.length };
  }, [filteredRows]);

  const activeFilters = [
    search && { key: "search", label: `Buscar: "${search}"`, clear: () => setSearch("") },
    departamento && {
      key: "departamento",
      label: `Depto: ${departamento}`,
      clear: () => setDepartamento(""),
    },
    estadoPago && {
      key: "estadoPago",
      label: `Pago: ${estadoPago}`,
      clear: () => setEstadoPago(""),
    },
  ].filter(Boolean);

  async function togglePagado(row) {
    const nextEstado = row.record.estado === "Pagado" ? "Pendiente" : "Pagado";
    if (nextEstado === "Pagado") {
      const result = await Swal.fire({
        icon: "question",
        title: "¿Confirmar pago?",
        html: `Se marcará a <strong>${row.employee.nombre}</strong> como pagado por <strong>${money(
          row.total,
        )}</strong> esta semana.`,
        showCancelButton: true,
        confirmButtonText: "Sí, marcar pagado",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
      });
      if (!result.isConfirmed) return;
    }
    upsertRecord(row.employee.id, { estado: nextEstado });
    if (nextEstado === "Pagado") {
      Swal.fire({
        icon: "success",
        title: "Pago registrado",
        timer: 1400,
        showConfirmButton: false,
      });
    }
  }

  function buildExportColumns() {
    return [
      { header: "Empleado", value: (r) => r.employee.nombre, width: 26 },
      { header: "Documento", value: (r) => r.employee.documento, width: 14 },
      { header: "Cargo", value: (r) => r.employee.cargo, width: 20 },
      { header: "Departamento", value: (r) => r.employee.departamento, width: 16 },
      { header: "Salario Base", value: (r) => r.employee.salarioBase.toFixed(2), width: 14 },
      { header: "Horas Extra", value: (r) => Number(r.record.horasExtra) || 0, width: 12 },
      { header: "Pago H. Extra", value: (r) => r.extraPay.toFixed(2), width: 14 },
      { header: "Descuentos", value: (r) => Number(r.record.descuentos) || 0, width: 12 },
      { header: "Total a Pagar", value: (r) => r.total.toFixed(2), width: 14 },
      { header: "Estado", value: (r) => r.record.estado, width: 12 },
    ];
  }

  function buildExportSummary() {
    return [
      { label: "Total planilla", value: money(summary.totalPlanilla) },
      { label: "Horas extra", value: summary.totalHorasExtra },
      { label: "Pagos pendientes", value: `${summary.pendientes} de ${summary.total}` },
    ];
  }

  function handleExportExcel() {
    if (filteredRows.length === 0) {
      Swal.fire({ icon: "info", title: "Nada que exportar", text: "No hay registros con los filtros actuales." });
      return;
    }
    exportToExcel({
      rows: filteredRows,
      columns: buildExportColumns(),
      fileName: `planilla_${week}`,
      sheetName: week,
      title: "Planilla de Pago Semanal",
      subtitle: formatWeekLabel(week),
      summary: buildExportSummary(),
    });
    Swal.fire({ icon: "success", title: "Excel exportado", timer: 1400, showConfirmButton: false });
  }

  function handleExportPDF() {
    if (filteredRows.length === 0) {
      Swal.fire({ icon: "info", title: "Nada que exportar", text: "No hay registros con los filtros actuales." });
      return;
    }
    exportToPDF({
      rows: filteredRows,
      columns: buildExportColumns(),
      fileName: `planilla_${week}`,
      title: "Planilla de Pago Semanal",
      subtitle: formatWeekLabel(week),
      summary: buildExportSummary(),
    });
    Swal.fire({ icon: "success", title: "PDF exportado", timer: 1400, showConfirmButton: false });
  }

  const columns = [
    {
      name: "Empleado",
      selector: (row) => row.employee.nombre,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="name-cell-text">
          <strong>{row.employee.nombre}</strong>
          <span>{row.employee.cargo} · {row.employee.departamento}</span>
        </div>
      ),
    },
    {
      name: "Salario base",
      selector: (row) => row.employee.salarioBase,
      sortable: true,
      right: true,
      cell: (row) => <span>{money(row.employee.salarioBase)}</span>,
    },
    {
      name: "Tarifa/hora",
      selector: (row) => hourlyRate(row.employee),
      right: true,
      cell: (row) => <span className="cell-muted">{money(hourlyRate(row.employee))}</span>,
    },
    {
      name: "Horas extra",
      center: true,
      width: "120px",
      cell: (row) => (
        <input
          type="number"
          min="0"
          step="0.5"
          className="hours-input"
          value={row.record.horasExtra}
          onChange={(e) =>
            upsertRecord(row.employee.id, { horasExtra: Number(e.target.value) || 0 })
          }
        />
      ),
    },
    {
      name: "Pago extra",
      right: true,
      cell: (row) => <span className="cell-strong">{money(row.extraPay)}</span>,
    },
    {
      name: "Descuentos",
      center: true,
      width: "120px",
      cell: (row) => (
        <input
          type="number"
          min="0"
          step="1"
          className="hours-input"
          value={row.record.descuentos}
          onChange={(e) =>
            upsertRecord(row.employee.id, { descuentos: Number(e.target.value) || 0 })
          }
        />
      ),
    },
    {
      name: "Total a pagar",
      right: true,
      sortable: true,
      selector: (row) => row.total,
      cell: (row) => <span className="cell-strong">{money(row.total)}</span>,
    },
    {
      name: "Estado",
      center: true,
      width: "140px",
      cell: (row) => (
        <button
          className="btn-icon"
          style={{ width: "auto", padding: "6px 10px", whiteSpace: "nowrap" }}
          onClick={() => togglePagado(row)}
          title="Cambiar estado de pago"
        >
          <Badge tone={row.record.estado === "Pagado" ? "success" : "warning"}>
            {row.record.estado === "Pagado" ? <FiCheckCircle /> : <FiClock />}
            {row.record.estado}
          </Badge>
        </button>
      ),
    },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Planilla de la semana</h2>
          <p>{formatWeekLabel(week)}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field">
            <label>Semana</label>
            <input type="week" value={week} onChange={(e) => setWeek(e.target.value)} />
          </div>
          <button className="btn btn-outline" onClick={handleExportExcel}>
            <FiDownload /> Excel
          </button>
          <button className="btn btn-outline" onClick={handleExportPDF}>
            <FiFileText /> PDF
          </button>
        </div>
      </div>

      <div className="stat-grid" style={{ padding: "18px 20px 0" }}>
        <div className="stat-card">
          <div className="stat-card-label">Total planilla filtrada</div>
          <div className="stat-card-value">{money(summary.totalPlanilla)}</div>
          <div className="stat-card-sub">{summary.total} empleados en la vista actual</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Horas extra registradas</div>
          <div className="stat-card-value">{summary.totalHorasExtra}</div>
          <div className="stat-card-sub">Horas en esta semana</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Pagos pendientes</div>
          <div className="stat-card-value">{summary.pendientes}</div>
          <div className="stat-card-sub">De {summary.total} en la vista actual</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="field search">
          <label>Buscar empleado</label>
          <input
            placeholder="Nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Departamento</label>
          <select value={departamento} onChange={(e) => setDepartamento(e.target.value)}>
            <option value="">Todos</option>
            {DEPARTAMENTOS.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Estado de pago</label>
          <select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
            <option value="">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Pagado">Pagado</option>
          </select>
        </div>
        <div className="field">
          <label>Personal</label>
          <select
            value={soloActivos ? "activos" : "todos"}
            onChange={(e) => setSoloActivos(e.target.value === "activos")}
          >
            <option value="activos">Solo activos</option>
            <option value="todos">Todos (incluye inactivos)</option>
          </select>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="filter-tag-row">
          {activeFilters.map((f) => (
            <span className="filter-tag" key={f.key}>
              {f.label}
              <button onClick={f.clear}>
                <FiX />
              </button>
            </span>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredRows}
        keyField="id"
        customStyles={tableCustomStyles}
        pagination
        paginationPerPage={8}
        paginationRowsPerPageOptions={[8, 15, 30]}
        highlightOnHover
        noDataComponent={
          <div className="empty-state">
            <FiInbox />
            <p>No hay empleados que coincidan con los filtros para esta semana.</p>
          </div>
        }
      />
    </div>
  );
}
