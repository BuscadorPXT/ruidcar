import type { Request, Response, Router } from "express";
import { db } from "../db";
import {
  diagnosticServiceConfig,
  vehiclePricing,
  appointmentSlots,
  appointmentExceptions,
  appointmentSettings,
  appointments,
  workshops,
  workshopAdmins
} from "../../shared/schema";
import { eq, and, or, gte, lte, between, sql } from "drizzle-orm";
import { z } from "zod";
import { authenticateUser } from "../middleware/auth";

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

const ServiceStatusSchema = z.enum(['disabled', 'configuring', 'active', 'suspended']);

const VehicleCategorySchema = z.enum(['popular', 'medium', 'luxury']);

const PricingUpdateSchema = z.object({
  category: VehicleCategorySchema,
  price: z.number().min(1000).max(100000), // Em centavos (R$ 10 a R$ 1000)
  estimatedDuration: z.number().min(30).max(240).optional() // 30min a 4h
});

const SlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  capacity: z.number().min(1).max(10).optional(),
  bufferMinutes: z.number().min(0).max(60).optional()
});

const ExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['holiday', 'blocked', 'special']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  reason: z.string().optional()
});

const SettingsSchema = z.object({
  minAdvanceHours: z.number().min(0).max(168).optional(),
  maxAdvanceDays: z.number().min(1).max(365).optional(),
  cancellationHours: z.number().min(0).max(72).optional(),
  noShowTolerance: z.number().min(0).max(60).optional(),
  autoConfirm: z.boolean().optional(),
  sendReminders: z.boolean().optional(),
  reminderHours: z.number().min(1).max(48).optional()
});

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================

// Middleware integrado para autenticação de oficina
async function requireWorkshopAuth(req: Request, res: Response, next: Function) {
  try {
    // 1. Verificar se usuário está autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
        code: "NOT_AUTHENTICATED"
      });
    }

    // 2. Determinar workshop_id - múltiplas fontes
    let workshopId: number | undefined;

    // Prioridade 1: Header x-workshop-id (compatibilidade frontend)
    if (req.headers['x-workshop-id']) {
      workshopId = parseInt(req.headers['x-workshop-id'] as string);
    }

    // Prioridade 2: Query parameter (fallback)
    if (!workshopId && req.query.workshop_id) {
      workshopId = parseInt(req.query.workshop_id as string);
    }

    // Prioridade 3: Primeira organização do usuário (fallback automático)
    if (!workshopId && req.user.organizationIds.length > 0) {
      workshopId = req.user.organizationIds[0];
      console.log('🔄 Usando workshop_id automático:', workshopId);
    }

    if (!workshopId || isNaN(workshopId)) {
      return res.status(400).json({
        success: false,
        message: "ID da oficina é obrigatório",
        code: "WORKSHOP_ID_REQUIRED"
      });
    }

    // 3. Verificar se usuário tem acesso à oficina
    const hasAccess = req.user.roles.some(role =>
      role.roleName === 'ADMIN' ||
      (role.roleName === 'OFICINA_OWNER' && role.organizationId === workshopId)
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado a esta oficina",
        code: "WORKSHOP_ACCESS_DENIED"
      });
    }

    // 4. Buscar dados da oficina
    const workshop = await db
      .select()
      .from(workshops)
      .where(eq(workshops.id, workshopId))
      .limit(1);

    if (!workshop.length) {
      return res.status(404).json({
        success: false,
        message: "Oficina não encontrada",
        code: "WORKSHOP_NOT_FOUND"
      });
    }

    // 5. Adicionar workshop ao request
    (req as any).workshop = workshop[0];
    console.log('✅ Acesso autorizado à oficina:', workshop[0].name);
    next();

  } catch (error) {
    console.error('❌ Erro na autenticação de oficina:', error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      code: "AUTH_ERROR"
    });
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function canActivateService(workshopId: number): Promise<{
  canActivate: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Verificar preços configurados
  const pricing = await db
    .select()
    .from(vehiclePricing)
    .where(eq(vehiclePricing.workshopId, workshopId));

  const categories = new Set(pricing.map(p => p.category));
  const requiredCategories = ['popular', 'medium', 'luxury'];
  const missingCategories = requiredCategories.filter(c => !categories.has(c));

  if (missingCategories.length > 0) {
    errors.push(`Preços não configurados para: ${missingCategories.join(', ')}`);
  }

  // 2. Verificar disponibilidade mínima
  const slots = await db
    .select()
    .from(appointmentSlots)
    .where(and(
      eq(appointmentSlots.workshopId, workshopId),
      eq(appointmentSlots.isActive, true)
    ));

  if (slots.length === 0) {
    errors.push("Nenhum horário de disponibilidade configurado");
  }

  // 3. Verificar configurações
  const settings = await db
    .select()
    .from(appointmentSettings)
    .where(eq(appointmentSettings.workshopId, workshopId))
    .limit(1);

  if (settings.length === 0) {
    warnings.push("Usando configurações padrão");
  }

  return {
    canActivate: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================
// ROTAS DO SISTEMA DE DIAGNÓSTICO
// ============================================

export function createDiagnosticRoutes(app: Router) {

  // ============================================
  // 1. CONFIGURAÇÃO DO SERVIÇO
  // ============================================

  // GET /api/workshop/diagnostic/status
  app.get("/api/workshop/diagnostic/status", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;

      // Buscar configuração atual
      const config = await db
        .select()
        .from(diagnosticServiceConfig)
        .where(eq(diagnosticServiceConfig.workshopId, workshop.id))
        .limit(1);

      if (config.length === 0) {
        // Criar configuração padrão
        const newConfig = await db
          .insert(diagnosticServiceConfig)
          .values({
            workshopId: workshop.id,
            isActive: false,
            status: 'disabled'
          })
          .returning();

        return res.json({
          success: true,
          data: newConfig[0]
        });
      }

      // Adicionar informações extras
      const validation = await canActivateService(workshop.id);

      return res.json({
        success: true,
        data: {
          ...config[0],
          validation
        }
      });

    } catch (error) {
      console.error("Erro ao buscar status do diagnóstico:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar status"
      });
    }
  });

  // POST /api/workshop/diagnostic/toggle
  app.post("/api/workshop/diagnostic/toggle", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const { activate } = req.body;

      // Buscar configuração atual
      const currentConfig = await db
        .select()
        .from(diagnosticServiceConfig)
        .where(eq(diagnosticServiceConfig.workshopId, workshop.id))
        .limit(1);

      if (currentConfig.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Configuração não encontrada"
        });
      }

      const config = currentConfig[0];

      // Se tentando ativar, validar primeiro
      if (activate) {
        const validation = await canActivateService(workshop.id);

        if (!validation.canActivate) {
          return res.status(400).json({
            success: false,
            message: "Não é possível ativar o serviço",
            errors: validation.errors,
            warnings: validation.warnings
          });
        }

        // Ativar serviço
        const updated = await db
          .update(diagnosticServiceConfig)
          .set({
            isActive: true,
            status: 'active',
            activatedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(diagnosticServiceConfig.workshopId, workshop.id))
          .returning();

        return res.json({
          success: true,
          message: "Serviço de diagnóstico ativado com sucesso",
          data: updated[0]
        });

      } else {
        // Desativar serviço
        const updated = await db
          .update(diagnosticServiceConfig)
          .set({
            isActive: false,
            status: 'disabled',
            deactivatedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(diagnosticServiceConfig.workshopId, workshop.id))
          .returning();

        return res.json({
          success: true,
          message: "Serviço de diagnóstico desativado",
          data: updated[0]
        });
      }

    } catch (error) {
      console.error("Erro ao alternar serviço:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao alternar serviço"
      });
    }
  });

  // PUT /api/workshop/diagnostic/settings
  app.put("/api/workshop/diagnostic/settings", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const settings = SettingsSchema.parse(req.body);

      // Verificar se já existe configuração
      const existing = await db
        .select()
        .from(appointmentSettings)
        .where(eq(appointmentSettings.workshopId, workshop.id))
        .limit(1);

      let result;

      if (existing.length === 0) {
        // Criar nova configuração
        result = await db
          .insert(appointmentSettings)
          .values({
            workshopId: workshop.id,
            ...settings
          })
          .returning();
      } else {
        // Atualizar configuração existente
        result = await db
          .update(appointmentSettings)
          .set({
            ...settings,
            updatedAt: new Date()
          })
          .where(eq(appointmentSettings.workshopId, workshop.id))
          .returning();
      }

      return res.json({
        success: true,
        message: "Configurações atualizadas com sucesso",
        data: result[0]
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors
        });
      }

      console.error("Erro ao atualizar configurações:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar configurações"
      });
    }
  });

  // ============================================
  // 2. CONFIGURAÇÃO DE PREÇOS
  // ============================================

  // GET /api/workshop/diagnostic/pricing
  app.get("/api/workshop/diagnostic/pricing", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;

      const pricing = await db
        .select()
        .from(vehiclePricing)
        .where(eq(vehiclePricing.workshopId, workshop.id))
        .orderBy(vehiclePricing.category);

      return res.json({
        success: true,
        data: pricing
      });

    } catch (error) {
      console.error("Erro ao buscar preços:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar preços"
      });
    }
  });

  // PUT /api/workshop/diagnostic/pricing
  app.put("/api/workshop/diagnostic/pricing", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const pricingData = PricingUpdateSchema.parse(req.body);

      // Verificar se já existe preço para esta categoria
      const existing = await db
        .select()
        .from(vehiclePricing)
        .where(and(
          eq(vehiclePricing.workshopId, workshop.id),
          eq(vehiclePricing.category, pricingData.category)
        ))
        .limit(1);

      let result;

      if (existing.length === 0) {
        // Criar novo preço
        result = await db
          .insert(vehiclePricing)
          .values({
            workshopId: workshop.id,
            ...pricingData,
            estimatedDuration: pricingData.estimatedDuration || 60
          })
          .returning();
      } else {
        // Atualizar preço existente
        result = await db
          .update(vehiclePricing)
          .set({
            ...pricingData,
            updatedAt: new Date()
          })
          .where(and(
            eq(vehiclePricing.workshopId, workshop.id),
            eq(vehiclePricing.category, pricingData.category)
          ))
          .returning();
      }

      return res.json({
        success: true,
        message: `Preço para categoria ${pricingData.category} atualizado`,
        data: result[0]
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors
        });
      }

      console.error("Erro ao atualizar preço:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar preço"
      });
    }
  });

  // DELETE /api/workshop/diagnostic/pricing/:category
  app.delete("/api/workshop/diagnostic/pricing/:category", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const { category } = req.params;

      // Validar categoria
      if (!['popular', 'medium', 'luxury'].includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Categoria inválida"
        });
      }

      await db
        .delete(vehiclePricing)
        .where(and(
          eq(vehiclePricing.workshopId, workshop.id),
          eq(vehiclePricing.category, category)
        ));

      return res.json({
        success: true,
        message: `Preço para categoria ${category} removido`
      });

    } catch (error) {
      console.error("Erro ao remover preço:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao remover preço"
      });
    }
  });

  // ============================================
  // 3. GESTÃO DE DISPONIBILIDADE
  // ============================================

  // GET /api/workshop/diagnostic/slots
  app.get("/api/workshop/diagnostic/slots", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;

      const slots = await db
        .select()
        .from(appointmentSlots)
        .where(eq(appointmentSlots.workshopId, workshop.id))
        .orderBy(appointmentSlots.dayOfWeek, appointmentSlots.startTime);

      return res.json({
        success: true,
        data: slots
      });

    } catch (error) {
      console.error("Erro ao buscar slots:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar disponibilidade"
      });
    }
  });

  // POST /api/workshop/diagnostic/slots
  app.post("/api/workshop/diagnostic/slots", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const slotData = SlotSchema.parse(req.body);

      // Validar horários
      if (slotData.startTime >= slotData.endTime) {
        return res.status(400).json({
          success: false,
          message: "Horário de início deve ser anterior ao horário de fim"
        });
      }

      // Verificar conflitos
      const conflicts = await db
        .select()
        .from(appointmentSlots)
        .where(and(
          eq(appointmentSlots.workshopId, workshop.id),
          eq(appointmentSlots.dayOfWeek, slotData.dayOfWeek),
          eq(appointmentSlots.isActive, true)
        ));

      // Verificar sobreposição simples
      const hasConflict = conflicts.some(slot => {
        return (slotData.startTime < slot.endTime && slotData.endTime > slot.startTime);
      });

      if (hasConflict) {
        return res.status(400).json({
          success: false,
          message: "Horário conflita com slot existente"
        });
      }

      const result = await db
        .insert(appointmentSlots)
        .values({
          workshopId: workshop.id,
          ...slotData,
          capacity: slotData.capacity || 1,
          bufferMinutes: slotData.bufferMinutes || 15
        })
        .returning();

      return res.json({
        success: true,
        message: "Slot de disponibilidade criado",
        data: result[0]
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors
        });
      }

      console.error("Erro ao criar slot:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao criar disponibilidade"
      });
    }
  });

  // PUT /api/workshop/diagnostic/slots/:id
  app.put("/api/workshop/diagnostic/slots/:id", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const slotId = parseInt(req.params.id);
      const updates = req.body;

      const result = await db
        .update(appointmentSlots)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(and(
          eq(appointmentSlots.id, slotId),
          eq(appointmentSlots.workshopId, workshop.id)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Slot não encontrado"
        });
      }

      return res.json({
        success: true,
        message: "Slot atualizado",
        data: result[0]
      });

    } catch (error) {
      console.error("Erro ao atualizar slot:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar disponibilidade"
      });
    }
  });

  // DELETE /api/workshop/diagnostic/slots/:id
  app.delete("/api/workshop/diagnostic/slots/:id", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const slotId = parseInt(req.params.id);

      await db
        .delete(appointmentSlots)
        .where(and(
          eq(appointmentSlots.id, slotId),
          eq(appointmentSlots.workshopId, workshop.id)
        ));

      return res.json({
        success: true,
        message: "Slot removido"
      });

    } catch (error) {
      console.error("Erro ao remover slot:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao remover disponibilidade"
      });
    }
  });

  // ============================================
  // 4. EXCEÇÕES DE AGENDA
  // ============================================

  // GET /api/workshop/diagnostic/exceptions
  app.get("/api/workshop/diagnostic/exceptions", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;

      const exceptions = await db
        .select()
        .from(appointmentExceptions)
        .where(eq(appointmentExceptions.workshopId, workshop.id))
        .orderBy(appointmentExceptions.date);

      return res.json({
        success: true,
        data: exceptions
      });

    } catch (error) {
      console.error("Erro ao buscar exceções:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar exceções"
      });
    }
  });

  // POST /api/workshop/diagnostic/exceptions
  app.post("/api/workshop/diagnostic/exceptions", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const exceptionData = ExceptionSchema.parse(req.body);

      const result = await db
        .insert(appointmentExceptions)
        .values({
          workshopId: workshop.id,
          ...exceptionData
        })
        .returning();

      return res.json({
        success: true,
        message: "Exceção de agenda criada",
        data: result[0]
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors
        });
      }

      console.error("Erro ao criar exceção:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao criar exceção"
      });
    }
  });

  // DELETE /api/workshop/diagnostic/exceptions/:id
  app.delete("/api/workshop/diagnostic/exceptions/:id", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const exceptionId = parseInt(req.params.id);

      await db
        .delete(appointmentExceptions)
        .where(and(
          eq(appointmentExceptions.id, exceptionId),
          eq(appointmentExceptions.workshopId, workshop.id)
        ));

      return res.json({
        success: true,
        message: "Exceção removida"
      });

    } catch (error) {
      console.error("Erro ao remover exceção:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao remover exceção"
      });
    }
  });

  // ============================================
  // 5. GESTÃO DE AGENDAMENTOS DE DIAGNÓSTICO
  // ============================================

  // GET /api/workshop/diagnostic/appointments
  app.get("/api/workshop/diagnostic/appointments", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const { date, status } = req.query;

      console.log('📅 Buscando agendamentos de diagnóstico para oficina:', workshop.id);

      // Construir query base
      let whereConditions = [eq(appointments.workshopId, workshop.id)];

      // Filtrar por data se fornecida
      if (date && typeof date === 'string') {
        whereConditions.push(eq(appointments.preferredDate, date));
      }

      // Filtrar por status se fornecido
      if (status && typeof status === 'string' && status !== 'all') {
        whereConditions.push(eq(appointments.status, status));
      }

      // Buscar agendamentos
      const diagnosticAppointments = await db
        .select()
        .from(appointments)
        .where(and(...whereConditions))
        .orderBy(appointments.preferredDate, appointments.preferredTime);

      console.log('✅ Encontrados', diagnosticAppointments.length, 'agendamentos de diagnóstico');

      return res.json({
        success: true,
        data: diagnosticAppointments
      });

    } catch (error) {
      console.error("Erro ao buscar agendamentos de diagnóstico:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar agendamentos"
      });
    }
  });

  // PUT /api/workshop/diagnostic/appointments/:id/status
  app.put("/api/workshop/diagnostic/appointments/:id/status", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const appointmentId = parseInt(req.params.id);
      const { status } = req.body;

      console.log('🔄 Atualizando status do agendamento:', appointmentId, 'para:', status);

      // Validar status
      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status inválido"
        });
      }

      // Atualizar agendamento
      const result = await db
        .update(appointments)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.workshopId, workshop.id)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
      }

      console.log('✅ Status do agendamento atualizado com sucesso');

      return res.json({
        success: true,
        data: result[0]
      });

    } catch (error) {
      console.error("Erro ao atualizar status do agendamento:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar status"
      });
    }
  });

  // POST /api/workshop/diagnostic/appointments/:id/check-in
  app.post("/api/workshop/diagnostic/appointments/:id/check-in", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const appointmentId = parseInt(req.params.id);

      console.log('🏁 Fazendo check-in do agendamento:', appointmentId);

      // Fazer check-in
      const result = await db
        .update(appointments)
        .set({
          status: 'in_progress',
          checkInTime: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.workshopId, workshop.id)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
      }

      console.log('✅ Check-in realizado com sucesso');

      return res.json({
        success: true,
        data: result[0]
      });

    } catch (error) {
      console.error("Erro ao fazer check-in:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao fazer check-in"
      });
    }
  });

  // POST /api/workshop/diagnostic/appointments/:id/check-out
  app.post("/api/workshop/diagnostic/appointments/:id/check-out", authenticateUser, requireWorkshopAuth, async (req: Request, res: Response) => {
    try {
      const workshop = (req as any).workshop;
      const appointmentId = parseInt(req.params.id);
      const { notes } = req.body;

      console.log('🏁 Fazendo check-out do agendamento:', appointmentId);

      // Fazer check-out
      const result = await db
        .update(appointments)
        .set({
          status: 'completed',
          checkOutTime: new Date(),
          serviceNotes: notes || null,
          updatedAt: new Date()
        })
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.workshopId, workshop.id)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
      }

      console.log('✅ Check-out realizado com sucesso');

      return res.json({
        success: true,
        data: result[0]
      });

    } catch (error) {
      console.error("Erro ao fazer check-out:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao fazer check-out"
      });
    }
  });

  console.log('✅ Rotas de diagnóstico criadas com sucesso');
}