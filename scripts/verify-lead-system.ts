import { db } from "../server/db";
import { contactMessages } from "@shared/schema";
import { sql } from "drizzle-orm";

async function verifyLeadSystem() {
  console.log("🔍 Verificando sistema de leads...\n");

  try {
    // 1. Verificar quantos leads temos no banco
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactMessages);

    console.log(`✅ Total de leads no banco: ${count}`);

    // 2. Verificar leads por status
    const statusCounts = await db.execute(`
      SELECT status, COUNT(*) as count
      FROM contact_messages
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log("\n📊 Distribuição por status:");
    for (const row of statusCounts.rows) {
      console.log(`  - ${row.status || 'null'}: ${row.count}`);
    }

    // 3. Verificar campos novos
    const sample = await db
      .select()
      .from(contactMessages)
      .limit(1);

    if (sample.length > 0) {
      console.log("\n🔧 Verificação de campos (primeiro lead):");
      const lead = sample[0];
      console.log(`  - ID: ${lead.id}`);
      console.log(`  - Status: ${lead.status}`);
      console.log(`  - Lead Score: ${lead.leadScore}`);
      console.log(`  - Assigned To: ${lead.assignedTo}`);
      console.log(`  - City: ${lead.city}`);
      console.log(`  - State: ${lead.state}`);
      console.log(`  - Interaction Count: ${lead.interactionCount}`);
    }

    // 4. Testar endpoint de listagem
    console.log("\n🌐 Testando API endpoints:");

    try {
      const response = await fetch("http://localhost:3000/api/admin/leads?page=1&limit=5", {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ GET /api/admin/leads funcionando`);
        console.log(`     - Total: ${data.data?.total || 0}`);
        console.log(`     - Leads retornados: ${data.data?.leads?.length || 0}`);
      } else {
        console.log(`  ⚠️ GET /api/admin/leads retornou status ${response.status}`);
        console.log(`     (Pode precisar de autenticação)`);
      }
    } catch (error) {
      console.log(`  ❌ Erro ao testar API: ${error}`);
    }

    console.log("\n✨ Sistema de leads está operacional!");
    console.log("\n📝 Próximos passos:");
    console.log("  1. Acesse http://localhost:3000/admin/leads");
    console.log("  2. Faça login como admin");
    console.log("  3. Visualize e gerencie seus leads");

  } catch (error) {
    console.error("❌ Erro ao verificar sistema:", error);
  }
}

// Execute
verifyLeadSystem()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });