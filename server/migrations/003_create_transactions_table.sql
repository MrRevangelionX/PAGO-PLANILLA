CREATE TABLE IF NOT EXISTS transactions (
  seq INT NOT NULL AUTO_INCREMENT,
  id VARCHAR(36) NOT NULL,
  tipo ENUM('Ingreso', 'Gasto') NOT NULL,
  concepto VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha DATE NOT NULL,
  metodoPago VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
  notas TEXT,
  PRIMARY KEY (id),
  UNIQUE KEY uq_transactions_seq (seq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
