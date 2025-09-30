import { db } from "./server/db";
import { users, userRoles, roles, workshops } from "./shared/schema";
import { sql, desc, eq } from "drizzle-orm";

async function testAPI() {
  try {
    console.log("🔍 Testando consulta da API de usuários...\n");

    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      name: users.name,
      company: users.company,
      createdAt: users.createdAt,
      roles: sql<string>`
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'roleId', ${userRoles.roleId},
              'roleName', ${roles.name},
              'organizationId', ${userRoles.organizationId}
            )
          ) FILTER (WHERE ${userRoles.roleId} IS NOT NULL),
          '[]'::json
        )
      `,
      workshops: sql<string>`
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ${workshops.id},
              'name', ${workshops.companyName},
              'status', ${workshops.status},
              'active', ${workshops.active}
            )
          ) FILTER (WHERE ${workshops.id} IS NOT NULL),
          '[]'::json
        )
      `
    })
    .from(users)
    .leftJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .leftJoin(workshops, eq(users.id, workshops.ownerId))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

    console.log(`📊 Total de usuários retornados: ${allUsers.length}\n`);

    if (allUsers.length > 0) {
      console.log("📋 Dados dos usuários:");
      for (const user of allUsers) {
        console.log("\n-------------------");
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Username: ${user.username}`);
        console.log(`Name: ${user.name}`);
        console.log(`Company: ${user.company}`);
        console.log(`Roles: ${user.roles}`);
        console.log(`Workshops: ${user.workshops}`);
      }

      console.log("\n\n📝 JSON Response (como seria retornado pela API):");
      console.log(JSON.stringify(allUsers, null, 2));
    } else {
      console.log("⚠️ Nenhum usuário retornado!");
    }

  } catch (error) {
    console.error("❌ Erro na consulta:", error);
  } finally {
    process.exit(0);
  }
}

testAPI();