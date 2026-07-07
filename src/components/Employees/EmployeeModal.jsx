import { useState } from "react";
import { FiX } from "react-icons/fi";
import { DEPARTAMENTOS } from "../../utils/seedData";

const EMPTY_FORM = {
  nombre: "",
  documento: "",
  cargo: "",
  departamento: DEPARTAMENTOS[0],
  salarioBase: "",
  factorHoraExtra: "1.5",
  telefono: "",
  fechaIngreso: "",
  estado: "Activo",
};

export default function EmployeeModal({ employee, onClose, onSave }) {
  const [form, setForm] = useState(
    employee
      ? { ...employee, salarioBase: String(employee.salarioBase), factorHoraExtra: String(employee.factorHoraExtra) }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.nombre.trim()) next.nombre = "El nombre es obligatorio";
    if (!form.documento.trim()) next.documento = "El documento es obligatorio";
    if (!form.cargo.trim()) next.cargo = "El cargo es obligatorio";
    if (!form.salarioBase || Number(form.salarioBase) <= 0)
      next.salarioBase = "Ingresa un salario válido";
    if (!form.factorHoraExtra || Number(form.factorHoraExtra) <= 0)
      next.factorHoraExtra = "Ingresa un factor válido";
    if (!form.fechaIngreso) next.fechaIngreso = "Selecciona una fecha";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      salarioBase: Number(form.salarioBase),
      factorHoraExtra: Number(form.factorHoraExtra),
    });
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h3>{employee ? "Editar empleado" : "Nuevo empleado"}</h3>
          <button className="btn-icon" onClick={onClose} type="button">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field full">
                <label>Nombre completo</label>
                <input
                  value={form.nombre}
                  onChange={(e) => update("nombre", e.target.value)}
                  placeholder="Ej. Juana Pérez Díaz"
                />
                {errors.nombre && <span className="field-error">{errors.nombre}</span>}
              </div>

              <div className="field">
                <label>Documento (DUI)</label>
                <input
                  value={form.documento}
                  onChange={(e) => update("documento", e.target.value)}
                  placeholder="00000000-0"
                />
                {errors.documento && <span className="field-error">{errors.documento}</span>}
              </div>

              <div className="field">
                <label>Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={(e) => update("telefono", e.target.value)}
                  placeholder="(503) 99999999"
                />
              </div>

              <div className="field">
                <label>Cargo</label>
                <input
                  value={form.cargo}
                  onChange={(e) => update("cargo", e.target.value)}
                  placeholder="Ej. Operario"
                />
                {errors.cargo && <span className="field-error">{errors.cargo}</span>}
              </div>

              <div className="field">
                <label>Departamento</label>
                <select
                  value={form.departamento}
                  onChange={(e) => update("departamento", e.target.value)}
                >
                  {DEPARTAMENTOS.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Salario base semanal (US$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salarioBase}
                  onChange={(e) => update("salarioBase", e.target.value)}q
                  placeholder="US$350.00"
                />
                {errors.salarioBase && <span className="field-error">{errors.salarioBase}</span>}
              </div>

              <div className="field">
                <label>Factor hora extra</label>
                <input
                  type="number"
                  min="1"
                  step="0.05"
                  value={form.factorHoraExtra}
                  onChange={(e) => update("factorHoraExtra", e.target.value)}
                  placeholder="1.5"
                />
                {errors.factorHoraExtra && (
                  <span className="field-error">{errors.factorHoraExtra}</span>
                )}
              </div>

              <div className="field">
                <label>Fecha de ingreso</label>
                <input
                  type="date"
                  value={form.fechaIngreso}
                  onChange={(e) => update("fechaIngreso", e.target.value)}
                />
                {errors.fechaIngreso && <span className="field-error">{errors.fechaIngreso}</span>}
              </div>

              <div className="field">
                <label>Estado</label>
                <select value={form.estado} onChange={(e) => update("estado", e.target.value)}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {employee ? "Guardar cambios" : "Crear empleado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
