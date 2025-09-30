#!/usr/bin/env node

/**
 * Script de teste para envio de mensagem WhatsApp para leads
 */

async function testWhatsAppLeadSend() {
  console.log('🧪 Iniciando teste de envio WhatsApp para leads...');

  try {
    // Simular dados de teste
    const testData = {
      messages: [
        {
          leadId: 1,
          phone: '5511999999999',  // Número de teste
          message: 'Teste de mensagem automática RuidCar - ' + new Date().toLocaleString('pt-BR')
        }
      ],
      templateId: 1
    };

    console.log('📤 Enviando para API:', testData);

    const response = await fetch('http://localhost:3000/api/whatsapp/send-bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVzIjpbIkFETUlOIl0sImlhdCI6MTczNTY3MzQ0NCwiZXhwIjoxNzM2NTM3NDQ0fQ.J_RX-qzJ7f_V6jUOZBQ5V8WPW2kczELdRcOcP8r-Qfc'  // Token de admin
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Status da resposta:', response.status);

    const result = await response.json();
    console.log('✅ Resposta da API:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✨ Teste concluído com sucesso!');
      console.log(`📊 Estatísticas:
  - Total: ${result.stats?.total || 0}
  - Enviadas: ${result.stats?.sent || 0}
  - Falharam: ${result.stats?.failed || 0}`);
    } else {
      console.error('❌ Teste falhou:', result.error);
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

// Executar teste
testWhatsAppLeadSend();