import { db } from "../server/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function runMigrations() {
  console.log("🔧 Executando migrations...\n");

  const migrationsDir = path.join(process.cwd(), "migrations");

  // Verificar se o diretório de migrations existe
  if (!fs.existsSync(migrationsDir)) {
    console.log("⚠️  Diretório de migrations não encontrado");
    return;
  }

  // Listar arquivos SQL no diretório
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith(".sql"))
    .sort(); // Ordenar alfabeticamente

  if (migrationFiles.length === 0) {
    console.log("ℹ️  Nenhuma migration encontrada");
    return;
  }

  console.log(`📋 ${migrationFiles.length} migration(s) encontrada(s):\n`);

  for (const file of migrationFiles) {
    console.log(`▶️  Executando: ${file}`);

    try {
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, "utf-8");

      // Executar SQL
      await db.execute(sql.raw(sqlContent));

      console.log(`✅ ${file} executada com sucesso!\n`);
    } catch (error) {
      console.error(`❌ Erro ao executar ${file}:`, error);
      console.log("\n⚠️  Migration interrompida. Corrija o erro e tente novamente.");
      process.exit(1);
    }
  }

  console.log("✅ Todas as migrations foram executadas com sucesso!");
}

// Executar migrations
runMigrations()
  .then(() => {
    console.log("\n🎉 Processo concluído!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Erro geral:", error);
    process.exit(1);
  });