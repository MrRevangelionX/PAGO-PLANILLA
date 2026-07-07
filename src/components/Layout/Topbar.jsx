import { format } from "date-fns";
import { es } from "date-fns/locale";

const TITLES = {
  dashboard: {
    title: "Resumen general",
    subtitle: "Vista rápida de tu planilla semanal",
  },
  employees: {
    title: "Empleados",
    subtitle: "Administra el personal y sus datos de pago",
  },
  payroll: {
    title: "Planilla Semanal",
    subtitle: "Registra horas extra y calcula el pago de la semana",
  },
};

export default function Topbar({ view }) {
  const info = TITLES[view] || TITLES.dashboard;
  const today = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es });

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{info.title}</h1>
        <span>{info.subtitle}</span>
      </div>
      <div className="topbar-date" style={{ textTransform: "capitalize" }}>
        {today}
      </div>
    </header>
  );
}
