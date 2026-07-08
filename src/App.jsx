import { useEffect, useState } from "react";
import Sidebar from "./components/Layout/Sidebar";
import Topbar from "./components/Layout/Topbar";
import DashboardPage from "./components/Dashboard/DashboardPage";
import EmployeesPage from "./components/Employees/EmployeesPage";
import PayrollPage from "./components/Payroll/PayrollPage";
import FinancePage from "./components/Finance/FinancePage";
import { api } from "./utils/api";

function App() {
  const [view, setView] = useState("dashboard");
  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    Promise.all([api.getEmployees(), api.getPayrollRecords(), api.getTransactions()])
      .then(([emps, records, txns]) => {
        setEmployees(emps);
        setPayrollRecords(records);
        setTransactions(txns);
      })
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, []);

  async function createEmployee(data) {
    const created = await api.createEmployee(data);
    setEmployees((prev) => [...prev, created]);
    return created;
  }

  async function updateEmployee(id, data) {
    const updated = await api.updateEmployee(id, data);
    setEmployees((prev) => prev.map((emp) => (emp.id === id ? updated : emp)));
    return updated;
  }

  async function deleteEmployee(id) {
    await api.deleteEmployee(id);
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  }

  async function upsertPayrollRecord(employeeId, semana, patch) {
    const record = await api.upsertPayrollRecord({ employeeId, semana, ...patch });
    setPayrollRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      return exists ? prev.map((r) => (r.id === record.id ? record : r)) : [...prev, record];
    });
    return record;
  }

  async function createTransaction(data) {
    const created = await api.createTransaction(data);
    setTransactions((prev) => [created, ...prev]);
    return created;
  }

  async function updateTransaction(id, data) {
    const updated = await api.updateTransaction(id, data);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }

  async function deleteTransaction(id) {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return (
      <div className="app-loading">
        <p>Cargando datos de la base local...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-loading">
        <p>No se pudo conectar con el servidor local ({loadError}).</p>
        <p>Verifica que el servidor esté corriendo con "npm run server".</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar view={view} onChangeView={setView} />
      <div className="main-area">
        <Topbar view={view} />
        <main className="page-content">
          {view === "dashboard" && (
            <DashboardPage
              employees={employees}
              payrollRecords={payrollRecords}
              transactions={transactions}
            />
          )}
          {view === "employees" && (
            <EmployeesPage
              employees={employees}
              onCreateEmployee={createEmployee}
              onUpdateEmployee={updateEmployee}
              onDeleteEmployee={deleteEmployee}
            />
          )}
          {view === "payroll" && (
            <PayrollPage
              employees={employees}
              payrollRecords={payrollRecords}
              onUpsertRecord={upsertPayrollRecord}
            />
          )}
          {view === "finance" && (
            <FinancePage
              transactions={transactions}
              onCreate={createTransaction}
              onUpdate={updateTransaction}
              onDelete={deleteTransaction}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
