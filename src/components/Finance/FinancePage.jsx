import { useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiFileText,
  FiX,
  FiInbox,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiList,
} from "react-icons/fi";
import TransactionModal from "./TransactionModal";
import Badge from "../common/Badge";
import StatCard from "../common/StatCard";
import { money } from "../../utils/payrollCalc";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils";
import { tableCustomStyles } from "../../utils/dataTableStyles";
import {
  CATEGORIAS_GASTO,
  CATEGORIAS_INGRESO,
  currentMonthValue,
  formatMonthLabel,
  isInMonth,
  summarizeTransactions,
} from "../../utils/financeCalc";

export default function FinancePage({ transactions, onCreate, onUpdate, onDelete }) {
  const [month, setMonth] = useState(currentMonthValue());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");

  const monthRows = useMemo(
    () => transactions.filter((t) => isInMonth(t.fecha, month)),
    [transactions, month],
  );

  const filteredRows = useMemo(() => {
    return monthRows.filter((t) => {
      const matchesSearch = !search || t.concepto.toLowerCase().includes(search.toLowerCase());
      const matchesTipo = !tipo || t.tipo === tipo;
      const matchesCategoria = !categoria || t.categoria === categoria;
      return matchesSearch && matchesTipo && matchesCategoria;
    });
  }, [monthRows, search, tipo, categoria]);

  const summary = useMemo(() => summarizeTransactions(filteredRows), [filteredRows]);

  const activeFilters = [
    search && { key: "search", label: `Buscar: "${search}"`, clear: () => setSearch("") },
    tipo && { key: "tipo", label: `Tipo: ${tipo}`, clear: () => setTipo("") },
    categoria && { key: "categoria", label: `Categoría: ${categoria}`, clear: () => setCategoria("") },
  ].filter(Boolean);

  const categoriasDisponibles = [...new Set([...CATEGORIAS_INGRESO, ...CATEGORIAS_GASTO])];

  function openCreate() {
    setEditingTransaction(null);
    setModalOpen(true);
  }

  function openEdit(transaction) {
    setEditingTransaction(transaction);
    setModalOpen(true);
  }

  async function handleSave(data) {
    try {
      if (editingTransaction) {
        await onUpdate(editingTransaction.id, data);
        Swal.fire({
          icon: "success",
          title: "Movimiento actualizado",
          timer: 1400,
          showConfirmButton: false,
        });
      } else {
        await onCreate(data);
        Swal.fire({
          icon: "success",
          title: "Movimiento registrado",
          timer: 1400,
          showConfirmButton: false,
        });
      }
      setModalOpen(false);
    } catch (error) {
      Swal.fire({ icon: "error", title: "No se pudo guardar", text: error.message });
    }
  }

  async function handleDelete(transaction) {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar movimiento?",
      html: `Esta acción eliminará <strong>${transaction.concepto}</strong> y no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await onDelete(transaction.id);
        Swal.fire({
          icon: "success",
          title: "Eliminado",
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({ icon: "error", title: "No se pudo eliminar", text: error.message });
      }
    }
  }

  function buildExportColumns() {
    return [
      { header: "Fecha", value: (r) => r.fecha, width: 12 },
      { header: "Concepto", value: (r) => r.concepto, width: 30 },
      { header: "Categoría", value: (r) => r.categoria, width: 18 },
      { header: "Tipo", value: (r) => r.tipo, width: 10 },
      { header: "Método de pago", value: (r) => r.metodoPago, width: 16 },
      { header: "Monto", value: (r) => Number(r.monto).toFixed(2), width: 14 },
    ];
  }

  function buildExportSummary() {
    return [
      { label: "Total ingresos", value: money(summary.ingresos) },
      { label: "Total gastos", value: money(summary.gastos) },
      { label: "Balance neto", value: money(summary.balance) },
    ];
  }

  function handleExportExcel() {
    if (filteredRows.length === 0) {
      Swal.fire({ icon: "info", title: "Nada que exportar", text: "No hay movimientos con los filtros actuales." });
      return;
    }
    exportToExcel({
      rows: filteredRows,
      columns: buildExportColumns(),
      fileName: `gastos_ingresos_${month}`,
      sheetName: month,
      title: "Reporte de Gastos e Ingresos",
      subtitle: formatMonthLabel(month),
      summary: buildExportSummary(),
    });
    Swal.fire({ icon: "success", title: "Excel exportado", timer: 1400, showConfirmButton: false });
  }

  function handleExportPDF() {
    if (filteredRows.length === 0) {
      Swal.fire({ icon: "info", title: "Nada que exportar", text: "No hay movimientos con los filtros actuales." });
      return;
    }
    exportToPDF({
      rows: filteredRows,
      columns: buildExportColumns(),
      fileName: `gastos_ingresos_${month}`,
      title: "Reporte de Gastos e Ingresos",
      subtitle: formatMonthLabel(month),
      summary: [
        {
          label: "Total ingresos",
          value: money(summary.ingresos),
          fill: [232, 243, 236],
          textColor: [90, 156, 120],
          valueColor: [58, 110, 82],
        },
        {
          label: "Total gastos",
          value: money(summary.gastos),
          fill: [251, 235, 233],
          textColor: [198, 91, 82],
          valueColor: [156, 62, 55],
        },
        {
          label: "Balance neto",
          value: money(summary.balance),
          fill: [253, 242, 230],
          textColor: [191, 114, 56],
          valueColor: [156, 92, 44],
        },
      ],
    });
    Swal.fire({ icon: "success", title: "PDF exportado", timer: 1400, showConfirmButton: false });
  }

  const columns = [
    {
      name: "Fecha",
      selector: (row) => row.fecha,
      sortable: true,
      width: "110px",
    },
    {
      name: "Concepto",
      selector: (row) => row.concepto,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="name-cell-text">
          <strong>{row.concepto}</strong>
          {row.notas && <span>{row.notas}</span>}
        </div>
      ),
    },
    {
      name: "Categoría",
      selector: (row) => row.categoria,
      sortable: true,
    },
    {
      name: "Método",
      selector: (row) => row.metodoPago,
    },
    {
      name: "Tipo",
      selector: (row) => row.tipo,
      sortable: true,
      cell: (row) => (
        <Badge tone={row.tipo === "Ingreso" ? "success" : "danger"}>{row.tipo}</Badge>
      ),
    },
    {
      name: "Monto",
      selector: (row) => row.monto,
      sortable: true,
      right: true,
      cell: (row) => (
        <span className={row.tipo === "Ingreso" ? "amount-positive" : "amount-negative"}>
          {row.tipo === "Ingreso" ? "+ " : "− "}
          {money(row.monto)}
        </span>
      ),
    },
    {
      name: "Acciones",
      right: true,
      width: "110px",
      cell: (row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-icon" onClick={() => openEdit(row)} title="Editar">
            <FiEdit2 />
          </button>
          <button
            className="btn-icon danger"
            onClick={() => handleDelete(row)}
            title="Eliminar"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="stat-grid">
        <StatCard
          icon={FiTrendingUp}
          label="Ingresos del mes"
          value={money(summary.ingresos)}
          sub={formatMonthLabel(month)}
        />
        <StatCard
          icon={FiTrendingDown}
          label="Gastos del mes"
          value={money(summary.gastos)}
          sub={formatMonthLabel(month)}
        />
        <StatCard
          icon={FiDollarSign}
          label="Balance neto"
          value={money(summary.balance)}
          sub={summary.balance >= 0 ? "Superávit del periodo" : "Déficit del periodo"}
        />
        <StatCard icon={FiList} label="Movimientos" value={summary.total} sub="En la vista actual" />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Gastos e ingresos</h2>
            <p>Registra y controla los movimientos pequeños de la empresa</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="field">
              <label>Mes</label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <button className="btn btn-outline" onClick={handleExportExcel}>
              <FiDownload /> Excel
            </button>
            <button className="btn btn-outline" onClick={handleExportPDF}>
              <FiFileText /> PDF
            </button>
            <button className="btn btn-primary" onClick={openCreate}>
              <FiPlus /> Nuevo movimiento
            </button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="field search">
            <label>Buscar</label>
            <input
              placeholder="Concepto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="Ingreso">Ingreso</option>
              <option value="Gasto">Gasto</option>
            </select>
          </div>
          <div className="field">
            <label>Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Todas</option>
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
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
          customStyles={tableCustomStyles}
          pagination
          paginationPerPage={8}
          paginationRowsPerPageOptions={[8, 15, 30]}
          highlightOnHover
          noDataComponent={
            <div className="empty-state">
              <FiInbox />
              <p>No hay movimientos registrados con los filtros actuales.</p>
            </div>
          }
        />
      </div>

      {modalOpen && (
        <TransactionModal
          transaction={editingTransaction}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
