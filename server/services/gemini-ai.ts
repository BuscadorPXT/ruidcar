import { GoogleGenerativeAI } from '@google/generative-ai';

export interface LeadInput {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  businessType?: string;
  country?: string;
  city?: string;
  state?: string;
  tags?: string[];
  history?: string[];
}

export interface Intent {
  primary: 'purchase' | 'inquiry' | 'support' | 'complaint' | 'other';
  confidence: number;
  keywords: string[];
}

export interface Sentiment {
  score: number;
  label: 'positive' | 'neutral' | 'negative';
}

export interface CustomerProfile {
  type: 'individual' | 'business';
  segment: 'premium' | 'standard' | 'budget';
  industry?: string;
}

export interface LeadAnalysis {
  intent: Intent;
  sentiment: Sentiment;
  productInterest: Array<{
    product: string;
    confidence: number;
  }>;
  urgencyLevel: 'high' | 'medium' | 'low';
  bestContactTime: {
    day: 'weekday' | 'weekend' | 'any';
    period: 'morning' | 'afternoon' | 'evening' | 'any';
  };
  communicationPreference: 'whatsapp' | 'email' | 'phone' | 'any';
  language: string;
  customerProfile: CustomerProfile;
  suggestedActions: string[];
  conversionProbability: number;
  leadScore: number;
  temperature: 'hot' | 'warm' | 'cold';
}

export class GeminiLeadAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCDnx9BHDhMsUTjIg2gaqUnCKxmfEr2mOM';
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Usando gemini-1.5-flash que é o modelo atual disponível
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Analisa um lead usando IA
   */
  async analyzeLead(leadData: LeadInput): Promise<LeadAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(leadData);

      // Tentar com timeout e retry
      let attempts = 0;
      const maxAttempts = 2;
      let lastError: any;

      while (attempts < maxAttempts) {
        try {
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          return this.parseAIResponse(text, leadData);
        } catch (error: any) {
          lastError = error;
          attempts++;

          // Se for erro de modelo, tentar com modelo alternativo
          if (error.message?.includes('model') && attempts === 1) {
            try {
              // Tentar com modelo alternativo
              this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            } catch {
              // Se falhar, manter o modelo atual
            }
          }

          // Aguardar antes de tentar novamente
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      throw lastError;
    } catch (error: any) {
      console.error('Erro ao analisar lead com Gemini:', error.message || error);

      // Log detalhado do erro para debugging
      if (error.message?.includes('API key')) {
        console.error('Problema com API Key do Gemini');
      } else if (error.message?.includes('quota')) {
        console.error('Quota excedida na API do Gemini');
      } else if (error.message?.includes('model')) {
        console.error('Modelo do Gemini não disponível');
      }

      // Retorna análise padrão em caso de erro
      return this.getDefaultAnalysis(leadData);
    }
  }

  /**
   * Constrói o prompt para análise do lead
   */
  private buildAnalysisPrompt(leadData: LeadInput): string {
    return `
      Você é um especialista em análise de leads para uma empresa de isolamento acústico automotivo (RuidCar).
      Analise os seguintes dados do lead e forneça uma análise detalhada:

      DADOS DO LEAD:
      Nome: ${leadData.fullName}
      Email: ${leadData.email}
      Telefone: ${leadData.phone || 'Não informado'}
      Empresa: ${leadData.company || 'Não informada'}
      Tipo de Negócio: ${leadData.businessType || 'Não informado'}
      Localização: ${[leadData.city, leadData.state, leadData.country].filter(Boolean).join(', ') || 'Não informada'}
      Mensagem: ${leadData.message || 'Sem mensagem'}
      Tags: ${leadData.tags?.join(', ') || 'Sem tags'}

      Por favor, analise e responda no formato JSON com a seguinte estrutura:
      {
        "intent": {
          "primary": "purchase|inquiry|support|complaint|other",
          "confidence": 0.0-1.0,
          "keywords": ["palavra1", "palavra2"]
        },
        "sentiment": {
          "score": -1.0 a 1.0,
          "label": "positive|neutral|negative"
        },
        "productInterest": [
          {
            "product": "nome do produto",
            "confidence": 0.0-1.0
          }
        ],
        "urgencyLevel": "high|medium|low",
        "bestContactTime": {
          "day": "weekday|weekend|any",
          "period": "morning|afternoon|evening|any"
        },
        "communicationPreference": "whatsapp|email|phone|any",
        "language": "pt-BR",
        "customerProfile": {
          "type": "individual|business",
          "segment": "premium|standard|budget",
          "industry": "automotive|residential|commercial"
        },
        "suggestedActions": [
          "Ação 1",
          "Ação 2",
          "Ação 3"
        ],
        "conversionProbability": 0.0-1.0,
        "leadScore": 0-100,
        "temperature": "hot|warm|cold"
      }

      IMPORTANTE:
      - Responda APENAS com o JSON, sem texto adicional
      - Base sua análise no contexto de isolamento acústico automotivo
      - Considere a qualidade das informações fornecidas
      - Sugira ações práticas e específicas
    `;
  }

  /**
   * Parseia a resposta da IA
   */
  private parseAIResponse(text: string, leadData: LeadInput): LeadAnalysis {
    try {
      // Tenta extrair JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Valida e ajusta os valores
      return {
        intent: {
          primary: parsed.intent?.primary || 'inquiry',
          confidence: Math.max(0, Math.min(1, parsed.intent?.confidence || 0.5)),
          keywords: parsed.intent?.keywords || []
        },
        sentiment: {
          score: Math.max(-1, Math.min(1, parsed.sentiment?.score || 0)),
          label: parsed.sentiment?.label || 'neutral'
        },
        productInterest: parsed.productInterest || [],
        urgencyLevel: parsed.urgencyLevel || 'medium',
        bestContactTime: parsed.bestContactTime || { day: 'any', period: 'any' },
        communicationPreference: parsed.communicationPreference || 'any',
        language: parsed.language || 'pt-BR',
        customerProfile: parsed.customerProfile || { type: 'individual', segment: 'standard' },
        suggestedActions: parsed.suggestedActions || this.getDefaultSuggestions(leadData),
        conversionProbability: Math.max(0, Math.min(1, parsed.conversionProbability || 0.5)),
        leadScore: Math.max(0, Math.min(100, parsed.leadScore || 50)),
        temperature: parsed.temperature || 'warm'
      };
    } catch (error) {
      console.error('Erro ao parsear resposta da IA:', error);
      return this.getDefaultAnalysis(leadData);
    }
  }

  /**
   * Retorna uma análise padrão quando a IA falha
   * Sistema de fallback inteligente baseado em regras
   */
  private getDefaultAnalysis(leadData: LeadInput): LeadAnalysis {
    const hasPhone = !!leadData.phone;
    const hasMessage = !!leadData.message && leadData.message.length > 20;
    const hasCompany = !!leadData.company;
    const hasCity = !!leadData.city;
    const hasState = !!leadData.state;

    // Sistema de pontuação mais sofisticado
    let score = 30; // Base score

    // Pontuação por completude de dados
    if (hasPhone) score += 25; // Telefone é crucial
    if (hasMessage && leadData.message!.length > 50) score += 20;
    else if (hasMessage) score += 10;
    if (hasCompany) score += 15;
    if (hasCity && hasState) score += 10;

    // Análise de intent baseada em palavras-chave
    let intent: Intent['primary'] = 'inquiry';
    let urgencyLevel: 'high' | 'medium' | 'low' = 'medium';
    const keywords: string[] = [];

    if (leadData.message) {
      const lowerMessage = leadData.message.toLowerCase();

      // Detectar intenção de compra
      const purchaseWords = ['orçamento', 'preço', 'comprar', 'valor', 'quanto custa', 'pagamento'];
      const urgentWords = ['urgente', 'rápido', 'hoje', 'amanhã', 'imediato', 'preciso'];
      const inquiryWords = ['informação', 'saber', 'como', 'quando', 'onde'];

      if (purchaseWords.some(word => lowerMessage.includes(word))) {
        intent = 'purchase';
        score += 10;
        keywords.push(...purchaseWords.filter(word => lowerMessage.includes(word)));
      } else if (inquiryWords.some(word => lowerMessage.includes(word))) {
        intent = 'inquiry';
        keywords.push(...inquiryWords.filter(word => lowerMessage.includes(word)));
      }

      if (urgentWords.some(word => lowerMessage.includes(word))) {
        urgencyLevel = 'high';
        score += 5;
        keywords.push(...urgentWords.filter(word => lowerMessage.includes(word)));
      }
    }

    // Determinar temperatura baseada no score final
    const temperature = score >= 75 ? 'hot' : score >= 50 ? 'warm' : 'cold';

    // Análise de sentimento básica
    let sentimentScore = 0;
    if (leadData.message) {
      const positiveWords = ['ótimo', 'excelente', 'bom', 'quero', 'preciso', 'interesse'];
      const negativeWords = ['ruim', 'problema', 'reclamação', 'insatisfeito'];

      positiveWords.forEach(word => {
        if (leadData.message!.toLowerCase().includes(word)) sentimentScore += 0.2;
      });

      negativeWords.forEach(word => {
        if (leadData.message!.toLowerCase().includes(word)) sentimentScore -= 0.3;
      });
    }

    // Determinar melhor horário de contato baseado no tipo de negócio
    const bestContactTime = {
      day: hasCompany ? 'weekday' as const : 'any' as const,
      period: hasCompany ? 'morning' as const : 'afternoon' as const
    };

    // Preferência de comunicação inteligente
    let communicationPreference: 'whatsapp' | 'email' | 'phone' | 'any' = 'email';
    if (hasPhone && leadData.phone!.includes('9')) {
      communicationPreference = 'whatsapp'; // Celular com 9 dígitos
    } else if (hasPhone) {
      communicationPreference = 'phone';
    }

    return {
      intent: {
        primary: intent,
        confidence: 0.7,
        keywords
      },
      sentiment: {
        score: Math.max(-1, Math.min(1, sentimentScore)),
        label: sentimentScore > 0.2 ? 'positive' : sentimentScore < -0.2 ? 'negative' : 'neutral'
      },
      productInterest: [
        {
          product: 'Isolamento Acústico Automotivo',
          confidence: intent === 'purchase' ? 0.8 : 0.5
        }
      ],
      urgencyLevel,
      bestContactTime,
      communicationPreference,
      language: 'pt-BR',
      customerProfile: {
        type: hasCompany ? 'business' : 'individual',
        segment: score >= 70 ? 'premium' : score >= 50 ? 'standard' : 'budget'
      },
      suggestedActions: this.getDefaultSuggestions(leadData),
      conversionProbability: Math.min(0.95, score / 100),
      leadScore: Math.min(100, score),
      temperature
    };
  }

  /**
   * Gera sugestões padrão baseadas nos dados do lead
   */
  private getDefaultSuggestions(leadData: LeadInput): string[] {
    const suggestions: string[] = [];

    if (leadData.phone) {
      suggestions.push('Entrar em contato via WhatsApp em até 24 horas');
    } else {
      suggestions.push('Enviar email de apresentação com portfólio');
    }

    if (leadData.company) {
      suggestions.push('Preparar proposta corporativa personalizada');
      suggestions.push('Verificar potencial de vendas B2B');
    }

    if (!leadData.message || leadData.message.length < 20) {
      suggestions.push('Qualificar lead com perguntas sobre necessidades');
    }

    if (leadData.businessType === 'automotive') {
      suggestions.push('Destacar experiência em soluções automotivas');
    }

    suggestions.push('Adicionar ao pipeline de vendas');
    suggestions.push('Agendar follow-up em 3 dias se não houver resposta');

    return suggestions.slice(0, 5); // Retorna no máximo 5 sugestões
  }

  /**
   * Gera sugestões de comunicação personalizadas
   */
  async generateCommunicationSuggestions(lead: LeadInput, context?: string): Promise<string[]> {
    try {
      const prompt = `
        Como especialista em vendas de isolamento acústico automotivo, sugira 5 abordagens de comunicação para este lead:

        LEAD:
        Nome: ${lead.fullName}
        Empresa: ${lead.company || 'Não informada'}
        Mensagem: ${lead.message || 'Sem mensagem'}
        ${context ? `Contexto adicional: ${context}` : ''}

        Forneça 5 sugestões práticas e diretas, uma por linha.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extrai as sugestões do texto
      const suggestions = text
        .split('\n')
        .filter((line: string) => line.trim().length > 10)
        .map((line: string) => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .slice(0, 5);

      return suggestions.length > 0 ? suggestions : this.getDefaultSuggestions(lead);
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      return this.getDefaultSuggestions(lead);
    }
  }

  /**
   * Prevê a probabilidade de conversão
   */
  async predictConversion(lead: LeadInput, historicalData?: any[]): Promise<number> {
    try {
      const prompt = `
        Baseado nos seguintes dados, estime a probabilidade de conversão (0.0 a 1.0) deste lead em cliente:

        LEAD ATUAL:
        ${JSON.stringify(lead, null, 2)}

        ${historicalData ? `DADOS HISTÓRICOS SIMILARES:
        Leads similares convertidos: ${historicalData.filter(d => d.converted).length}
        Total de leads similares: ${historicalData.length}` : ''}

        Responda APENAS com um número decimal entre 0.0 e 1.0.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const probability = parseFloat(text.trim());
      return isNaN(probability) ? 0.5 : Math.max(0, Math.min(1, probability));
    } catch (error) {
      console.error('Erro ao prever conversão:', error);
      // Retorna probabilidade baseada em heurísticas simples
      let score = 0.3;
      if (lead.phone) score += 0.2;
      if (lead.message && lead.message.length > 50) score += 0.1;
      if (lead.company) score += 0.2;
      if (lead.businessType === 'automotive') score += 0.2;
      return Math.min(1, score);
    }
  }

  /**
   * Classifica a intenção do lead baseado na mensagem
   */
  async classifyIntent(message: string): Promise<Intent> {
    if (!message || message.length < 10) {
      return {
        primary: 'other',
        confidence: 0.3,
        keywords: []
      };
    }

    try {
      const prompt = `
        Classifique a intenção desta mensagem em uma das categorias:
        - purchase: interesse em comprar
        - inquiry: pedido de informações
        - support: suporte técnico
        - complaint: reclamação
        - other: outros

        Mensagem: "${message}"

        Responda no formato JSON:
        {
          "primary": "categoria",
          "confidence": 0.0-1.0,
          "keywords": ["palavra-chave1", "palavra-chave2"]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          primary: parsed.primary || 'other',
          confidence: parsed.confidence || 0.5,
          keywords: parsed.keywords || []
        };
      }
    } catch (error) {
      console.error('Erro ao classificar intent:', error);
    }

    // Fallback: análise simples baseada em palavras-chave
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('comprar') || lowerMessage.includes('orçamento') || lowerMessage.includes('preço')) {
      return { primary: 'purchase', confidence: 0.7, keywords: ['comprar', 'orçamento', 'preço'] };
    }
    if (lowerMessage.includes('informação') || lowerMessage.includes('saber') || lowerMessage.includes('como')) {
      return { primary: 'inquiry', confidence: 0.6, keywords: ['informação', 'saber'] };
    }
    if (lowerMessage.includes('problema') || lowerMessage.includes('ajuda') || lowerMessage.includes('suporte')) {
      return { primary: 'support', confidence: 0.6, keywords: ['problema', 'ajuda'] };
    }
    if (lowerMessage.includes('reclamação') || lowerMessage.includes('insatisfeito') || lowerMessage.includes('ruim')) {
      return { primary: 'complaint', confidence: 0.7, keywords: ['reclamação', 'insatisfeito'] };
    }

    return { primary: 'other', confidence: 0.4, keywords: [] };
  }

  /**
   * Calcula o score de qualidade do lead
   */
  async scoreLeadQuality(lead: LeadInput): Promise<{ score: number; factors: Record<string, number> }> {
    const factors: Record<string, number> = {
      contactInfo: 0,
      messageQuality: 0,
      businessPotential: 0,
      urgency: 0,
      engagement: 0
    };

    // Fator: Informações de contato (0-20 pontos)
    if (lead.email) factors.contactInfo += 5;
    if (lead.phone) factors.contactInfo += 10;
    if (lead.fullName && lead.fullName.split(' ').length >= 2) factors.contactInfo += 5;

    // Fator: Qualidade da mensagem (0-30 pontos)
    if (lead.message) {
      const messageLength = lead.message.length;
      if (messageLength > 20) factors.messageQuality += 10;
      if (messageLength > 50) factors.messageQuality += 10;
      if (messageLength > 100) factors.messageQuality += 10;
    }

    // Fator: Potencial de negócio (0-30 pontos)
    if (lead.company) factors.businessPotential += 15;
    if (lead.businessType === 'automotive') factors.businessPotential += 15;

    // Fator: Urgência (0-10 pontos)
    if (lead.message) {
      const urgentWords = ['urgente', 'rápido', 'hoje', 'amanhã', 'imediato'];
      if (urgentWords.some(word => lead.message!.toLowerCase().includes(word))) {
        factors.urgency = 10;
      }
    }

    // Fator: Engajamento (0-10 pontos)
    if (lead.tags && lead.tags.length > 0) factors.engagement += 5;
    if (lead.city && lead.state) factors.engagement += 5;

    const totalScore = Object.values(factors).reduce((sum, value) => sum + value, 0);

    return {
      score: Math.min(100, totalScore),
      factors
    };
  }

  /**
   * Enriquece dados do lead com informações adicionais
   */
  async enrichLeadData(lead: LeadInput): Promise<any> {
    try {
      const prompt = `
        Enriqueça os dados deste lead com informações relevantes para o setor de isolamento acústico automotivo:

        LEAD:
        ${JSON.stringify(lead, null, 2)}

        Sugira informações adicionais que seriam úteis, como:
        - Tipo provável de veículo ou frota
        - Tamanho estimado da empresa
        - Necessidades específicas de isolamento
        - Potencial de vendas recorrentes
        - Sazonalidade de compra

        Responda em formato JSON estruturado.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Erro ao enriquecer dados:', error);
    }

    return {
      enriched: false,
      reason: 'Erro ao processar enriquecimento'
    };
  }

  /**
   * Analisa múltiplos leads em lote
   */
  async batchAnalyze(leads: LeadInput[]): Promise<LeadAnalysis[]> {
    const results: LeadAnalysis[] = [];

    // Processa em lotes de 5 para não sobrecarregar a API
    const batchSize = 5;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      const batchPromises = batch.map(lead => this.analyzeLead(lead));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }
}

// Exporta instância única
export const geminiAnalyzer = new GeminiLeadAnalyzer();