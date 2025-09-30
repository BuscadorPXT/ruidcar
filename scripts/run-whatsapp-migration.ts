#!/usr/bin/env npx tsx

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runWhatsAppMigration() {
  console.log('🚀 Executando migração WhatsApp Z-API...\n');

  try {
    // Ler arquivo de migração
    const migrationPath = join(__dirname, '..', 'migrations', '0011_whatsapp_zapi_integration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migração carregada:', migrationPath);
    console.log('📊 Tamanho do arquivo:', migrationSQL.length, 'caracteres');

    // Executar migração
    console.log('\n⚙️  Executando SQL...');
    await pool.query(migrationSQL);

    console.log('✅ Migração executada com sucesso!');

    // Verificar tabelas criadas
    console.log('\n🔍 Verificando tabelas criadas...');

    const tables = [
      'whatsapp_messages',
      'whatsapp_templates',
      'zapi_instances',
      'zapi_webhooks'
    ];

    for (const table of tables) {
      try {
        const result = await pool.query(`
          SELECT COUNT(*) as count,
                 (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = $1) as columns
          FROM ${table}
        `, [table]);

        console.log(`   📋 ${table}: ${result.rows[0].count} registros, ${result.rows[0].columns} colunas`);
      } catch (error) {
        console.log(`   ❌ ${table}: Erro - ${error.message}`);
      }
    }

    // Verificar templates inseridos
    console.log('\n📝 Templates WhatsApp criados:');
    const templatesResult = await pool.query('SELECT name, business_type FROM whatsapp_templates ORDER BY name');

    templatesResult.rows.forEach(template => {
      const type = template.business_type || 'Geral';
      console.log(`   • ${template.name} (${type})`);
    });

    // Verificar instância Z-API
    console.log('\n📱 Instância Z-API configurada:');
    const instanceResult = await pool.query('SELECT * FROM zapi_instances WHERE is_active = true LIMIT 1');

    if (instanceResult.rows.length > 0) {
      const instance = instanceResult.rows[0];
      console.log(`   • Nome: ${instance.name}`);
      console.log(`   • Instance ID: ${instance.instance_id}`);
      console.log(`   • Status: ${instance.status}`);
      console.log(`   • Limite diário: ${instance.daily_limit}`);
    } else {
      console.log('   ❌ Nenhuma instância ativa encontrada');
    }

    console.log('\n🎉 Migração WhatsApp concluída com sucesso!');
    console.log('\nPróximos passos:');
    console.log('1. Execute: npm run test-zapi para validar conectividade');
    console.log('2. Configure as variáveis de ambiente no .env:');
    console.log('   ZAPI_INSTANCE_ID=3E3EFBCA3E13C17E04F83E61E96978DB');
    console.log('   ZAPI_TOKEN=91D06F6734B2549D951518BE');
    console.log('   ZAPI_BASE_URL=https://api.z-api.io');
    console.log('3. Reinicie o servidor para carregar as novas rotas');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);

    if (error.code === '42P07') {
      console.log('\n💡 As tabelas já existem. Migração pode ter sido executada anteriormente.');
      console.log('   Para forçar re-execução, remova as tabelas manualmente primeiro.');
    } else if (error.code === '42703') {
      console.log('\n💡 Erro de coluna. Verifique se todas as tabelas de referência existem.');
    } else {
      console.log('\n🔧 Possíveis soluções:');
      console.log('1. Verifique se o banco de dados está acessível');
      console.log('2. Confirme se as tabelas de referência (users, contact_messages) existem');
      console.log('3. Execute as migrações anteriores se necessário');
    }

    process.exit(1);
  } finally {
    // Fechar conexão
    await pool.end();
  }
}

// Executar automaticamente quando o script é chamado
runWhatsAppMigration();

export { runWhatsAppMigration };