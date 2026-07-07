import { FiGrid, FiUsers, FiCalendar } from "react-icons/fi";

const NAV_ITEMS = [
  { key: "dashboard", label: "Resumen", icon: FiGrid },
  { key: "employees", label: "Empleados", icon: FiUsers },
  { key: "payroll", label: "Planilla Semanal", icon: FiCalendar },
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
        Datos guardados localmente en este navegador.
      </div>
    </aside>
  );
}
