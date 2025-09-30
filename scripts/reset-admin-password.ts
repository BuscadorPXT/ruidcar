import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

async function resetAdminPassword() {
  try {
    const sql = neon(databaseUrl);
    const db = drizzle(sql);

    // Nova senha para o admin
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha do admin@ruidcar.com
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, 'admin@ruidcar.com'))
      .returning();

    if (result.length > 0) {
      console.log('✅ Senha do admin resetada com sucesso!');
      console.log('📧 Email: admin@ruidcar.com');
      console.log('🔑 Nova senha: Admin@123');
      console.log('\n⚠️  Por segurança, altere esta senha após o primeiro login!');
    } else {
      console.error('❌ Usuário admin@ruidcar.com não encontrado');

      // Criar usuário admin se não existir
      console.log('📝 Criando novo usuário admin...');
      const newAdmin = await db
        .insert(users)
        .values({
          email: 'admin@ruidcar.com',
          password: hashedPassword,
          name: 'Administrador',
        })
        .returning();

      if (newAdmin.length > 0) {
        console.log('✅ Usuário admin criado com sucesso!');
        console.log('📧 Email: admin@ruidcar.com');
        console.log('🔑 Senha: Admin@123');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    process.exit(1);
  }

  process.exit(0);
}

resetAdminPassword();