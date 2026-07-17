CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(36) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  documento VARCHAR(50) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  departamento VARCHAR(100) NOT NULL,
  salarioBase DECIMAL(12,2) NOT NULL,
  factorHoraExtra DECIMAL(6,2) NOT NULL,
  telefono VARCHAR(30),
  fechaIngreso DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
