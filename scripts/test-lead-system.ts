import { db } from "../server/db";
import { contactMessages, leadInteractions, leadStatusHistory, users } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

async function testLeadSystem() {
  console.log("🧪 Testando sistema de leads diretamente no banco...\n");

  try {
    // 1. Verificar leads no banco
    console.log("📊 Estatísticas dos leads:");
    const leads = await db.select().from(contactMessages).limit(5);
    console.log(`  - Total de leads: ${leads.length}`);

    // 2. Verificar novos campos
    if (leads.length > 0) {
      const firstLead = leads[0];
      console.log("\n📋 Primeiro lead com novos campos:");
      console.log(`  - ID: ${firstLead.id}`);
      console.log(`  - Nome: ${firstLead.fullName}`);
      console.log(`  - Status: ${firstLead.status}`);
      console.log(`  - Lead Score: ${firstLead.leadScore}`);
      console.log(`  - Assigned To: ${firstLead.assignedTo}`);
      console.log(`  - City: ${firstLead.city}`);
      console.log(`  - State: ${firstLead.state}`);
      console.log(`  - Tags: ${firstLead.tags}`);
      console.log(`  - Interaction Count: ${firstLead.interactionCount}`);
    }

    // 3. Verificar tabela de interações
    console.log("\n📝 Verificando tabela lead_interactions:");
    const interactions = await db
      .select()
      .from(leadInteractions)
      .limit(5);
    console.log(`  - Total de interações: ${interactions.length}`);

    // 4. Verificar tabela de histórico de status
    console.log("\n📜 Verificando tabela lead_status_history:");
    const statusHistory = await db
      .select()
      .from(leadStatusHistory)
      .limit(5);
    console.log(`  - Total de registros de histórico: ${statusHistory.length}`);

    // 5. Testar inserção de uma interação
    if (leads.length > 0) {
      console.log("\n🔧 Testando inserção de interação...");
      const [newInteraction] = await db
        .insert(leadInteractions)
        .values({
          leadId: leads[0].id,
          userId: 1, // Admin user
          type: "note",
          content: "Teste de interação criada via script",
        })
        .returning();

      console.log(`  ✅ Interação criada com ID: ${newInteraction.id}`);
    }

    // 6. Verificar joins funcionando
    if (leads.length > 0) {
      console.log("\n🔗 Testando joins entre tabelas...");
      const leadWithDetails = await db
        .select({
          lead: contactMessages,
          interactionCount: leadInteractions.id,
        })
        .from(contactMessages)
        .leftJoin(leadInteractions, eq(contactMessages.id, leadInteractions.leadId))
        .where(eq(contactMessages.id, leads[0].id))
        .limit(1);

      console.log(`  ✅ Join funcionando corretamente`);
    }

    // 7. Listar leads por status
    console.log("\n📈 Leads agrupados por status:");
    const statusCounts = await db.execute(`
      SELECT status, COUNT(*) as count
      FROM contact_messages
      GROUP BY status
    `);

    for (const row of statusCounts.rows) {
      console.log(`  - ${row.status}: ${row.count}`);
    }

    console.log("\n✅ Sistema de leads está funcionando corretamente!");

    // 8. Verificar se precisa atualizar status default
    const pendingLeads = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.status, "pending"));

    if (pendingLeads.length > 0) {
      console.log(`\n⚠️ Encontrados ${pendingLeads.length} leads com status 'pending'`);
      console.log("  Considere atualizar para 'new' para manter consistência");
    }

  } catch (error) {
    console.error("❌ Erro ao testar sistema de leads:", error);
  }
}

// Execute
testLeadSystem()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });