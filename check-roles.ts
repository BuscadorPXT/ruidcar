import { db } from "./server/db";
import { users, userRoles, roles } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkRoles() {
  try {
    console.log("🔍 Verificando roles e associações...\n");

    // Verificar roles
    const allRoles = await db.select().from(roles);
    console.log(`📊 Total de roles: ${allRoles.length}`);

    if (allRoles.length > 0) {
      console.log("\n📋 Roles disponíveis:");
      for (const role of allRoles) {
        console.log(`   - ${role.name} (ID: ${role.id}) - ${role.description}`);
      }
    }

    // Verificar associações user-role
    const allUserRoles = await db.select({
      userId: userRoles.userId,
      roleId: userRoles.roleId,
      userName: users.name,
      userEmail: users.email,
      roleName: roles.name
    })
    .from(userRoles)
    .innerJoin(users, eq(users.id, userRoles.userId))
    .innerJoin(roles, eq(roles.id, userRoles.roleId));

    console.log(`\n📊 Total de associações user-role: ${allUserRoles.length}`);

    if (allUserRoles.length > 0) {
      console.log("\n👥 Associações User-Role:");
      for (const ur of allUserRoles) {
        console.log(`   - ${ur.userEmail} (${ur.userName}) => ${ur.roleName}`);
      }
    } else {
      console.log("\n⚠️  Nenhuma associação user-role encontrada!");

      // Vamos associar role ADMIN ao usuário admin@ruidcar.com
      const adminUser = await db.select().from(users).where(eq(users.email, 'admin@ruidcar.com'));
      const adminRole = await db.select().from(roles).where(eq(roles.name, 'ADMIN'));

      if (adminUser.length > 0 && adminRole.length > 0) {
        console.log("\n🔧 Associando role ADMIN ao usuário admin@ruidcar.com...");

        await db.insert(userRoles).values({
          userId: adminUser[0].id,
          roleId: adminRole[0].id,
          isActive: true
        }).onConflictDoNothing();

        console.log("✅ Role ADMIN associada!");
      }

      // Associar role CLIENTE ao usuário teste
      const testUser = await db.select().from(users).where(eq(users.email, 'teste@ruidcar.com'));
      const clienteRole = await db.select().from(roles).where(eq(roles.name, 'CLIENTE'));

      if (testUser.length > 0 && clienteRole.length > 0) {
        console.log("\n🔧 Associando role CLIENTE ao usuário teste@ruidcar.com...");

        await db.insert(userRoles).values({
          userId: testUser[0].id,
          roleId: clienteRole[0].id,
          isActive: true
        }).onConflictDoNothing();

        console.log("✅ Role CLIENTE associada!");
      }
    }

    console.log("\n✅ Verificação concluída!");

  } catch (error) {
    console.error("❌ Erro ao verificar roles:", error);
  } finally {
    process.exit(0);
  }
}

checkRoles();