#!/usr/bin/env node

/**
 * Script de teste backend direto para WhatsApp Lead Send
 */

import { zapiService } from './dist/services/zapi-whatsapp.js';
import { pool } from './dist/db.js';

async function testDirectWhatsAppSend() {
  console.log('🧪 Teste direto do backend - Envio WhatsApp para leads...\n');

  try {
    // 1. Buscar um lead de teste
    console.log('1️⃣  Buscando leads para teste...');
    const leadResult = await pool.query(`
      SELECT id, full_name, email, whatsapp, status
      FROM contact_messages
      WHERE whatsapp IS NOT NULL
      LIMIT 3
    `);

    if (leadResult.rows.length === 0) {
      console.log('❌ Nenhum lead com WhatsApp encontrado');
      return;
    }

    console.log(`✅ ${leadResult.rows.length} leads encontrados:`);
    leadResult.rows.forEach(lead => {
      console.log(`   - ID: ${lead.id}, Nome: ${lead.full_name}, WhatsApp: ${lead.whatsapp}, Status: ${lead.status}`);
    });

    // 2. Preparar mensagens de teste
    const messages = leadResult.rows.map(lead => ({
      leadId: lead.id,
      phone: lead.whatsapp,
      message: `Olá ${lead.full_name}! Esta é uma mensagem de teste do sistema RuidCar. Data: ${new Date().toLocaleString('pt-BR')}`
    }));

    // 3. Enviar mensagens via Z-API
    console.log('\n2️⃣  Enviando mensagens via Z-API...');
    const results = await zapiService.sendBulkMessages(messages);

    console.log('\n3️⃣  Resultados do envio:');
    results.forEach(result => {
      console.log(`   - ${result.phone}: ${result.status} ${result.error ? `(Erro: ${result.error})` : ''}`);
    });

    // 4. Verificar atualização de status
    const successfulSends = results.filter(r => r.status === 'sent');
    if (successfulSends.length > 0) {
      const leadIds = successfulSends.map(r => r.leadId).filter(Boolean);

      console.log('\n4️⃣  Atualizando status dos leads...');
      const updateResult = await pool.query(`
        UPDATE contact_messages
        SET status = 'contato efetuado',
            last_interaction = NOW(),
            interaction_count = interaction_count + 1
        WHERE id = ANY($1) AND status IN ('new', 'qualificado', 'interessado', 'pendente')
        RETURNING id, full_name, status
      `, [leadIds]);

      console.log(`✅ ${updateResult.rowCount} leads atualizados para 'contato efetuado'`);

      if (updateResult.rowCount > 0) {
        console.log('   Leads atualizados:');
        updateResult.rows.forEach(lead => {
          console.log(`   - ID: ${lead.id}, Nome: ${lead.full_name}, Status: ${lead.status}`);
        });
      }
    }

    // 5. Estatísticas finais
    console.log('\n📊 Estatísticas finais:');
    console.log(`   - Total de mensagens: ${results.length}`);
    console.log(`   - Enviadas com sucesso: ${results.filter(r => r.status === 'sent').length}`);
    console.log(`   - Falharam: ${results.filter(r => r.status === 'failed').length}`);

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  } finally {
    // Fechar conexão
    await pool.end();
    process.exit();
  }
}

// Executar teste
testDirectWhatsAppSend();