import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, json, jsonb, primaryKey, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Usuários (Compatível com estrutura existente no banco)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  company: text("company"),
  role: text("role"),
  createdAt: timestamp("created_at"),
});

// Roles/Papéis do Sistema
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: json("permissions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Associação Usuário-Role-Organização (RBAC Multi-tenant)
export const userRoles = pgTable("user_roles", {
  userId: integer("user_id").notNull().references(() => users.id),
  roleId: integer("role_id").notNull().references(() => roles.id),
  organizationId: integer("organization_id").references(() => workshops.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId, table.organizationId] })
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  company: true,
  role: true,
});

export const insertRoleSchema = createInsertSchema(roles).pick({
  name: true,
  description: true,
  permissions: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).pick({
  userId: true,
  roleId: true,
  organizationId: true,
  isActive: true,
});

export const usersRelations = relations(users, ({ many }) => ({
  calculations: many(roiCalculations),
  contacts: many(contactMessages),
  blogPosts: many(blogPosts),
  userRoles: many(userRoles),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  organization: one(workshops, {
    fields: [userRoles.organizationId],
    references: [workshops.id],
  }),
}));

// Mensagens de contato e Agendamentos
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  fullName: text("full_name").notNull(),
  company: text("company"),
  email: text("email").notNull(),
  whatsapp: text("whatsapp"),
  country: text("country"),
  businessType: text("business_type"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  responded: boolean("responded").default(false),

  // Campos adicionais para agendamentos de oficinas (DESABILITADOS TEMPORARIAMENTE)
  // workshopId: integer("workshop_id").references(() => workshops.id),
  // vehicleModel: text("vehicle_model"),
  // vehicleYear: text("vehicle_year"),
  // problemDescription: text("problem_description"),
  // preferredDate: text("preferred_date"),
  // preferredTime: text("preferred_time"),
  status: text("status").default("new"), // new, contacted, qualified, proposal, negotiation, closed_won, closed_lost, nurturing
  // respondedAt: timestamp("responded_at"),
  // workshopNotes: text("workshop_notes"),
  // estimatedPrice: integer("estimated_price"), // em centavos
  // appointmentType: text("appointment_type").default("general"), // general, diagnosis, maintenance, repair

  // Novos campos para Lead Management System
  assignedTo: integer("assigned_to").references(() => users.id),
  leadScore: integer("lead_score").default(0),

  // Campos de Inteligência Artificial
  ddd: text("ddd"),
  ddi: text("ddi"),
  estado: text("estado"),
  cidade: text("cidade"),
  pais: text("pais"),
  regiao: text("regiao"),
  leadTemperature: text("lead_temperature"),
  predictedConversionRate: decimal("predicted_conversion_rate", { precision: 3, scale: 2 }),
  aiAnalysis: jsonb("ai_analysis"),
  aiSuggestions: text("ai_suggestions").array(),
  lastAiAnalysis: timestamp("last_ai_analysis"),
  geoData: jsonb("geo_data"),

  tags: text("tags").array(),
  nextActionDate: date("next_action_date"),
  conversionDate: timestamp("conversion_date"),
  rejectionReason: text("rejection_reason"),
  internalNotes: text("internal_notes"),
  interactionCount: integer("interaction_count").default(0),
  lastInteraction: timestamp("last_interaction"),
  city: text("city"),
  state: text("state"),
});

export const insertContactSchema = createInsertSchema(contactMessages).pick({
  userId: true,
  fullName: true,
  company: true,
  email: true,
  whatsapp: true,
  country: true,
  businessType: true,
  message: true,
});

export const contactRelations = relations(contactMessages, ({ one, many }) => ({
  user: one(users, {
    fields: [contactMessages.userId],
    references: [users.id],
  }),
  // workshop: one(workshops, {
  //   fields: [contactMessages.workshopId],
  //   references: [workshops.id],
  // }),
  assignedUser: one(users, {
    fields: [contactMessages.assignedTo],
    references: [users.id],
  }),
  interactions: many(leadInteractions),
  statusHistory: many(leadStatusHistory),
}));

// Lead Interactions Table
export const leadInteractions = pgTable("lead_interactions", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => contactMessages.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // note, call, email, whatsapp, meeting, system
  content: text("content"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeadInteractionSchema = createInsertSchema(leadInteractions).pick({
  leadId: true,
  userId: true,
  type: true,
  content: true,
  scheduledAt: true,
  completedAt: true,
});

export const leadInteractionRelations = relations(leadInteractions, ({ one }) => ({
  lead: one(contactMessages, {
    fields: [leadInteractions.leadId],
    references: [contactMessages.id],
  }),
  user: one(users, {
    fields: [leadInteractions.userId],
    references: [users.id],
  }),
}));

// Lead Status History Table
export const leadStatusHistory = pgTable("lead_status_history", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => contactMessages.id, { onDelete: "cascade" }),
  oldStatus: text("old_status"),
  newStatus: text("new_status").notNull(),
  changedBy: integer("changed_by").notNull().references(() => users.id),
  reason: text("reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadStatusHistorySchema = createInsertSchema(leadStatusHistory).pick({
  leadId: true,
  oldStatus: true,
  newStatus: true,
  changedBy: true,
  reason: true,
  notes: true,
});

export const leadStatusHistoryRelations = relations(leadStatusHistory, ({ one }) => ({
  lead: one(contactMessages, {
    fields: [leadStatusHistory.leadId],
    references: [contactMessages.id],
  }),
  changedByUser: one(users, {
    fields: [leadStatusHistory.changedBy],
    references: [users.id],
  }),
}));

// Cálculos ROI
export const roiCalculations = pgTable("roi_calculations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  services: integer("services").notNull(),
  ticket: integer("ticket").notNull(),
  noisePercent: integer("noise_percent").notNull(),
  diagnosisValue: integer("diagnosis_value").notNull(),
  result: json("result").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCalculationSchema = createInsertSchema(roiCalculations).pick({
  userId: true,
  services: true,
  ticket: true,
  noisePercent: true,
  diagnosisValue: true,
  result: true,
});

export const calculationsRelations = relations(roiCalculations, ({ one }) => ({
  user: one(users, {
    fields: [roiCalculations.userId],
    references: [users.id],
  }),
}));

// Depoimentos
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  testimonial: text("testimonial").notNull(),
  mediaType: text("media_type").default("text"), // text, video, audio
  mediaUrl: text("media_url"),
  company: text("company"),
  statsJson: json("stats_json"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).pick({
  name: true,
  location: true,
  testimonial: true,
  mediaType: true,
  mediaUrl: true,
  company: true,
  statsJson: true,
  featured: true,
});

// Artigos do Blog
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  metaDescription: text("meta_description").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  featuredImage: text("featured_image"),
  authorId: integer("author_id").references(() => users.id),
  published: boolean("published").default(false),
  publishedAt: timestamp("published_at"),
  featured: boolean("featured").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  slug: true,
  title: true,
  metaDescription: true,
  content: true,
  excerpt: true,
  featuredImage: true,
  authorId: true,
  published: true,
  publishedAt: true,
  featured: true,
  tags: true,
});

export const blogRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));

// Grupos de Oficinas (para múltiplas filiais)
export const workshopGroups = pgTable("workshop_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Oficinas RuidCar
export const workshops = pgTable("workshops", {
  id: serial("id").primaryKey(),
  uniqueCode: text("unique_code").unique(), // Código único para identificação rápida (ex: RCW-1234)
  name: text("name").notNull(),
  address: text("address").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  website: text("website"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  city: text("city"),
  state: text("state"),
  active: boolean("active").default(true),
  ownerId: integer("owner_id").references(() => users.id), // Dono da oficina (usuário da tabela users)
  groupId: integer("group_id").references(() => workshopGroups.id),
  diagnosisPrice: integer("diagnosis_price"), // Preço em centavos
  adminNotes: text("admin_notes"),
  operatingHours: json("operating_hours"), // {mon: "8-18", tue: "8-18", ...}
  certifications: json("certifications"), // Array de certificações
  images: text("images").array(), // URLs das imagens
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
});

// Administradores das Oficinas
export const workshopAdmins = pgTable("workshop_admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").default("workshop_admin"), // workshop_admin, workshop_manager
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relacionamento entre Administradores e Oficinas
export const workshopAdminPermissions = pgTable("workshop_admin_permissions", {
  adminId: integer("admin_id").notNull().references(() => workshopAdmins.id),
  workshopId: integer("workshop_id").notNull().references(() => workshops.id),
  canEdit: boolean("can_edit").default(true),
  canViewReports: boolean("can_view_reports").default(true),
  canManageAppointments: boolean("can_manage_appointments").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  adminWorkshopKey: primaryKey({ columns: [table.adminId, table.workshopId] })
}));

// Agendamentos (ATUALIZADO com novos campos)
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").notNull().references(() => workshops.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleYear: text("vehicle_year").notNull(),
  vehicleCategory: text("vehicle_category"), // 'popular', 'medium', 'luxury'
  problemDescription: text("problem_description").notNull(),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(),
  status: text("status").default("pending"), // pending, confirmed, completed, cancelled
  appointmentDate: timestamp("appointment_date"),
  estimatedPrice: integer("estimated_price"), // Em centavos
  finalPrice: integer("final_price"), // Preço final em centavos
  workshopNotes: text("workshop_notes"),
  customerNotes: text("customer_notes"),
  source: text("source").default("website"), // website, phone, walk-in
  confirmationCode: text("confirmation_code"), // Código único de confirmação
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  serviceRating: integer("service_rating"), // 1-5
  customerConsent: json("customer_consent"), // Consentimentos LGPD
  reminderSentAt: timestamp("reminder_sent_at"),
  cancelledBy: text("cancelled_by"), // 'customer', 'workshop', 'system'
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Serviços das Oficinas
export const workshopServices = pgTable("workshop_services", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").notNull().references(() => workshops.id),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Preço em centavos
  duration: integer("duration"), // Duração em minutos
  isActive: boolean("is_active").default(true),
  category: text("category"), // diagnóstico, reparo, manutenção
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== NOVAS TABELAS PARA SISTEMA DE DIAGNÓSTICO ==========

// Configuração do Serviço de Diagnóstico
export const diagnosticServiceConfig = pgTable("diagnostic_service_config", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").notNull().references(() => workshops.id).unique(),
  isActive: boolean("is_active").default(false),
  status: text("status").default("disabled"), // 'disabled', 'configuring', 'active', 'suspended'
  suspensionReason: text("suspension_reason"),
  activatedAt: timestamp("activated_at"),
  deactivatedAt: timestamp("deactivated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Preços por Categoria de Veículo
export const vehiclePricing = pgTable("vehicle_pricing", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").notNull().references(() => workshops.id),
  category: text("category").notNull(), // 'popular', 'medium', 'luxury'
  price: integer("price").notNull(), // Preço em centavos
  estimatedDuration: integer("estimated_duration").default(60), // Duração em minutos
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Slots de Disponibilidade
export const appointmentSlots = pgTable("appointment_slots", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").notNull().references(() => workshops.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (domingo a sábado)
  startTime: text("start_time").notNull(), // Formato HH:MM
  endTime: text("end_time").notNull(), // Formato HH:MM
  capacity: integer("capacity").default(1), // Atendimentos simultâneos
  bufferMinutes: integer("buffer_minutes").default(15), // Buffer entre agendamentos
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exceções de Agenda (Feriados, Bloqueios, etc)
export const appointmentExceptions = pgTable("appointment_exceptions", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").notNull().references(() => workshops.id),
  date: text("date").notNull(), // Formato YYYY-MM-DD
  type: text("type").notNull(), // 'holiday', 'blocked', 'special'
  startTime: text("start_time"), // Formato HH:MM (opcional, se for o dia todo, null)
  endTime: text("end_time"), // Formato HH:MM (opcional, se for o dia todo, null)
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Configurações Gerais de Agendamento
export const appointmentSettings = pgTable("appointment_settings", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").notNull().references(() => workshops.id).unique(),
  minAdvanceHours: integer("min_advance_hours").default(2), // Antecedência mínima em horas
  maxAdvanceDays: integer("max_advance_days").default(30), // Janela máxima em dias
  cancellationHours: integer("cancellation_hours").default(24), // Prazo para cancelamento em horas
  noShowTolerance: integer("no_show_tolerance").default(15), // Tolerância em minutos
  autoConfirm: boolean("auto_confirm").default(false), // Confirmação automática
  sendReminders: boolean("send_reminders").default(true), // Enviar lembretes
  reminderHours: integer("reminder_hours").default(24), // Antecedência do lembrete em horas
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas de validação para as novas tabelas

export const insertWorkshopGroupSchema = createInsertSchema(workshopGroups).pick({
  name: true,
  description: true,
});

export const insertWorkshopSchema = createInsertSchema(workshops).pick({
  uniqueCode: true,
  name: true,
  address: true,
  contact: true,
  phone: true,
  website: true,
  latitude: true,
  longitude: true,
  city: true,
  state: true,
  active: true,
  groupId: true,
  diagnosisPrice: true,
  adminNotes: true,
  operatingHours: true,
  certifications: true,
  images: true,
});

export const insertWorkshopAdminSchema = createInsertSchema(workshopAdmins).pick({
  email: true,
  password: true,
  name: true,
  phone: true,
  role: true,
});

export const insertWorkshopAdminPermissionSchema = createInsertSchema(workshopAdminPermissions).pick({
  adminId: true,
  workshopId: true,
  canEdit: true,
  canViewReports: true,
  canManageAppointments: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  workshopId: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  vehicleModel: true,
  vehicleYear: true,
  problemDescription: true,
  preferredDate: true,
  preferredTime: true,
  status: true,
  appointmentDate: true,
  estimatedPrice: true,
  workshopNotes: true,
  customerNotes: true,
  source: true,
});

export const insertWorkshopServiceSchema = createInsertSchema(workshopServices).pick({
  workshopId: true,
  name: true,
  description: true,
  price: true,
  duration: true,
  isActive: true,
  category: true,
});

// Schemas de validação para o Sistema de Diagnóstico
export const insertDiagnosticServiceConfigSchema = createInsertSchema(diagnosticServiceConfig).pick({
  workshopId: true,
  isActive: true,
  status: true,
  suspensionReason: true,
});

export const insertVehiclePricingSchema = createInsertSchema(vehiclePricing).pick({
  workshopId: true,
  category: true,
  price: true,
  estimatedDuration: true,
  isActive: true,
});

export const insertAppointmentSlotSchema = createInsertSchema(appointmentSlots).pick({
  workshopId: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  capacity: true,
  bufferMinutes: true,
  isActive: true,
});

export const insertAppointmentExceptionSchema = createInsertSchema(appointmentExceptions).pick({
  workshopId: true,
  date: true,
  type: true,
  startTime: true,
  endTime: true,
  reason: true,
});

export const insertAppointmentSettingsSchema = createInsertSchema(appointmentSettings).pick({
  workshopId: true,
  minAdvanceHours: true,
  maxAdvanceDays: true,
  cancellationHours: true,
  noShowTolerance: true,
  autoConfirm: true,
  sendReminders: true,
  reminderHours: true,
});

// Relacionamentos

export const workshopGroupsRelations = relations(workshopGroups, ({ many }) => ({
  workshops: many(workshops),
}));

export const workshopsRelations = relations(workshops, ({ one, many }) => ({
  group: one(workshopGroups, {
    fields: [workshops.groupId],
    references: [workshopGroups.id],
  }),
  adminPermissions: many(workshopAdminPermissions),
  appointments: many(appointments),
  services: many(workshopServices),
}));

export const workshopAdminsRelations = relations(workshopAdmins, ({ many }) => ({
  permissions: many(workshopAdminPermissions),
}));

export const workshopAdminPermissionsRelations = relations(workshopAdminPermissions, ({ one }) => ({
  admin: one(workshopAdmins, {
    fields: [workshopAdminPermissions.adminId],
    references: [workshopAdmins.id],
  }),
  workshop: one(workshops, {
    fields: [workshopAdminPermissions.workshopId],
    references: [workshops.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  workshop: one(workshops, {
    fields: [appointments.workshopId],
    references: [workshops.id],
  }),
}));

export const workshopServicesRelations = relations(workshopServices, ({ one }) => ({
  workshop: one(workshops, {
    fields: [workshopServices.workshopId],
    references: [workshops.id],
  }),
}));

// Relacionamentos do Sistema de Diagnóstico
export const diagnosticServiceConfigRelations = relations(diagnosticServiceConfig, ({ one }) => ({
  workshop: one(workshops, {
    fields: [diagnosticServiceConfig.workshopId],
    references: [workshops.id],
  }),
}));

export const vehiclePricingRelations = relations(vehiclePricing, ({ one }) => ({
  workshop: one(workshops, {
    fields: [vehiclePricing.workshopId],
    references: [workshops.id],
  }),
}));

export const appointmentSlotsRelations = relations(appointmentSlots, ({ one }) => ({
  workshop: one(workshops, {
    fields: [appointmentSlots.workshopId],
    references: [workshops.id],
  }),
}));

export const appointmentExceptionsRelations = relations(appointmentExceptions, ({ one }) => ({
  workshop: one(workshops, {
    fields: [appointmentExceptions.workshopId],
    references: [workshops.id],
  }),
}));

export const appointmentSettingsRelations = relations(appointmentSettings, ({ one }) => ({
  workshop: one(workshops, {
    fields: [appointmentSettings.workshopId],
    references: [workshops.id],
  }),
}));

// Exportar tipos
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type LeadInteraction = typeof leadInteractions.$inferSelect;
export type InsertLeadInteraction = z.infer<typeof insertLeadInteractionSchema>;
export type LeadStatusHistory = typeof leadStatusHistory.$inferSelect;
export type InsertLeadStatusHistory = z.infer<typeof insertLeadStatusHistorySchema>;
export type InsertCalculation = z.infer<typeof insertCalculationSchema>;
export type RoiCalculation = typeof roiCalculations.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertWorkshop = z.infer<typeof insertWorkshopSchema>;
export type Workshop = typeof workshops.$inferSelect;

// Novos tipos para o painel das oficinas
export type InsertWorkshopGroup = z.infer<typeof insertWorkshopGroupSchema>;
export type WorkshopGroup = typeof workshopGroups.$inferSelect;
export type InsertWorkshopAdmin = z.infer<typeof insertWorkshopAdminSchema>;
export type WorkshopAdmin = typeof workshopAdmins.$inferSelect;
export type InsertWorkshopAdminPermission = z.infer<typeof insertWorkshopAdminPermissionSchema>;
export type WorkshopAdminPermission = typeof workshopAdminPermissions.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertWorkshopService = z.infer<typeof insertWorkshopServiceSchema>;
export type WorkshopService = typeof workshopServices.$inferSelect;

// Tipos do Sistema de Diagnóstico
export type InsertDiagnosticServiceConfig = z.infer<typeof insertDiagnosticServiceConfigSchema>;
export type DiagnosticServiceConfig = typeof diagnosticServiceConfig.$inferSelect;
export type InsertVehiclePricing = z.infer<typeof insertVehiclePricingSchema>;
export type VehiclePricing = typeof vehiclePricing.$inferSelect;
export type InsertAppointmentSlot = z.infer<typeof insertAppointmentSlotSchema>;
export type AppointmentSlot = typeof appointmentSlots.$inferSelect;
export type InsertAppointmentException = z.infer<typeof insertAppointmentExceptionSchema>;
export type AppointmentException = typeof appointmentExceptions.$inferSelect;
export type InsertAppointmentSettings = z.infer<typeof insertAppointmentSettingsSchema>;
export type AppointmentSettings = typeof appointmentSettings.$inferSelect;
