import { useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { FiPlus, FiEdit2, FiTrash2, FiUserX, FiX } from "react-icons/fi";
import { v4 as uuid } from "uuid";
import EmployeeModal from "./EmployeeModal";
import Badge from "../common/Badge";
import { DEPARTAMENTOS } from "../../utils/seedData";
import { money } from "../../utils/payrollCalc";
import { tableCustomStyles } from "../../utils/dataTableStyles";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function EmployeesPage({ employees, setEmployees }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [estado, setEstado] = useState("");

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !search ||
        emp.nombre.toLowerCase().includes(search.toLowerCase()) ||
        emp.documento.includes(search);
      const matchesDepto = !departamento || emp.departamento === departamento;
      const matchesEstado = !estado || emp.estado === estado;
      return matchesSearch && matchesDepto && matchesEstado;
    });
  }, [employees, search, departamento, estado]);

  const activeFilters = [
    search && { key: "search", label: `Buscar: "${search}"`, clear: () => setSearch("") },
    departamento && {
      key: "departamento",
      label: `Depto: ${departamento}`,
      clear: () => setDepartamento(""),
    },
    estado && { key: "estado", label: `Estado: ${estado}`, clear: () => setEstado("") },
  ].filter(Boolean);

  function openCreate() {
    setEditingEmployee(null);
    setModalOpen(true);
  }

  function openEdit(emp) {
    setEditingEmployee(emp);
    setModalOpen(true);
  }

  function handleSave(data) {
    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === editingEmployee.id ? { ...emp, ...data } : emp)),
      );
      Swal.fire({
        icon: "success",
        title: "Empleado actualizado",
        text: `${data.nombre} fue actualizado correctamente.`,
        confirmButtonText: "Entendido",
      });
    } else {
      setEmployees((prev) => [...prev, { ...data, id: uuid() }]);
      Swal.fire({
        icon: "success",
        title: "Empleado creado",
        text: `${data.nombre} fue agregado a la planilla.`,
        confirmButtonText: "Entendido",
      });
    }
    setModalOpen(false);
  }

  async function handleDelete(emp) {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar empleado?",
      html: `Esta acción eliminará a <strong>${emp.nombre}</strong> y no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "El empleado fue eliminado de la planilla.",
        timer: 1600,
        showConfirmButton: false,
      });
    }
  }

  const columns = [
    {
      name: "Empleado",
      selector: (row) => row.nombre,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="name-cell">
          <div className="avatar-chip">{initials(row.nombre)}</div>
          <div className="name-cell-text">
            <strong>{row.nombre}</strong>
            <span>DUI {row.documento}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Cargo",
      selector: (row) => row.cargo,
      sortable: true,
    },
    {
      name: "Departamento",
      selector: (row) => row.departamento,
      sortable: true,
    },
    {
      name: "Salario base",
      selector: (row) => row.salarioBase,
      sortable: true,
      right: true,
      cell: (row) => <span className="cell-strong">{money(row.salarioBase)}</span>,
    },
    {
      name: "Factor H.E.",
      selector: (row) => row.factorHoraExtra,
      sortable: true,
      center: true,
      cell: (row) => <span>{row.factorHoraExtra}x</span>,
    },
    {
      name: "Estado",
      selector: (row) => row.estado,
      sortable: true,
      cell: (row) => (
        <Badge tone={row.estado === "Activo" ? "success" : "neutral"}>{row.estado}</Badge>
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
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Listado de empleados</h2>
          <p>{employees.length} empleados registrados en total</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Nuevo empleado
        </button>
      </div>

      <div className="filter-bar">
        <div className="field search">
          <label>Buscar</label>
          <input
            placeholder="Nombre o documento..."
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
          <label>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
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
        data={filtered}
        customStyles={tableCustomStyles}
        pagination
        paginationPerPage={8}
        paginationRowsPerPageOptions={[8, 15, 30]}
        highlightOnHover
        noDataComponent={
          <div className="empty-state">
            <FiUserX />
            <p>No se encontraron empleados con los filtros aplicados.</p>
          </div>
        }
      />

      {modalOpen && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
