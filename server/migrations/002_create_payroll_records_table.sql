CREATE TABLE IF NOT EXISTS payroll_records (
  id VARCHAR(36) NOT NULL,
  employeeId VARCHAR(36) NOT NULL,
  semana VARCHAR(20) NOT NULL,
  horasExtra DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuentos DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  PRIMARY KEY (id),
  UNIQUE KEY uq_payroll_employee_semana (employeeId, semana),
  CONSTRAINT fk_payroll_employee FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
