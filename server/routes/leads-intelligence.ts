import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { contactMessages } from '../../shared/schema.js';
import { and, eq, gte, lte, sql, or, ilike, desc, asc, inArray } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth.js';
import { geoIntelligence } from '../services/geo-intelligence.js';
import { geminiAnalyzer } from '../services/gemini-ai.js';

const router = Router();

// Estender o tipo Request para incluir o user
interface AuthRequest extends Request {
  user?: any;
}

// Middleware para verificar permissão de admin
const adminOnly = (req: AuthRequest, res: Response, next: any) => {
  // Verificar diferentes possíveis estruturas do user
  const userRole = req.user?.role || req.user?.roles?.[0]?.roleName;

  if (userRole !== 'ADMIN') {
    console.log('Admin check failed. User:', req.user);
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// GET /api/leads/intelligence - Buscar leads com análise de IA
router.get('/intelligence', authenticateUser, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const {
      state,
      country,
      temperature,
      scoreMin = '0',
      scoreMax = '100',
      search,
      page = '1',
      limit = '50'
    } = req.query;

    // Constrói as condições de filtro
    const conditions = [];

    if (state) {
      conditions.push(eq(contactMessages.estado, state as string));
    }

    if (country) {
      conditions.push(eq(contactMessages.pais, country as string));
    }

    if (temperature) {
      conditions.push(eq(contactMessages.leadTemperature, temperature as string));
    }

    conditions.push(gte(contactMessages.leadScore, parseInt(scoreMin as string)));
    conditions.push(lte(contactMessages.leadScore, parseInt(scoreMax as string)));

    if (search) {
      conditions.push(
        or(
          ilike(contactMessages.fullName, `%${search}%`),
          ilike(contactMessages.email, `%${search}%`),
          ilike(contactMessages.company, `%${search}%`)
        )
      );
    }

    // Busca os leads
    const leads = await db
      .select()
      .from(contactMessages)
      .where(and(...conditions))
      .orderBy(desc(contactMessages.createdAt))
      .limit(parseInt(limit as string))
      .offset((parseInt(page as string) - 1) * parseInt(limit as string));

    // Conta o total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactMessages)
      .where(and(...conditions));

    res.json({
      leads,
      total: count,
      page: parseInt(page as string),
      totalPages: Math.ceil(count / parseInt(limit as string))
    });
  } catch (error) {
    console.error('Erro ao buscar leads inteligentes:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
});

// POST /api/leads/analyze - Analisar um lead com IA
router.post('/analyze', authenticateUser, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { leadId, includeAI = true } = req.body;

    // Busca o lead
    const [lead] = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.id, leadId))
      .limit(1);

    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Análise geográfica
    const geoData = lead.whatsapp ? geoIntelligence.extractGeoData(lead.whatsapp) : {};

    // Análise com IA se solicitado
    let aiAnalysis = null;
    let leadScore = 50;
    let leadTemperature = 'warm';
    let predictedConversionRate = 0.5;
    let aiSuggestions: string[] = [];

    if (includeAI) {
      const analysis = await geminiAnalyzer.analyzeLead({
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.whatsapp || undefined,
        company: lead.company || undefined,
        message: lead.message || undefined,
        businessType: lead.businessType || undefined,
        country: lead.country || undefined,
        city: lead.city || undefined,
        state: lead.state || undefined,
        tags: lead.tags || undefined
      });

      aiAnalysis = analysis;
      leadScore = analysis.leadScore;
      leadTemperature = analysis.temperature;
      predictedConversionRate = analysis.conversionProbability;
      aiSuggestions = analysis.suggestedActions;
    }

    // Atualiza o lead no banco
    await db
      .update(contactMessages)
      .set({
        ...geoData,
        leadScore,
        leadTemperature,
        aiAnalysis,
        aiSuggestions,
        predictedConversionRate,
        lastAiAnalysis: new Date(),
        geoData: geoData as any
      })
      .where(eq(contactMessages.id, leadId));

    // Busca o lead atualizado
    const [updatedLead] = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.id, leadId))
      .limit(1);

    res.json(updatedLead);
  } catch (error) {
    console.error('Erro ao analisar lead:', error);
    res.status(500).json({ error: 'Erro ao analisar lead' });
  }
});

// POST /api/leads/batch-analyze - Análise em lote
router.post('/batch-analyze', authenticateUser, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { leadIds } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'IDs de leads inválidos' });
    }

    // Busca os leads
    const leads = await db
      .select()
      .from(contactMessages)
      .where(inArray(contactMessages.id, leadIds));

    let analyzed = 0;
    const errors: any[] = [];

    // Processa cada lead
    for (const lead of leads) {
      try {
        // Análise geográfica
        const geoData = lead.whatsapp ? geoIntelligence.extractGeoData(lead.whatsapp) : {};

        // Análise com IA
        const analysis = await geminiAnalyzer.analyzeLead({
          fullName: lead.fullName,
          email: lead.email,
          phone: lead.whatsapp || undefined,
          company: lead.company || undefined,
          message: lead.message || undefined,
          businessType: lead.businessType || undefined,
          country: lead.country || undefined,
          city: lead.city || undefined,
          state: lead.state || undefined,
          tags: lead.tags || undefined
        });

        // Atualiza o lead
        await db
          .update(contactMessages)
          .set({
            ...geoData,
            leadScore: analysis.leadScore,
            leadTemperature: analysis.temperature,
            aiAnalysis: analysis,
            aiSuggestions: analysis.suggestedActions,
            predictedConversionRate: analysis.conversionProbability,
            lastAiAnalysis: new Date(),
            geoData: geoData as any
          })
          .where(eq(contactMessages.id, lead.id));

        analyzed++;
      } catch (error) {
        console.error(`Erro ao analisar lead ${lead.id}:`, error);
        errors.push({ leadId: lead.id, error: String(error) });
      }
    }

    res.json({
      analyzed,
      total: leads.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Erro na análise em lote:', error);
    res.status(500).json({ error: 'Erro na análise em lote' });
  }
});

// GET /api/leads/geographic-stats - Estatísticas geográficas
router.get('/geographic-stats', authenticateUser, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    // Estatísticas por estado
    const byState = await db
      .select({
        estado: contactMessages.estado,
        count: sql<number>`count(*)::int`
      })
      .from(contactMessages)
      .where(sql`${contactMessages.estado} IS NOT NULL`)
      .groupBy(contactMessages.estado);

    // Estatísticas por país
    const byCountry = await db
      .select({
        pais: contactMessages.pais,
        count: sql<number>`count(*)::int`
      })
      .from(contactMessages)
      .where(sql`${contactMessages.pais} IS NOT NULL`)
      .groupBy(contactMessages.pais);

    // Estatísticas por região
    const byRegion = await db
      .select({
        regiao: contactMessages.regiao,
        count: sql<number>`count(*)::int`
      })
      .from(contactMessages)
      .where(sql`${contactMessages.regiao} IS NOT NULL`)
      .groupBy(contactMessages.regiao);

    // Formata os resultados
    const stats = {
      byState: byState.length > 0 ? byState.reduce((acc, item) => {
        if (item.estado) acc[item.estado] = item.count;
        return acc;
      }, {} as Record<string, number>) : {},
      byCountry: byCountry.length > 0 ? byCountry.reduce((acc, item) => {
        if (item.pais) acc[item.pais] = item.count;
        return acc;
      }, {} as Record<string, number>) : {},
      byRegion: byRegion.length > 0 ? byRegion.reduce((acc, item) => {
        if (item.regiao) acc[item.regiao] = item.count;
        return acc;
      }, {} as Record<string, number>) : {}
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas geográficas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/leads/ai-stats - Estatísticas de IA
router.get('/ai-stats', authenticateUser, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    // Total de leads analisados
    const [{ totalAnalyzed }] = await db
      .select({
        totalAnalyzed: sql<number>`count(*)::int`
      })
      .from(contactMessages)
      .where(sql`${contactMessages.leadScore} IS NOT NULL`);

    // Score médio
    const [{ averageScore }] = await db
      .select({
        averageScore: sql<number>`AVG(${contactMessages.leadScore})::float`
      })
      .from(contactMessages)
      .where(sql`${contactMessages.leadScore} IS NOT NULL`);

    // Contagem por temperatura
    const temperatureCounts = await db
      .select({
        temperature: contactMessages.leadTemperature,
        count: sql<number>`count(*)::int`
      })
      .from(contactMessages)
      .where(sql`${contactMessages.leadTemperature} IS NOT NULL`)
      .groupBy(contactMessages.leadTemperature);

    // Taxa de conversão média
    const [{ averageConversionRate }] = await db
      .select({
        averageConversionRate: sql<number>`AVG(${contactMessages.predictedConversionRate})::float`
      })
      .from(contactMessages)
      .where(sql`${contactMessages.predictedConversionRate} IS NOT NULL`);

    // Formata os resultados
    const tempCounts = temperatureCounts.reduce((acc, item) => {
      acc[item.temperature!] = item.count;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalAnalyzed,
      averageScore: averageScore || 0,
      hotLeads: tempCounts['hot'] || 0,
      warmLeads: tempCounts['warm'] || 0,
      coldLeads: tempCounts['cold'] || 0,
      averageConversionRate: averageConversionRate || 0
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de IA:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/leads/export-intelligent - Exportar leads com dados de IA
router.get('/export-intelligent', authenticateUser, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { format = 'csv' } = req.query;

    // Busca todos os leads com análise
    const leads = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.leadScore));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="leads-intelligence.json"');
      return res.json(leads);
    }

    if (format === 'csv') {
      const csv = convertToCSV(leads);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads-intelligence.csv"');
      return res.send(csv);
    }

    if (format === 'excel') {
      // Aqui você precisaria usar uma biblioteca como xlsx
      // Por enquanto, retornamos CSV
      const csv = convertToCSV(leads);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads-intelligence.csv"');
      return res.send(csv);
    }

    res.status(400).json({ error: 'Formato não suportado' });
  } catch (error) {
    console.error('Erro ao exportar leads:', error);
    res.status(500).json({ error: 'Erro ao exportar leads' });
  }
});

// GET /api/leads/intelligence-dashboard - Dashboard completo
router.get('/intelligence-dashboard', authenticateUser, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    // Busca múltiplas estatísticas em paralelo
    const [
      geoStats,
      aiStats,
      recentLeads,
      topScoreLeads,
      hotLeads
    ] = await Promise.all([
      // Estatísticas geográficas
      getGeographicStats(),
      // Estatísticas de IA
      getAIStats(),
      // Leads recentes
      db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(10),
      // Top score leads
      db.select().from(contactMessages).orderBy(desc(contactMessages.leadScore)).limit(10),
      // Hot leads
      db.select().from(contactMessages).where(eq(contactMessages.leadTemperature, 'hot')).limit(10)
    ]);

    res.json({
      geographic: geoStats,
      ai: aiStats,
      recentLeads,
      topScoreLeads,
      hotLeads
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

// Funções auxiliares
async function getGeographicStats() {
  const byState = await db
    .select({
      estado: contactMessages.estado,
      count: sql<number>`count(*)::int`,
      avgScore: sql<number>`AVG(${contactMessages.leadScore})::float`
    })
    .from(contactMessages)
    .where(sql`${contactMessages.estado} IS NOT NULL`)
    .groupBy(contactMessages.estado);

  return byState.reduce((acc, item) => {
    acc[item.estado!] = {
      count: item.count,
      avgScore: item.avgScore
    };
    return acc;
  }, {} as Record<string, any>);
}

async function getAIStats() {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      analyzed: sql<number>`count(${contactMessages.leadScore})::int`,
      avgScore: sql<number>`AVG(${contactMessages.leadScore})::float`,
      avgConversion: sql<number>`AVG(${contactMessages.predictedConversionRate})::float`
    })
    .from(contactMessages);

  return stats;
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = [
    'ID',
    'Nome',
    'Email',
    'WhatsApp',
    'Empresa',
    'Estado',
    'Cidade',
    'País',
    'DDD',
    'DDI',
    'Score IA',
    'Temperatura',
    'Taxa Conversão',
    'Status',
    'Data Criação'
  ];

  const rows = data.map(lead => [
    lead.id,
    lead.fullName,
    lead.email,
    lead.whatsapp || '',
    lead.company || '',
    lead.estado || '',
    lead.cidade || lead.city || '',
    lead.pais || lead.country || '',
    lead.ddd || '',
    lead.ddi || '',
    lead.leadScore || '',
    lead.leadTemperature || '',
    lead.predictedConversionRate ? `${(lead.predictedConversionRate * 100).toFixed(1)}%` : '',
    lead.status || '',
    lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

export default router;