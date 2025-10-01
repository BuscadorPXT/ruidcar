import { db } from "./server/db";
import { users, userRoles, roles } from "./shared/schema";
import { desc } from "drizzle-orm";

async function checkUsers() {
  try {
    console.log("🔍 Verificando usuários no banco de dados...\n");

    // Verificar quantidade de usuários
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    console.log(`📊 Total de usuários: ${allUsers.length}`);

    if (allUsers.length === 0) {
      console.log("⚠️  Nenhum usuário encontrado no banco de dados!");
      console.log("\n💡 Vamos criar um usuário admin de teste...");

      // Buscar role de ADMIN
      const adminRole = await db.select().from(roles).where((r) => r.name === 'ADMIN').limit(1);

      if (adminRole.length === 0) {
        console.log("❌ Role ADMIN não encontrada! Criando roles...");

        // Criar role ADMIN
        const [newAdminRole] = await db.insert(roles).values({
          name: 'ADMIN',
          description: 'Administrador do sistema',
          permissions: JSON.stringify([
            'CRUD_GLOBAL',
            'VIEW_ALL_TENANTS',
            'MANAGE_USERS',
            'MANAGE_ROLES',
            'VIEW_REPORTS_GLOBAL',
            'MANAGE_WORKSHOPS'
          ])
        }).returning();

        console.log("✅ Role ADMIN criada!");

        // Criar usuário admin
        const [adminUser] = await db.insert(users).values({
          username: 'admin',
          email: 'admin@ruidcar.com',
          password: '$2a$10$YJ0kVGVfH5JHpCy3wfhPJeFwJvbIMwpL5uI/IKwL3K7EEKznEQ4Hy', // senha: admin123
          name: 'Admin RuidCar',
          role: 'user'
        }).returning();

        console.log("✅ Usuário admin criado!");
        console.log("   Email: admin@ruidcar.com");
        console.log("   Senha: admin123");

        // Associar role ao usuário
        await db.insert(userRoles).values({
          userId: adminUser.id,
          roleId: newAdminRole.id
        });

        console.log("✅ Role ADMIN associada ao usuário!");
      }

    } else {
      console.log("\n👤 Usuários encontrados:");
      for (const user of allUsers) {
        console.log(`   - ${user.email} (@${user.username}) - ${user.name}`);

        // Buscar roles do usuário
        const userRolesList = await db.select({
          roleName: roles.name
        })
        .from(userRoles)
        .innerJoin(roles, (r) => r.id === userRoles.roleId)
        .where((ur) => ur.userId === user.id);

        if (userRolesList.length > 0) {
          console.log(`     Roles: ${userRolesList.map(r => r.roleName).join(', ')}`);
        } else {
          console.log(`     Roles: Nenhuma role atribuída`);
        }
      }
    }

    console.log("\n✅ Verificação concluída!");

  } catch (error) {
    console.error("❌ Erro ao verificar usuários:", error);
  } finally {
    process.exit(0);
  }
}

checkUsers();