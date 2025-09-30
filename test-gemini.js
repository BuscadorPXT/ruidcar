import { GoogleGenerativeAI } from '@google/generative-ai';

// Configurar API
const genAI = new GoogleGenerativeAI('AIzaSyCDnx9BHDhMsUTjIg2gaqUnCKxmfEr2mOM');

async function testGeminiAPI() {
    console.log('===================================');
    console.log('   TESTE DA API DO GOOGLE GEMINI   ');
    console.log('===================================\n');

    try {
        // Obter o modelo
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

        // Teste simples
        console.log('1. Teste de conexão com API...');
        const prompt = 'Responda em uma linha: Qual a capital do Brasil?';
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✓ Resposta recebida:', text.trim());

        // Teste de análise de lead
        console.log('\n2. Teste de análise de lead...');
        const leadPrompt = `
            Analise este lead e responda APENAS com JSON (sem texto adicional):
            Nome: João Silva
            Telefone: (11) 98765-4321
            Mensagem: Preciso de orçamento urgente para isolamento acústico

            Retorne JSON com:
            {"score": 0-100, "temperature": "hot|warm|cold", "intent": "purchase|inquiry|other"}
        `;

        const leadResult = await model.generateContent(leadPrompt);
        const leadResponse = await leadResult.response;
        const leadText = leadResponse.text();

        // Tentar extrair JSON da resposta
        const jsonMatch = leadText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const leadAnalysis = JSON.parse(jsonMatch[0]);
            console.log('✓ Análise do lead:');
            console.log('  Score:', leadAnalysis.score);
            console.log('  Temperatura:', leadAnalysis.temperature);
            console.log('  Intent:', leadAnalysis.intent);
        } else {
            console.log('⚠ Resposta não contém JSON válido:', leadText);
        }

        console.log('\n✅ Teste concluído com sucesso!');
        console.log('A API do Gemini está funcionando corretamente.\n');

    } catch (error) {
        console.error('\n❌ Erro no teste:', error.message);

        if (error.message.includes('API key')) {
            console.log('⚠ Problema com a API Key');
        } else if (error.message.includes('quota')) {
            console.log('⚠ Limite de quota excedido');
        } else if (error.message.includes('network')) {
            console.log('⚠ Problema de conexão com a API');
        }
    }
}

// Executar teste
testGeminiAPI();