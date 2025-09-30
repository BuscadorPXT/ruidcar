import fetch from 'node-fetch';

async function testSystem() {
  const BASE_URL = 'http://localhost:3000';

  console.log('========================================');
  console.log('   TESTE COMPLETO DO SISTEMA DE IA');
  console.log('========================================\n');

  // 1. Obter token de autenticação
  console.log('1. AUTENTICAÇÃO');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/unified-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@ruidcar.com',
      password: 'admin123',
      intent: 'admin'
    })
  });

  const loginData = await loginResponse.json();
  const token = loginData.token;

  if (!token) {
    console.error('❌ Falha ao obter token:', loginData);
    return;
  }

  console.log('✓ Token obtido com sucesso');
  console.log('  Token:', token.substring(0, 50) + '...\n');

  // 2. Testar endpoint de estatísticas de IA
  console.log('2. TESTE DE ENDPOINTS');
  console.log('   2.1 Estatísticas de IA');

  const aiStatsResponse = await fetch(`${BASE_URL}/api/leads/ai-stats`, {
    headers: {
      'Cookie': `auth-token=${token}`
    }
  });

  if (aiStatsResponse.ok) {
    const aiStats = await aiStatsResponse.json();
    console.log('   ✓ Status:', aiStatsResponse.status);
    console.log('   ✓ Dados:', JSON.stringify(aiStats, null, 2));
  } else {
    const errorData = await aiStatsResponse.text();
    console.log('   ❌ Erro:', aiStatsResponse.status, errorData);
  }

  // 3. Testar endpoint de estatísticas geográficas
  console.log('\n   2.2 Estatísticas Geográficas');

  const geoStatsResponse = await fetch(`${BASE_URL}/api/leads/geographic-stats`, {
    headers: {
      'Cookie': `auth-token=${token}`
    }
  });

  if (geoStatsResponse.ok) {
    const geoStats = await geoStatsResponse.json();
    console.log('   ✓ Status:', geoStatsResponse.status);
    console.log('   ✓ Dados:', JSON.stringify(geoStats, null, 2));
  } else {
    const errorData = await geoStatsResponse.text();
    console.log('   ❌ Erro:', geoStatsResponse.status, errorData);
  }

  // 4. Testar análise de lead (com fallback)
  console.log('\n3. TESTE DE ANÁLISE DE LEAD');

  // Primeiro, buscar um lead existente
  const leadsResponse = await fetch(`${BASE_URL}/api/leads/intelligence?limit=1`, {
    headers: {
      'Cookie': `auth-token=${token}`
    }
  });

  if (leadsResponse.ok) {
    const leadsData = await leadsResponse.json();

    if (leadsData.leads && leadsData.leads.length > 0) {
      const leadId = leadsData.leads[0].id;
      console.log(`   Analisando lead ID: ${leadId}`);

      const analyzeResponse = await fetch(`${BASE_URL}/api/leads/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        body: JSON.stringify({
          leadId: leadId,
          includeAI: true
        })
      });

      if (analyzeResponse.ok) {
        const analysis = await analyzeResponse.json();
        console.log('   ✓ Lead analisado com sucesso');
        console.log('   Score:', analysis.leadScore);
        console.log('   Temperatura:', analysis.leadTemperature);
        console.log('   Taxa de conversão:', analysis.predictedConversionRate);
      } else {
        const errorData = await analyzeResponse.text();
        console.log('   ❌ Erro na análise:', analyzeResponse.status, errorData);
      }
    } else {
      console.log('   ⚠ Nenhum lead encontrado para análise');
    }
  }

  // 5. Testar serviço de geo-inteligência
  console.log('\n4. TESTE DE GEO-INTELIGÊNCIA');

  try {
    const { geoIntelligence } = await import('./dist/services/geo-intelligence.js').catch(() => {
      // Se falhar, tenta importar do servidor
      return { geoIntelligence: null };
    });

    if (geoIntelligence) {
      const testNumbers = [
        '(11) 98765-4321',
        '(21) 91234-5678',
        '+351912345678'
      ];

      testNumbers.forEach(phone => {
        const geoData = geoIntelligence.extractGeoData(phone);
        console.log(`   Número: ${phone}`);
        console.log(`   Dados:`, geoData);
      });
    } else {
      console.log('   ⚠ Serviço de geo-inteligência não disponível');
    }
  } catch (error) {
    console.log('   ⚠ Erro ao testar geo-inteligência:', error.message);
  }

  console.log('\n========================================');
  console.log('         TESTE CONCLUÍDO');
  console.log('========================================');
}

// Executar teste
testSystem().catch(console.error);