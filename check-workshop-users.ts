import { db } from "./server/db";
import { users, workshopAdmins } from "./shared/schema";
import { desc } from "drizzle-orm";

async function checkWorkshopUsers() {
  try {
    console.log("🔍 Verificando usuários e admins de oficina...\n");

    // Verificar tabela users
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    console.log(`📊 Total de usuários na tabela 'users': ${allUsers.length}`);

    if (allUsers.length > 0) {
      console.log("\n👤 Usuários (tabela users):");
      for (const user of allUsers) {
        console.log(`   - ${user.email} (@${user.username})`);
      }
    }

    // Verificar tabela workshop_admins
    console.log("\n🔍 Verificando tabela workshop_admins...");
    const allWorkshopAdmins = await db.select().from(workshopAdmins);
    console.log(`📊 Total de admins de oficina: ${allWorkshopAdmins.length}`);

    if (allWorkshopAdmins.length > 0) {
      console.log("\n🏭 Admins de Oficina (tabela workshop_admins):");
      for (const admin of allWorkshopAdmins) {
        console.log(`   - ${admin.email} (${admin.name})`);
        console.log(`     ID: ${admin.id}`);
        console.log(`     Criado em: ${admin.createdAt}`);
      }

      console.log("\n⚠️  IMPORTANTE: Usuários da tabela workshop_admins NÃO aparecem na tabela users!");
      console.log("    Eles são entidades separadas e precisam ser migrados ou unificados.");
    }

    console.log("\n✅ Verificação concluída!");

  } catch (error) {
    console.error("❌ Erro ao verificar usuários:", error);
  } finally {
    process.exit(0);
  }
}

checkWorkshopUsers();