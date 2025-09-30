import { db } from "../server/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function runNewMigrations() {
  console.log("🚀 Executando novas migrations do sistema de leads...\n");

  const migrations = [
    { file: "0008_add_lead_management_fields.sql", name: "Add lead management fields" },
    { file: "0009_create_lead_interactions_table.sql", name: "Create lead interactions table" },
    { file: "0010_create_lead_status_history_table.sql", name: "Create lead status history table" }
  ];

  for (const migration of migrations) {
    console.log(`▶️  Executando: ${migration.name}`);

    try {
      const filePath = path.join(process.cwd(), "migrations", migration.file);
      const sqlContent = fs.readFileSync(filePath, "utf-8");

      // Split by semicolon and execute each statement separately
      const statements = sqlContent
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith("--"));

      for (const statement of statements) {
        try {
          await db.execute(sql.raw(statement + ";"));
        } catch (err: any) {
          // Ignore errors for "already exists" to make it idempotent
          if (!err.message?.includes("already exists")) {
            throw err;
          }
          console.log(`  ⚠️ Skipping (already exists): ${err.message?.substring(0, 50)}`);
        }
      }

      console.log(`✅ ${migration.name} executada com sucesso!\n`);
    } catch (error: any) {
      console.error(`❌ Erro ao executar ${migration.name}:`, error.message);
      console.log("\n⚠️  Migration interrompida. Verifique o erro acima.");
      process.exit(1);
    }
  }

  console.log("✅ Todas as migrations do sistema de leads foram executadas!");
}

// Execute
runNewMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });