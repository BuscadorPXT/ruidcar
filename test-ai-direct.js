import { geminiAnalyzer } from './dist/services/gemini-ai.js';

console.log('Testing AI analysis directly...\n');

const testLead = {
  fullName: 'João Silva',
  email: 'joao@example.com',
  phone: '(11) 98765-4321',
  company: 'Tech Solutions',
  message: 'Preciso de isolamento acústico para meu carro',
  businessType: 'Automotive',
  country: 'Brasil',
  city: 'São Paulo',
  state: 'SP'
};

try {
  const result = await geminiAnalyzer.analyzeLead(testLead);
  console.log('AI Analysis Result:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}
