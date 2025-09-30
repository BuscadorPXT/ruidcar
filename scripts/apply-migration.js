import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_bdaE9x2yiYWL@ep-delicate-pine-a4eh947l.us-east-1.aws.neon.tech/neondb?sslmode=require';

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔗 Conectando ao banco de dados...');
    await client.connect();

    // Ler arquivo de migration
    const migrationPath = path.join(__dirname, '..', 'migrations', '0002_diagnostic_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Aplicando migration: Sistema de Diagnóstico RuidCar...');

    // Executar migration
    await client.query(migrationSQL);

    console.log('✅ Migration aplicada com sucesso!');

    // Verificar as tabelas criadas
    const checkTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'diagnostic_service_config',
        'vehicle_pricing',
        'appointment_slots',
        'appointment_exceptions',
        'appointment_settings'
      )
      ORDER BY table_name;
    `;

    const result = await client.query(checkTablesQuery);

    console.log('\n📊 Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Verificar colunas adicionadas em appointments
    const checkColumnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND column_name IN (
        'vehicle_category',
        'final_price',
        'check_in_time',
        'check_out_time',
        'service_rating',
        'customer_consent',
        'reminder_sent_at',
        'cancelled_by',
        'cancellation_reason'
      )
      ORDER BY column_name;
    `;

    const columnsResult = await client.query(checkColumnsQuery);

    console.log('\n📋 Colunas adicionadas em appointments:');
    columnsResult.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);

    // Se houver erro de sintaxe ou outro erro SQL, mostrar detalhes
    if (error.detail) {
      console.error('   Detalhe:', error.detail);
    }
    if (error.position) {
      console.error('   Posição:', error.position);
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar
applyMigration();