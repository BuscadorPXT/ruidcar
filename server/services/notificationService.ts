import cron from 'node-cron';
import { db } from '../db';
import {
  appointments,
  workshops,
  diagnosticServiceConfig,
  workshopAdmins
} from '../../shared/schema';
import { eq, and, gte, lte, ne, isNull } from 'drizzle-orm';
import {
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendWorkshopNotification,
  sendCancellationEmail
} from './emailService';
import { format, addDays, startOfDay, endOfDay, addHours } from 'date-fns';

// Interface para dados de agendamento completo
interface AppointmentWithDetails {
  id: number;
  workshopId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleCategory: 'popular' | 'medium' | 'luxury';
  vehiclePlate?: string;
  problemDescription?: string;
  preferredDate: string;
  preferredTime: string;
  status: string;
  finalPrice: number;
  reminderSentAt?: Date | null;
  confirmationCode?: string;
}

interface WorkshopWithEmail {
  id: number;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  email?: string;
}

// ============================================
// FUNÇÕES DE NOTIFICAÇÃO
// ============================================

/**
 * Envia confirmação de agendamento
 */
export async function notifyAppointmentConfirmation(
  appointment: AppointmentWithDetails,
  confirmationCode: string
): Promise<boolean> {
  try {
    // Buscar dados da oficina
    const workshopData = await db
      .select({
        name: workshops.name,
        address: workshops.address,
        city: workshops.city,
        state: workshops.state,
        phone: workshops.phone
      })
      .from(workshops)
      .where(eq(workshops.id, appointment.workshopId))
      .limit(1);

    if (!workshopData[0]) {
      console.error('Workshop not found for appointment:', appointment.id);
      return false;
    }

    const workshop = workshopData[0];

    // Buscar email da oficina (do admin principal)
    const adminData = await db
      .select({
        email: workshopAdmins.email
      })
      .from(workshopAdmins)
      .where(and(
        eq(workshopAdmins.workshopId, appointment.workshopId),
        eq(workshopAdmins.role, 'owner')
      ))
      .limit(1);

    const workshopEmail = adminData[0]?.email;

    // Montar endereço completo
    const fullAddress = [
      workshop.address,
      workshop.city,
      workshop.state
    ].filter(Boolean).join(', ');

    // Enviar email de confirmação para cliente
    const emailSent = await sendAppointmentConfirmation({
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      workshopName: workshop.name,
      workshopAddress: fullAddress,
      workshopPhone: workshop.phone || undefined,
      date: appointment.preferredDate,
      time: appointment.preferredTime,
      vehicleModel: appointment.vehicleModel,
      vehicleYear: appointment.vehicleYear,
      vehicleCategory: appointment.vehicleCategory,
      problemDescription: appointment.problemDescription,
      confirmationCode,
      price: appointment.finalPrice,
      workshopEmail
    });

    if (emailSent) {
      console.log(`Confirmation email sent for appointment ${appointment.id}`);
    }

    return emailSent;
  } catch (error) {
    console.error('Error sending appointment confirmation:', error);
    return false;
  }
}

/**
 * Envia notificação de novo agendamento para oficina
 */
export async function notifyWorkshopNewAppointment(
  appointment: AppointmentWithDetails
): Promise<boolean> {
  try {
    // Buscar dados da oficina e admin
    const workshopData = await db
      .select({
        workshopName: workshops.name,
        adminEmail: workshopAdmins.email
      })
      .from(workshops)
      .innerJoin(
        workshopAdmins,
        and(
          eq(workshopAdmins.workshopId, workshops.id),
          eq(workshopAdmins.role, 'owner')
        )
      )
      .where(eq(workshops.id, appointment.workshopId))
      .limit(1);

    if (!workshopData[0]) {
      console.error('Workshop admin not found for appointment:', appointment.id);
      return false;
    }

    const { workshopName, adminEmail } = workshopData[0];

    // Enviar notificação
    const emailSent = await sendWorkshopNotification({
      workshopEmail: adminEmail,
      workshopName,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      customerEmail: appointment.customerEmail,
      date: appointment.preferredDate,
      time: appointment.preferredTime,
      vehicleInfo: `${appointment.vehicleModel} ${appointment.vehicleYear}`,
      problemDescription: appointment.problemDescription
    });

    if (emailSent) {
      console.log(`Workshop notification sent for appointment ${appointment.id}`);
    }

    return emailSent;
  } catch (error) {
    console.error('Error sending workshop notification:', error);
    return false;
  }
}

/**
 * Envia lembrete de agendamento
 */
export async function notifyAppointmentReminder(
  appointment: AppointmentWithDetails
): Promise<boolean> {
  try {
    // Buscar dados da oficina
    const workshopData = await db
      .select({
        name: workshops.name,
        address: workshops.address,
        city: workshops.city,
        state: workshops.state
      })
      .from(workshops)
      .where(eq(workshops.id, appointment.workshopId))
      .limit(1);

    if (!workshopData[0]) {
      console.error('Workshop not found for reminder:', appointment.id);
      return false;
    }

    const workshop = workshopData[0];
    const fullAddress = [
      workshop.address,
      workshop.city,
      workshop.state
    ].filter(Boolean).join(', ');

    // Enviar lembrete
    const emailSent = await sendAppointmentReminder({
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      workshopName: workshop.name,
      workshopAddress: fullAddress,
      date: appointment.preferredDate,
      time: appointment.preferredTime,
      confirmationCode: appointment.confirmationCode || `APT-${appointment.id}`
    });

    if (emailSent) {
      // Atualizar flag de lembrete enviado
      await db
        .update(appointments)
        .set({ reminderSentAt: new Date() })
        .where(eq(appointments.id, appointment.id));

      console.log(`Reminder sent for appointment ${appointment.id}`);
    }

    return emailSent;
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    return false;
  }
}

/**
 * Envia notificação de cancelamento
 */
export async function notifyAppointmentCancellation(
  appointment: AppointmentWithDetails,
  reason?: string
): Promise<boolean> {
  try {
    // Buscar dados da oficina
    const workshopData = await db
      .select({
        name: workshops.name
      })
      .from(workshops)
      .where(eq(workshops.id, appointment.workshopId))
      .limit(1);

    if (!workshopData[0]) {
      console.error('Workshop not found for cancellation:', appointment.id);
      return false;
    }

    // Enviar email de cancelamento
    const emailSent = await sendCancellationEmail(
      appointment.customerEmail,
      appointment.customerName,
      workshopData[0].name,
      appointment.preferredDate,
      appointment.preferredTime,
      reason
    );

    if (emailSent) {
      console.log(`Cancellation email sent for appointment ${appointment.id}`);
    }

    return emailSent;
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
    return false;
  }
}

// ============================================
// CRON JOBS
// ============================================

/**
 * Processa lembretes de agendamentos para o dia seguinte
 */
async function processAppointmentReminders() {
  console.log('Processing appointment reminders...');

  try {
    // Buscar agendamentos confirmados para amanhã que ainda não receberam lembrete
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    const appointmentsToRemind = await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.preferredDate, tomorrow),
        eq(appointments.status, 'confirmed'),
        isNull(appointments.reminderSentAt)
      ));

    console.log(`Found ${appointmentsToRemind.length} appointments to remind`);

    for (const appointment of appointmentsToRemind) {
      await notifyAppointmentReminder(appointment as AppointmentWithDetails);
      // Pequeno delay entre emails para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Reminders processing completed');
  } catch (error) {
    console.error('Error processing reminders:', error);
  }
}

/**
 * Marca agendamentos não comparecidos (no-show)
 */
async function processNoShows() {
  console.log('Processing no-shows...');

  try {
    // Buscar agendamentos confirmados de hoje que já passaram do horário
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');

    const overdueAppointments = await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.preferredDate, today),
        eq(appointments.status, 'confirmed'),
        lte(appointments.preferredTime, currentTime)
      ));

    for (const appointment of overdueAppointments) {
      // Verificar se passou do tempo de tolerância (15 minutos por padrão)
      const appointmentTime = new Date(`${today}T${appointment.preferredTime}:00`);
      const toleranceTime = addHours(appointmentTime, 0.25); // 15 minutos

      if (now > toleranceTime && !appointment.checkInTime) {
        // Marcar como no-show
        await db
          .update(appointments)
          .set({
            status: 'no_show',
            updatedAt: new Date()
          })
          .where(eq(appointments.id, appointment.id));

        console.log(`Appointment ${appointment.id} marked as no-show`);
      }
    }

    console.log('No-show processing completed');
  } catch (error) {
    console.error('Error processing no-shows:', error);
  }
}

/**
 * Limpa agendamentos antigos (opcional - para manutenção)
 */
async function cleanupOldAppointments() {
  console.log('Cleaning up old appointments...');

  try {
    // Remover agendamentos cancelados com mais de 90 dias
    const threeMonthsAgo = format(addDays(new Date(), -90), 'yyyy-MM-dd');

    const result = await db
      .delete(appointments)
      .where(and(
        eq(appointments.status, 'cancelled'),
        lte(appointments.preferredDate, threeMonthsAgo)
      ));

    console.log('Old appointments cleanup completed');
  } catch (error) {
    console.error('Error cleaning up appointments:', error);
  }
}

// ============================================
// INICIALIZAÇÃO DOS CRON JOBS
// ============================================

let remindersJob: cron.ScheduledTask | null = null;
let noShowsJob: cron.ScheduledTask | null = null;
let cleanupJob: cron.ScheduledTask | null = null;

export function startNotificationJobs() {
  console.log('Starting notification cron jobs...');

  // Executar lembretes todos os dias às 18h
  remindersJob = cron.schedule('0 18 * * *', processAppointmentReminders, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });

  // Verificar no-shows a cada 30 minutos
  noShowsJob = cron.schedule('*/30 * * * *', processNoShows, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });

  // Limpar agendamentos antigos uma vez por semana (domingo às 3h)
  cleanupJob = cron.schedule('0 3 * * 0', cleanupOldAppointments, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });

  console.log('Notification cron jobs started successfully');
}

export function stopNotificationJobs() {
  console.log('Stopping notification cron jobs...');

  if (remindersJob) {
    remindersJob.stop();
    remindersJob = null;
  }

  if (noShowsJob) {
    noShowsJob.stop();
    noShowsJob = null;
  }

  if (cleanupJob) {
    cleanupJob.stop();
    cleanupJob = null;
  }

  console.log('Notification cron jobs stopped');
}

// Exportar funções para uso em outros módulos
export default {
  notifyAppointmentConfirmation,
  notifyWorkshopNewAppointment,
  notifyAppointmentReminder,
  notifyAppointmentCancellation,
  startNotificationJobs,
  stopNotificationJobs,
  // Exportar também as funções de processamento para testes
  processAppointmentReminders,
  processNoShows,
  cleanupOldAppointments
};