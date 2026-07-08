import { FiGrid, FiUsers, FiCalendar, FiDollarSign } from "react-icons/fi";

const NAV_ITEMS = [
  { key: "dashboard", label: "Resumen", icon: FiGrid },
  { key: "employees", label: "Empleados", icon: FiUsers },
  { key: "payroll", label: "Planilla Semanal", icon: FiCalendar },
  { key: "finance", label: "Gastos e Ingresos", icon: FiDollarSign },
];

export default function Sidebar({ view, onChangeView }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">PP</div>
        <div className="sidebar-brand-text">
          <strong>Pago Planilla</strong>
          <span>Control semanal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`sidebar-nav-item${view === key ? " active" : ""}`}
            onClick={() => onChangeView(key)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        Datos guardados en la base de datos local (SQLite).
      </div>
    </aside>
  );
}
