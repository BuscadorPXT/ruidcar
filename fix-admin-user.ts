import { db } from "./server/db";
import { users, userRoles, roles } from "./shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function fixAdminUser() {
  try {
    console.log("🔧 Corrigindo usuário admin...\n");

    // Primeiro, garantir que as roles existem
    const adminRole = await db.select().from(roles).where(eq(roles.name, 'ADMIN'));

    let adminRoleId: number;

    if (adminRole.length === 0) {
      console.log("📝 Criando role ADMIN...");
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
      adminRoleId = newAdminRole.id;
      console.log("✅ Role ADMIN criada!");
    } else {
      adminRoleId = adminRole[0].id;
      console.log("✅ Role ADMIN já existe!");
    }

    // Criar outras roles se não existirem
    const oficinaRole = await db.select().from(roles).where(eq(roles.name, 'OFICINA_OWNER'));
    if (oficinaRole.length === 0) {
      await db.insert(roles).values({
        name: 'OFICINA_OWNER',
        description: 'Proprietário de oficina',
        permissions: JSON.stringify([
          'CRUD_ORGANIZATION',
          'MANAGE_APPOINTMENTS',
          'MANAGE_SERVICES',
          'VIEW_REPORTS_ORG',
          'MANAGE_TEAM'
        ])
      });
      console.log("✅ Role OFICINA_OWNER criada!");
    }

    const clienteRole = await db.select().from(roles).where(eq(roles.name, 'CLIENTE'));
    if (clienteRole.length === 0) {
      await db.insert(roles).values({
        name: 'CLIENTE',
        description: 'Cliente',
        permissions: JSON.stringify([
          'VIEW_MY_APPOINTMENTS',
          'CREATE_APPOINTMENTS',
          'APPROVE_BUDGETS',
          'UPLOAD_PHOTOS',
          'CHAT_WORKSHOP'
        ])
      });
      console.log("✅ Role CLIENTE criada!");
    }

    // Buscar o usuário admin@ruidcar.com
    const adminUser = await db.select().from(users).where(eq(users.email, 'admin@ruidcar.com'));

    if (adminUser.length === 0) {
      console.log("❌ Usuário admin@ruidcar.com não encontrado. Criando...");

      const hashedPassword = await bcrypt.hash('admin123', 10);

      const [newUser] = await db.insert(users).values({
        username: 'admin',
        email: 'admin@ruidcar.com',
        password: hashedPassword,
        name: 'Admin RuidCar',
        role: 'user'
      }).returning();

      // Associar role ADMIN
      await db.insert(userRoles).values({
        userId: newUser.id,
        roleId: adminRoleId
      });

      console.log("✅ Usuário admin criado e ativado!");
      console.log("📧 Email: admin@ruidcar.com");
      console.log("🔑 Senha: admin123");

    } else {
      console.log("📝 Atualizando usuário admin@ruidcar.com...");

      // Atualizar o usuário para ativo e adicionar nome
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await db.update(users)
        .set({
          username: adminUser[0].username || 'admin',
          name: 'Admin RuidCar',
          password: hashedPassword,
          role: 'user'
        })
        .where(eq(users.id, adminUser[0].id));

      console.log("✅ Usuário atualizado!");

      // Verificar se já tem role ADMIN
      const existingRole = await db.select()
        .from(userRoles)
        .where(eq(userRoles.userId, adminUser[0].id));

      if (existingRole.length === 0) {
        // Associar role ADMIN
        await db.insert(userRoles).values({
          userId: adminUser[0].id,
          roleId: adminRoleId
        });
        console.log("✅ Role ADMIN associada!");
      } else {
        console.log("✅ Usuário já tem role associada!");
      }

      console.log("\n📧 Email: admin@ruidcar.com");
      console.log("🔑 Senha: admin123");
    }

    // Criar usuário de teste se não existir
    const testUser = await db.select().from(users).where(eq(users.email, 'teste@ruidcar.com'));

    if (testUser.length === 0) {
      console.log("\n📝 Criando usuário de teste...");

      const hashedPassword = await bcrypt.hash('teste123', 10);

      const [newTestUser] = await db.insert(users).values({
        username: 'teste',
        email: 'teste@ruidcar.com',
        password: hashedPassword,
        name: 'Usuário Teste',
        role: 'user'
      }).returning();

      // Buscar role CLIENTE
      const clienteRoleData = await db.select().from(roles).where(eq(roles.name, 'CLIENTE'));

      if (clienteRoleData.length > 0) {
        await db.insert(userRoles).values({
          userId: newTestUser.id,
          roleId: clienteRoleData[0].id
        });
      }

      console.log("✅ Usuário de teste criado!");
      console.log("📧 Email: teste@ruidcar.com");
      console.log("🔑 Senha: teste123");
    }

    console.log("\n✅ Correção concluída com sucesso!");
    console.log("\n🎯 Agora você pode:");
    console.log("   1. Fazer login em /login");
    console.log("   2. Acessar o painel admin em /admin");
    console.log("   3. Ver todos os usuários em /admin/users");

  } catch (error) {
    console.error("❌ Erro ao corrigir usuário admin:", error);
  } finally {
    process.exit(0);
  }
}

fixAdminUser();