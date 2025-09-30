import fetch from 'node-fetch';

async function analyzeFirstLead() {
  const BASE_URL = 'http://localhost:3000';

  // 1. Get token
  console.log('Getting auth token...');
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
  console.log('Token obtained:', token.substring(0, 30) + '...');

  // 2. Get a lead to analyze
  console.log('\nFetching leads...');
  const leadsResponse = await fetch(`${BASE_URL}/api/leads/intelligence?limit=5`, {
    headers: {
      'Cookie': `auth-token=${token}`
    }
  });

  if (!leadsResponse.ok) {
    console.error('Failed to fetch leads:', leadsResponse.status);
    return;
  }

  const leadsData = await leadsResponse.json();
  console.log(`Found ${leadsData.leads.length} leads`);

  // 3. Analyze each lead
  for (const lead of leadsData.leads) {
    console.log(`\nAnalyzing lead ${lead.id} - ${lead.fullName}...`);
    
    const analyzeResponse = await fetch(`${BASE_URL}/api/leads/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${token}`
      },
      body: JSON.stringify({
        leadId: lead.id,
        includeAI: true
      })
    });

    if (analyzeResponse.ok) {
      const result = await analyzeResponse.json();
      console.log(`✓ Lead ${lead.id} analyzed:`);
      console.log(`  Score: ${result.leadScore}`);
      console.log(`  Temperature: ${result.leadTemperature}`);
      console.log(`  Conversion Rate: ${result.predictedConversionRate}`);
      console.log(`  Estado: ${result.estado || 'N/A'}`);
      console.log(`  País: ${result.pais || 'N/A'}`);
    } else {
      console.error(`✗ Failed to analyze lead ${lead.id}:`, analyzeResponse.status);
    }
  }

  console.log('\n✅ Analysis complete!');
}

analyzeFirstLead().catch(console.error);
