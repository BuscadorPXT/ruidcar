import fetch from 'node-fetch';

async function testBatchAnalyze() {
  const BASE_URL = 'http://localhost:3000';

  console.log('Testing batch-analyze endpoint...');

  // 1. Get token
  const loginResponse = await fetch(BASE_URL + '/api/auth/unified-login', {
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
  console.log('Token obtained');

  // 2. Test batch-analyze with a few lead IDs
  console.log('Testing batch-analyze with leads 225, 226, 227...');

  const batchResponse = await fetch(BASE_URL + '/api/leads/batch-analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'auth-token=' + token
    },
    body: JSON.stringify({
      leadIds: [225, 226, 227]
    })
  });

  console.log('Status:', batchResponse.status);

  if (batchResponse.ok) {
    const result = await batchResponse.json();
    console.log('Batch analyze successful:');
    console.log('  Analyzed:', result.analyzed);
    console.log('  Total:', result.total);
    console.log('  Errors:', result.errors ? result.errors.length : 0);
  } else {
    const errorData = await batchResponse.text();
    console.log('Batch analyze failed:', errorData);
  }
}

testBatchAnalyze().catch(console.error);
