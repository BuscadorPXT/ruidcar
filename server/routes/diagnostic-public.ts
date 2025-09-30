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
  contactMessages
} from "../../shared/schema";
import { eq, and, or, gte, lte, between, ne, sql } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import {
  notifyAppointmentConfirmation,
  notifyWorkshopNewAppointment
} from "../services/notificationService";

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

const BookingSchema = z.object({
  customerName: z.string().min(3).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(/^\d{10,11}$/),
  vehicleModel: z.string().min(2).max(100),
  vehicleYear: z.string().regex(/^\d{4}$/),
  vehicleCategory: z.enum(['popular', 'medium', 'luxury']),
  problemDescription: z.string().min(10).max(500),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  customerConsent: z.object({
    dataUsage: z.boolean(),
    marketing: z.boolean(),
    sharing: z.boolean()
  })
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function generateBookingCode(): string {
  return 'APT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function calculateAvailability(
  workshopId: number,
  date: string,
  category: string
): Promise<{
  available: boolean;
  slots: Array<{
    time: string;
    capacity: number;
    available: number;
  }>;
}> {
  // Converter data para dia da semana
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();

  // 1. Buscar slots base para o dia
  const baseSlots = await db
    .select()
    .from(appointmentSlots)
    .where(and(
      eq(appointmentSlots.workshopId, workshopId),
      eq(appointmentSlots.dayOfWeek, dayOfWeek),
      eq(appointmentSlots.isActive, true)
    ));

  if (baseSlots.length === 0) {
    return { available: false, slots: [] };
  }

  // 2. Verificar exceções para a data
  const exceptions = await db
    .select()
    .from(appointmentExceptions)
    .where(and(
      eq(appointmentExceptions.workshopId, workshopId),
      eq(appointmentExceptions.date, date)
    ));

  // Se há bloqueio total para o dia
  const dayBlocked = exceptions.some(e =>
    e.type === 'blocked' && !e.startTime && !e.endTime
  );

  if (dayBlocked) {
    return { available: false, slots: [] };
  }

  // 3. Buscar agendamentos existentes
  const existingAppointments = await db
    .select({
      time: appointments.preferredTime,
      count: sql<number>`count(*)::int`
    })
    .from(appointments)
    .where(and(
      eq(appointments.workshopId, workshopId),
      eq(appointments.preferredDate, date),
      ne(appointments.status, 'cancelled')
    ))
    .groupBy(appointments.preferredTime);

  // 4. Buscar configurações
  const settings = await db
    .select()
    .from(appointmentSettings)
    .where(eq(appointmentSettings.workshopId, workshopId))
    .limit(1);

  const minAdvanceHours = settings[0]?.minAdvanceHours || 2;
  const maxAdvanceDays = settings[0]?.maxAdvanceDays || 30;

  // 5. Validar janela de agendamento
  const now = new Date();
  const appointmentDate = new Date(date);
  const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const daysUntil = hoursUntil / 24;

  if (hoursUntil < minAdvanceHours || daysUntil > maxAdvanceDays) {
    return { available: false, slots: [] };
  }

  // 6. Gerar slots disponíveis
  const availableSlots: Array<{ time: string; capacity: number; available: number }> = [];

  for (const slot of baseSlots) {
    // Gerar horários dentro do slot
    const startHour = parseInt(slot.startTime.split(':')[0]);
    const startMin = parseInt(slot.startTime.split(':')[1]);
    const endHour = parseInt(slot.endTime.split(':')[0]);
    const endMin = parseInt(slot.endTime.split(':')[1]);

    // Buscar duração estimada para a categoria
    const pricing = await db
      .select()
      .from(vehiclePricing)
      .where(and(
        eq(vehiclePricing.workshopId, workshopId),
        eq(vehiclePricing.category, category)
      ))
      .limit(1);

    const duration = pricing[0]?.estimatedDuration || 60;
    const buffer = slot.bufferMinutes || 15;
    const totalMinutes = duration + buffer;

    // Gerar slots de hora em hora (ou conforme duração)
    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

      // Verificar se não está em exceção
      const inException = exceptions.some(e => {
        if (!e.startTime || !e.endTime) return false;
        return timeStr >= e.startTime && timeStr < e.endTime;
      });

      if (!inException) {
        // Verificar quantos agendamentos já existem
        const existing = existingAppointments.find(a => a.time === timeStr);
        const used = existing?.count || 0;
        const available = slot.capacity - used;

        // Só adicionar se passado o horário mínimo (para hoje)
        const slotDateTime = new Date(`${date}T${timeStr}:00`);
        if (slotDateTime.getTime() > now.getTime() + (minAdvanceHours * 60 * 60 * 1000)) {
          availableSlots.push({
            time: timeStr,
            capacity: slot.capacity,
            available: Math.max(0, available)
          });
        }
      }

      // Avançar para próximo slot
      currentMin += totalMinutes;
      while (currentMin >= 60) {
        currentMin -= 60;
        currentHour++;
      }
    }
  }

  return {
    available: availableSlots.some(s => s.available > 0),
    slots: availableSlots
  };
}

// ============================================
// ROTAS PÚBLICAS DO SISTEMA DE DIAGNÓSTICO
// ============================================

export function createDiagnosticPublicRoutes(app: Router) {

  // ============================================
  // 1. VERIFICAR STATUS DO SERVIÇO (SIMPLIFICADO)
  // ============================================

  // GET /api/public/diagnostic/status/:workshopId
  app.get("/api/public/diagnostic/status/:workshopId", async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.workshopId);

      // Buscar configuração do serviço
      const config = await db
        .select()
        .from(diagnosticServiceConfig)
        .where(eq(diagnosticServiceConfig.workshopId, workshopId))
        .limit(1);

      if (config.length === 0) {
        return res.json({
          success: true,
          data: {
            isActive: false,
            hasValidPricing: false,
            hasAvailableSlots: false
          }
        });
      }

      const serviceConfig = config[0];

      // Verificar se está ativo
      if (!serviceConfig.isActive || serviceConfig.status !== 'active') {
        return res.json({
          success: true,
          data: {
            isActive: false,
            hasValidPricing: false,
            hasAvailableSlots: false
          }
        });
      }

      // Verificar se tem preços configurados
      const pricing = await db
        .select()
        .from(vehiclePricing)
        .where(eq(vehiclePricing.workshopId, workshopId));

      const hasValidPricing = pricing.length >= 3 && pricing.every(p => p.price > 0);

      // Verificar se tem slots disponíveis
      const slots = await db
        .select()
        .from(appointmentSlots)
        .where(and(
          eq(appointmentSlots.workshopId, workshopId),
          eq(appointmentSlots.isActive, true)
        ));

      const hasAvailableSlots = slots.length > 0;

      return res.json({
        success: true,
        data: {
          isActive: true,
          hasValidPricing,
          hasAvailableSlots
        }
      });

    } catch (error) {
      console.error("Erro ao verificar status do diagnóstico:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao verificar status"
      });
    }
  });

  // ============================================
  // 1B. VERIFICAR STATUS DO SERVIÇO (DETALHADO)
  // ============================================

  // GET /api/public/workshop/:id/diagnostic/status
  app.get("/api/public/workshop/:id/diagnostic/status", async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.id);

      // Verificar se workshop existe
      const workshop = await db
        .select()
        .from(workshops)
        .where(eq(workshops.id, workshopId))
        .limit(1);

      if (workshop.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Oficina não encontrada"
        });
      }

      // Buscar configuração do serviço
      const config = await db
        .select()
        .from(diagnosticServiceConfig)
        .where(eq(diagnosticServiceConfig.workshopId, workshopId))
        .limit(1);

      if (config.length === 0) {
        return res.json({
          success: true,
          data: {
            available: false,
            status: 'disabled',
            message: 'Serviço não disponível'
          }
        });
      }

      const serviceConfig = config[0];

      // Retornar status baseado na configuração
      let message = '';
      let canBook = false;

      switch (serviceConfig.status) {
        case 'active':
          message = 'Serviço disponível para agendamento';
          canBook = true;
          break;
        case 'suspended':
          message = serviceConfig.suspensionReason || 'Serviço temporariamente indisponível';
          break;
        case 'configuring':
          message = 'Serviço em breve disponível';
          break;
        default:
          message = 'Serviço não disponível';
      }

      return res.json({
        success: true,
        data: {
          available: serviceConfig.isActive,
          status: serviceConfig.status,
          message,
          canBook
        }
      });

    } catch (error) {
      console.error("Erro ao verificar status:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao verificar disponibilidade"
      });
    }
  });

  // ============================================
  // 2. BUSCAR PREÇOS
  // ============================================

  // GET /api/public/workshop/:id/diagnostic/pricing
  app.get("/api/public/workshop/:id/diagnostic/pricing", async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.id);

      // Verificar se serviço está ativo
      const config = await db
        .select()
        .from(diagnosticServiceConfig)
        .where(eq(diagnosticServiceConfig.workshopId, workshopId))
        .limit(1);

      if (config.length === 0 || config[0].status !== 'active') {
        return res.status(400).json({
          success: false,
          message: "Serviço não disponível"
        });
      }

      // Buscar preços
      const pricing = await db
        .select({
          category: vehiclePricing.category,
          price: vehiclePricing.price,
          estimatedDuration: vehiclePricing.estimatedDuration
        })
        .from(vehiclePricing)
        .where(and(
          eq(vehiclePricing.workshopId, workshopId),
          eq(vehiclePricing.isActive, true)
        ))
        .orderBy(vehiclePricing.price);

      // Formatar preços para exibição
      const formattedPricing = pricing.map(p => ({
        category: p.category,
        categoryLabel: p.category === 'popular' ? 'Popular / Linha Leve' :
                      p.category === 'medium' ? 'Linha Média / SUV / Picape' :
                      'Luxo / Premium',
        price: p.price,
        priceFormatted: `R$ ${(p.price / 100).toFixed(2).replace('.', ',')}`,
        estimatedDuration: p.estimatedDuration,
        durationFormatted: `${p.estimatedDuration} minutos`
      }));

      return res.json({
        success: true,
        data: formattedPricing
      });

    } catch (error) {
      console.error("Erro ao buscar preços:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar preços"
      });
    }
  });

  // ============================================
  // 3. VERIFICAR DISPONIBILIDADE
  // ============================================

  // GET /api/public/workshop/:id/diagnostic/availability
  app.get("/api/public/workshop/:id/diagnostic/availability", async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.id);
      const { date, category } = req.query;

      if (!date || !category) {
        return res.status(400).json({
          success: false,
          message: "Data e categoria são obrigatórias"
        });
      }

      // Verificar se serviço está ativo
      const config = await db
        .select()
        .from(diagnosticServiceConfig)
        .where(eq(diagnosticServiceConfig.workshopId, workshopId))
        .limit(1);

      if (config.length === 0 || config[0].status !== 'active') {
        return res.json({
          success: true,
          data: {
            available: false,
            slots: [],
            message: "Serviço não disponível"
          }
        });
      }

      // Calcular disponibilidade
      const availability = await calculateAvailability(
        workshopId,
        date as string,
        category as string
      );

      return res.json({
        success: true,
        data: availability
      });

    } catch (error) {
      console.error("Erro ao verificar disponibilidade:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao verificar disponibilidade"
      });
    }
  });

  // ============================================
  // 4. CRIAR AGENDAMENTO
  // ============================================

  // POST /api/public/workshop/:id/diagnostic/book
  app.post("/api/public/workshop/:id/diagnostic/book", async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.id);
      const bookingData = BookingSchema.parse(req.body);

      // Verificar se serviço está ativo
      const config = await db
        .select()
        .from(diagnosticServiceConfig)
        .where(eq(diagnosticServiceConfig.workshopId, workshopId))
        .limit(1);

      if (config.length === 0 || config[0].status !== 'active') {
        return res.status(400).json({
          success: false,
          message: "Serviço não disponível para agendamento"
        });
      }

      // Verificar disponibilidade do slot
      const availability = await calculateAvailability(
        workshopId,
        bookingData.preferredDate,
        bookingData.vehicleCategory
      );

      const selectedSlot = availability.slots.find(s =>
        s.time === bookingData.preferredTime && s.available > 0
      );

      if (!selectedSlot) {
        return res.status(400).json({
          success: false,
          message: "Horário não disponível"
        });
      }

      // Buscar preço
      const pricing = await db
        .select()
        .from(vehiclePricing)
        .where(and(
          eq(vehiclePricing.workshopId, workshopId),
          eq(vehiclePricing.category, bookingData.vehicleCategory)
        ))
        .limit(1);

      if (pricing.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Preço não configurado para esta categoria"
        });
      }

      const finalPrice = pricing[0].price;

      // Buscar configurações
      const settings = await db
        .select()
        .from(appointmentSettings)
        .where(eq(appointmentSettings.workshopId, workshopId))
        .limit(1);

      const autoConfirm = settings[0]?.autoConfirm || false;

      // Gerar código de confirmação antes da transação
      const confirmationCode = generateBookingCode();

      // Usar transação para evitar race condition
      const result = await db.transaction(async (tx) => {
        // Verificar novamente disponibilidade dentro da transação
        const existingCount = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(appointments)
          .where(and(
            eq(appointments.workshopId, workshopId),
            eq(appointments.preferredDate, bookingData.preferredDate),
            eq(appointments.preferredTime, bookingData.preferredTime),
            ne(appointments.status, 'cancelled')
          ));

        const slot = availability.slots.find(s => s.time === bookingData.preferredTime);

        if (!slot || existingCount[0].count >= slot.capacity) {
          throw new Error("SLOT_FULL");
        }

        // Criar agendamento
        const appointment = await tx
          .insert(appointments)
          .values({
            workshopId,
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone,
            vehicleModel: bookingData.vehicleModel,
            vehicleYear: bookingData.vehicleYear,
            vehicleCategory: bookingData.vehicleCategory,
            problemDescription: bookingData.problemDescription,
            preferredDate: bookingData.preferredDate,
            preferredTime: bookingData.preferredTime,
            status: autoConfirm ? 'confirmed' : 'pending',
            estimatedPrice: finalPrice,
            finalPrice: finalPrice,
            customerConsent: bookingData.customerConsent,
            confirmationCode: confirmationCode,
            source: 'website'
          })
          .returning();

        return appointment[0];
      }).catch(error => {
        if (error.message === 'SLOT_FULL') {
          throw new Error('Horário não mais disponível');
        }
        throw error;
      });

      // Enviar notificações de email
      try {
        // Notificar cliente
        await notifyAppointmentConfirmation(result as any, confirmationCode);

        // Notificar oficina
        await notifyWorkshopNewAppointment(result as any);
      } catch (notificationError) {
        // Log do erro mas não falhar a requisição
        console.error('Erro ao enviar notificações:', notificationError);
      }

      return res.json({
        success: true,
        message: "Agendamento realizado com sucesso",
        data: {
          id: result.id,
          confirmationCode,
          status: result.status,
          date: result.preferredDate,
          time: result.preferredTime,
          price: result.finalPrice,
          priceFormatted: `R$ ${(result.finalPrice / 100).toFixed(2).replace('.', ',')}`,
          workshop: {
            name: (await db.select().from(workshops).where(eq(workshops.id, workshopId)).limit(1))[0].name
          }
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors
        });
      }

      if (error instanceof Error && error.message === 'Horário não mais disponível') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      console.error("Erro ao criar agendamento:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao criar agendamento"
      });
    }
  });

  // ============================================
  // 5. VERIFICAR STATUS DO AGENDAMENTO
  // ============================================

  // GET /api/public/appointment/:code/status
  app.get("/api/public/appointment/:code/status", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: "Código de confirmação é obrigatório"
        });
      }

      // Buscar agendamento pelo código de confirmação
      const appointment = await db
        .select({
          id: appointments.id,
          customerName: appointments.customerName,
          customerEmail: appointments.customerEmail,
          vehicleModel: appointments.vehicleModel,
          vehicleYear: appointments.vehicleYear,
          vehicleCategory: appointments.vehicleCategory,
          preferredDate: appointments.preferredDate,
          preferredTime: appointments.preferredTime,
          status: appointments.status,
          finalPrice: appointments.finalPrice,
          checkInTime: appointments.checkInTime,
          checkOutTime: appointments.checkOutTime,
          workshopName: workshops.name,
          workshopAddress: workshops.address,
          workshopPhone: workshops.phone
        })
        .from(appointments)
        .innerJoin(workshops, eq(appointments.workshopId, workshops.id))
        .where(eq(appointments.confirmationCode, code))
        .limit(1);

      if (!appointment[0]) {
        return res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
      }

      return res.json({
        success: true,
        data: {
          ...appointment[0],
          priceFormatted: `R$ ${(appointment[0].finalPrice / 100).toFixed(2).replace('.', ',')}`
        }
      });

    } catch (error) {
      console.error("Erro ao verificar agendamento:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao verificar agendamento"
      });
    }
  });

  // ============================================
  // 6. CANCELAR AGENDAMENTO
  // ============================================

  // POST /api/public/appointment/:code/cancel
  app.post("/api/public/appointment/:code/cancel", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const { reason } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: "Código de confirmação é obrigatório"
        });
      }

      // Buscar agendamento pelo código
      const appointment = await db
        .select()
        .from(appointments)
        .where(eq(appointments.confirmationCode, code))
        .limit(1);

      if (!appointment[0]) {
        return res.status(404).json({
          success: false,
          message: "Agendamento não encontrado"
        });
      }

      // Verificar se já está cancelado
      if (appointment[0].status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: "Agendamento já está cancelado"
        });
      }

      // Verificar se já foi concluído
      if (appointment[0].status === 'completed') {
        return res.status(400).json({
          success: false,
          message: "Não é possível cancelar um agendamento concluído"
        });
      }

      // Cancelar agendamento
      const updated = await db
        .update(appointments)
        .set({
          status: 'cancelled',
          cancelledBy: 'customer',
          cancellationReason: reason || 'Cancelado pelo cliente',
          updatedAt: new Date()
        })
        .where(eq(appointments.id, appointment[0].id))
        .returning();

      // Enviar notificação de cancelamento
      try {
        const { notifyAppointmentCancellation } = await import('../services/notificationService');
        await notifyAppointmentCancellation(appointment[0] as any, reason);
      } catch (notificationError) {
        console.error('Erro ao enviar notificação de cancelamento:', notificationError);
      }

      return res.json({
        success: true,
        message: "Agendamento cancelado com sucesso"
      });

    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao cancelar agendamento"
      });
    }
  });

  console.log('✅ Rotas públicas de diagnóstico criadas com sucesso');
}