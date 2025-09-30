import { Router } from "express";
import { createAuthRoutes } from "./auth";
import { createNotificationRoutes } from "./notifications";
import { createWorkshopStatusRoutes } from "./workshopStatus";
import { createDiagnosticRoutes } from "./diagnostic";
import { createDiagnosticPublicRoutes } from "./diagnostic-public";
import userManagementRoutes from "./user-management";
import whatsappRoutes from "./whatsapp";
import leadsIntelligenceRoutes from "./leads-intelligence";

// Exporta função para registrar todas as rotas
export function registerRoutes(app: Router) {
  // Registrar rotas de autenticação unificada
  createAuthRoutes(app);

  // Registrar rotas de notificações
  createNotificationRoutes(app);

  // Registrar rotas de status de oficina
  createWorkshopStatusRoutes(app);

  // Registrar rotas do sistema de diagnóstico (autenticadas)
  createDiagnosticRoutes(app);

  // Registrar rotas públicas do sistema de diagnóstico
  createDiagnosticPublicRoutes(app);

  // Registrar rotas de gerenciamento de usuários (admin)
  app.use('/api/admin', userManagementRoutes);

  // Registrar rotas do WhatsApp Z-API (admin)
  app.use('/api/whatsapp', whatsappRoutes);

  // Registrar rotas de inteligência de leads (admin)
  app.use('/api/leads', leadsIntelligenceRoutes);

  console.log('✅ Todas as rotas foram registradas');
}