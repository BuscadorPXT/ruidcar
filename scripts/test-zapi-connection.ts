#!/usr/bin/env npx tsx

import { zapiService } from '../server/services/zapi-whatsapp';

async function testZAPIConnection() {
  console.log('🚀 Iniciando teste de conectividade Z-API...\n');

  try {
    // Teste 1: Verificar status da instância
    console.log('1️⃣ Testando status da instância...');
    const status = await zapiService.getInstanceStatus();
    console.log('   Status:', status);

    if (!status.connected) {
      console.log('❌ Instância não está conectada!');
      console.log('   Certifique-se de que o WhatsApp está conectado na instância Z-API');
      process.exit(1);
    }

    console.log('✅ Instância conectada com sucesso!');
    if (status.phone) {
      console.log(`📱 Número conectado: ${status.phone}`);
    }

    // Teste 2: Testar conectividade geral
    console.log('\n2️⃣ Testando conectividade geral...');
    const connectionTest = await zapiService.testConnection();
    console.log('   Resultado:', connectionTest);

    if (!connectionTest.connected) {
      console.log('❌ Falha na conectividade geral');
      console.log('   Erro:', connectionTest.error);
      process.exit(1);
    }

    console.log('✅ Conectividade geral OK!');

    // Teste 3: Configurar webhooks (opcional)
    console.log('\n3️⃣ Configurando webhooks...');
    try {
      const webhookUrl = process.env.APP_URL
        ? `${process.env.APP_URL}/api/whatsapp/webhook`
        : 'https://seu-dominio.com/api/whatsapp/webhook';

      console.log(`   Webhook URL: ${webhookUrl}`);

      const webhookResult = await zapiService.setupWebhook(webhookUrl);
      console.log('   Resultado:', webhookResult);
      console.log('✅ Webhooks configurados!');
    } catch (webhookError) {
      console.log('⚠️  Aviso: Erro ao configurar webhooks (não crítico)');
      console.log('   Erro:', webhookError.message);
    }

    // Teste 4: Prompt para envio de mensagem de teste
    console.log('\n4️⃣ Teste de envio de mensagem');
    console.log('   Para testar o envio, execute:');
    console.log(`   curl -X POST http://localhost:3000/api/whatsapp/test-message \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -H "Authorization: Bearer SEU_TOKEN" \\`);
    console.log(`        -d '{"phone":"5511999999999"}'`);

    console.log('\n🎉 Todos os testes passaram com sucesso!');
    console.log('📋 Resumo da configuração:');
    console.log(`   • Instance ID: ${process.env.ZAPI_INSTANCE_ID || '3E3EFBCA3E13C17E04F83E61E96978DB'}`);
    console.log(`   • Token: ${(process.env.ZAPI_TOKEN || '91D06F6734B2549D951518BE').substring(0, 8)}...`);
    console.log(`   • Status: ${status.connected ? '🟢 Conectado' : '🔴 Desconectado'}`);
    console.log(`   • Telefone: ${connectionTest.phone || 'N/A'}`);

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.log('\n🔧 Verificações sugeridas:');
    console.log('1. Confirme se as variáveis de ambiente estão corretas:');
    console.log('   - ZAPI_INSTANCE_ID=3E3EFBCA3E13C17E04F83E61E96978DB');
    console.log('   - ZAPI_TOKEN=91D06F6734B2549D951518BE');
    console.log('   - ZAPI_BASE_URL=https://api.z-api.io');
    console.log('2. Verifique se a instância Z-API está ativa no dashboard');
    console.log('3. Confirme se o WhatsApp Web está conectado na instância');
    console.log('4. Teste a URL diretamente no navegador ou curl');

    process.exit(1);
  }
}

// Função para testar endpoints específicos
async function testEndpoint(endpoint: string, method: string = 'GET', body?: any) {
  const instanceId = process.env.ZAPI_INSTANCE_ID || '3E3EFBCA3E13C17E04F83E61E96978DB';
  const token = process.env.ZAPI_TOKEN || '91D06F6734B2549D951518BE';
  const baseUrl = process.env.ZAPI_BASE_URL || 'https://api.z-api.io';

  const url = `${baseUrl}/instances/${instanceId}/token/${token}/${endpoint}`;

  console.log(`Testando: ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', result);

    return { success: response.ok, data: result };
  } catch (error) {
    console.log('Erro:', error.message);
    return { success: false, error: error.message };
  }
}

// Função para diagnóstico detalhado
async function detailedDiagnostic() {
  console.log('🔍 Executando diagnóstico detalhado...\n');

  const tests = [
    { name: 'Status da instância', endpoint: 'status' },
    { name: 'Informações da instância', endpoint: 'instance-info' },
    { name: 'Lista de chats', endpoint: 'list-chats' },
  ];

  for (const test of tests) {
    console.log(`\n📋 ${test.name}:`);
    await testEndpoint(test.endpoint);
  }
}

// Executar baseado em argumentos
if (process.argv.includes('--detailed')) {
  detailedDiagnostic();
} else if (process.argv.includes('--endpoint')) {
  const endpointIndex = process.argv.indexOf('--endpoint');
  const endpoint = process.argv[endpointIndex + 1];
  if (endpoint) {
    testEndpoint(endpoint);
  } else {
    console.log('❌ Especifique o endpoint após --endpoint');
  }
} else {
  testZAPIConnection();
}

export { testZAPIConnection, testEndpoint, detailedDiagnostic };