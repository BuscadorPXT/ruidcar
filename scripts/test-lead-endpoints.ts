import { db } from "../server/db";
import { contactMessages, users } from "@shared/schema";

async function testLeadEndpoints() {
  console.log("🧪 Testando endpoints do sistema de leads...\n");

  const baseUrl = "http://localhost:3000/api/admin/leads";

  try {
    // 1. Get admin token (assuming there's an admin user)
    console.log("📋 Fazendo login como admin...");
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "admin123"
      }),
    });

    if (!loginRes.ok) {
      console.log("⚠️ Não foi possível fazer login. Continuando sem autenticação...");
    }

    const cookies = loginRes.headers.get("set-cookie") || "";

    // 2. Test GET /api/admin/leads
    console.log("\n📝 Testando GET /api/admin/leads...");
    const listRes = await fetch(baseUrl + "?page=1&limit=10", {
      headers: { Cookie: cookies }
    });

    if (listRes.ok) {
      const data = await listRes.json();
      console.log("✅ Lista de leads:", {
        total: data.data.total,
        count: data.data.leads.length,
        pages: data.data.totalPages
      });
    } else {
      console.log("❌ Erro ao listar leads:", listRes.status);
    }

    // 3. Get first lead to test detail endpoint
    const leads = await db.select().from(contactMessages).limit(1);

    if (leads.length > 0) {
      const leadId = leads[0].id;

      // 4. Test GET /api/admin/leads/:id
      console.log(`\n📝 Testando GET /api/admin/leads/${leadId}...`);
      const detailRes = await fetch(`${baseUrl}/${leadId}`, {
        headers: { Cookie: cookies }
      });

      if (detailRes.ok) {
        const data = await detailRes.json();
        console.log("✅ Detalhes do lead:", {
          id: data.data.id,
          name: data.data.fullName,
          status: data.data.status,
          interactions: data.data.interactions?.length || 0,
          statusHistory: data.data.statusHistory?.length || 0
        });
      } else {
        console.log("❌ Erro ao buscar detalhes:", detailRes.status);
      }

      // 5. Test PUT /api/admin/leads/:id/status
      console.log(`\n📝 Testando PUT /api/admin/leads/${leadId}/status...`);
      const statusRes = await fetch(`${baseUrl}/${leadId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies
        },
        body: JSON.stringify({
          newStatus: "contacted",
          notes: "Teste de mudança de status"
        })
      });

      if (statusRes.ok) {
        console.log("✅ Status atualizado com sucesso!");
      } else {
        console.log("❌ Erro ao atualizar status:", statusRes.status);
      }

      // 6. Test POST /api/admin/leads/:id/interaction
      console.log(`\n📝 Testando POST /api/admin/leads/${leadId}/interaction...`);
      const interactionRes = await fetch(`${baseUrl}/${leadId}/interaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies
        },
        body: JSON.stringify({
          type: "note",
          content: "Teste de interação via API"
        })
      });

      if (interactionRes.ok) {
        console.log("✅ Interação adicionada com sucesso!");
      } else {
        console.log("❌ Erro ao adicionar interação:", interactionRes.status);
      }

      // 7. Test POST /api/admin/leads/:id/assign
      console.log(`\n📝 Testando POST /api/admin/leads/${leadId}/assign...`);

      // Get first admin user
      const [adminUser] = await db.select().from(users).limit(1);

      if (adminUser) {
        const assignRes = await fetch(`${baseUrl}/${leadId}/assign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookies
          },
          body: JSON.stringify({
            userId: adminUser.id,
            notifyUser: false
          })
        });

        if (assignRes.ok) {
          console.log("✅ Lead atribuído com sucesso!");
        } else {
          console.log("❌ Erro ao atribuir lead:", assignRes.status);
        }
      }
    } else {
      console.log("⚠️ Nenhum lead encontrado para testes");
    }

    console.log("\n🎉 Testes concluídos!");

  } catch (error) {
    console.error("❌ Erro durante os testes:", error);
  }
}

// Execute if running directly
if (require.main === module) {
  testLeadEndpoints()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}