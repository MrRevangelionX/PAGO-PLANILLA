import { useState } from "react";
import Sidebar from "./components/Layout/Sidebar";
import Topbar from "./components/Layout/Topbar";
import DashboardPage from "./components/Dashboard/DashboardPage";
import EmployeesPage from "./components/Employees/EmployeesPage";
import PayrollPage from "./components/Payroll/PayrollPage";
import { useLocalStorage } from "./utils/storage";
import { seedEmployees } from "./utils/seedData";

function App() {
  const [view, setView] = useState("dashboard");
  const [employees, setEmployees] = useLocalStorage("pp_employees", seedEmployees);
  const [payrollRecords, setPayrollRecords] = useLocalStorage("pp_payroll_records", []);

  return (
    <div className="app-shell">
      <Sidebar view={view} onChangeView={setView} />
      <div className="main-area">
        <Topbar view={view} />
        <main className="page-content">
          {view === "dashboard" && (
            <DashboardPage employees={employees} payrollRecords={payrollRecords} />
          )}
          {view === "employees" && (
            <EmployeesPage employees={employees} setEmployees={setEmployees} />
          )}
          {view === "payroll" && (
            <PayrollPage
              employees={employees}
              payrollRecords={payrollRecords}
              setPayrollRecords={setPayrollRecords}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
