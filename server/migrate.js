import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync } from "node:fs";
import { pool } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      appliedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_migrations_name (name)
    )
  `);

  const [applied] = await pool.query("SELECT name FROM _migrations");
  const appliedNames = new Set(applied.map((row) => row.name));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (appliedNames.has(file)) continue;

    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const connection = await pool.getConnection();
    try {
      await connection.query(sql);
      await connection.query("INSERT INTO _migrations (name) VALUES (?)", [file]);
      console.log(`Migración aplicada: ${file}`);
    } finally {
      connection.release();
    }
  }
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  runMigrations()
    .then(() => {
      console.log("Migraciones al día.");
      return pool.end();
    })
    .catch((err) => {
      console.error("Error ejecutando migraciones:", err);
      process.exitCode = 1;
      return pool.end();
    });
}
