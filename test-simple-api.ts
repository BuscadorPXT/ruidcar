import { db } from "./server/db";
import { users } from "./shared/schema";

async function testSimpleAPI() {
  try {
    console.log("🔍 Testando consulta simples de usuários...\n");

    // Primeira consulta simples
    const allUsers = await db.select().from(users);

    console.log(`📊 Total de usuários: ${allUsers.length}\n`);

    if (allUsers.length > 0) {
      console.log("📋 Dados dos usuários:");
      for (const user of allUsers) {
        console.log("\n-------------------");
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Username: ${user.username}`);
        console.log(`Name: ${user.name}`);
        console.log(`Company: ${user.company || 'null'}`);
        console.log(`Role: ${user.role || 'null'}`);
        console.log(`Created: ${user.createdAt}`);
      }
    } else {
      console.log("⚠️ Nenhum usuário encontrado!");
    }

    console.log("\n\n✅ Consulta simples funcionou!");

  } catch (error) {
    console.error("❌ Erro na consulta simples:", error);
  } finally {
    process.exit(0);
  }
}

testSimpleAPI();