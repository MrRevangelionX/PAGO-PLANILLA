import { useState } from "react";
import { format } from "date-fns";
import { FiX } from "react-icons/fi";
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO, METODOS_PAGO } from "../../utils/financeCalc";

function todayValue() {
  return format(new Date(), "yyyy-MM-dd");
}

const EMPTY_FORM = {
  tipo: "Gasto",
  concepto: "",
  categoria: CATEGORIAS_GASTO[0],
  monto: "",
  fecha: todayValue(),
  metodoPago: METODOS_PAGO[0],
  notas: "",
};

export default function TransactionModal({ transaction, onClose, onSave }) {
  const [form, setForm] = useState(
    transaction ? { ...transaction, monto: String(transaction.monto) } : EMPTY_FORM,
  );
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "tipo") {
        const categorias = value === "Ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;
        next.categoria = categorias[0];
      }
      return next;
    });
  }

  function validate() {
    const next = {};
    if (!form.concepto.trim()) next.concepto = "El concepto es obligatorio";
    if (!form.monto || Number(form.monto) <= 0) next.monto = "Ingresa un monto válido";
    if (!form.fecha) next.fecha = "Selecciona una fecha";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, monto: Number(form.monto) });
  }

  const categorias = form.tipo === "Ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h3>{transaction ? "Editar movimiento" : "Nuevo movimiento"}</h3>
          <button className="btn-icon" onClick={onClose} type="button">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="tipo-toggle">
              <button
                type="button"
                className={`tipo-toggle-btn gasto${form.tipo === "Gasto" ? " active" : ""}`}
                onClick={() => update("tipo", "Gasto")}
              >
                Gasto
              </button>
              <button
                type="button"
                className={`tipo-toggle-btn ingreso${form.tipo === "Ingreso" ? " active" : ""}`}
                onClick={() => update("tipo", "Ingreso")}
              >
                Ingreso
              </button>
            </div>

            <div className="form-grid">
              <div className="field full">
                <label>Concepto</label>
                <input
                  value={form.concepto}
                  onChange={(e) => update("concepto", e.target.value)}
                  placeholder="Ej. Compra de suministros de oficina"
                />
                {errors.concepto && <span className="field-error">{errors.concepto}</span>}
              </div>

              <div className="field">
                <label>Categoría</label>
                <select value={form.categoria} onChange={(e) => update("categoria", e.target.value)}>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Monto (US$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monto}
                  onChange={(e) => update("monto", e.target.value)}
                  placeholder="0.00"
                />
                {errors.monto && <span className="field-error">{errors.monto}</span>}
              </div>

              <div className="field">
                <label>Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => update("fecha", e.target.value)}
                />
                {errors.fecha && <span className="field-error">{errors.fecha}</span>}
              </div>

              <div className="field">
                <label>Método de pago</label>
                <select value={form.metodoPago} onChange={(e) => update("metodoPago", e.target.value)}>
                  {METODOS_PAGO.map((metodo) => (
                    <option key={metodo} value={metodo}>
                      {metodo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field full">
                <label>Notas (opcional)</label>
                <textarea
                  rows={2}
                  value={form.notas}
                  onChange={(e) => update("notas", e.target.value)}
                  placeholder="Detalles adicionales..."
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {transaction ? "Guardar cambios" : "Registrar movimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
