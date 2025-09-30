import {
  users,
  contactMessages,
  roiCalculations,
  testimonials,
  blogPosts,
  workshops,
  workshopAdmins,
  workshopAdminPermissions,
  appointments,
  workshopServices,
  workshopGroups,
  type User,
  type InsertUser,
  type ContactMessage,
  type InsertContact,
  type RoiCalculation,
  type InsertCalculation,
  type Testimonial,
  type InsertTestimonial,
  type BlogPost,
  type InsertBlogPost,
  type Workshop,
  type InsertWorkshop,
  type WorkshopAdmin,
  type InsertWorkshopAdmin,
  type WorkshopAdminPermission,
  type InsertWorkshopAdminPermission,
  type Appointment,
  type InsertAppointment,
  type WorkshopService,
  type InsertWorkshopService,
  type WorkshopGroup,
  type InsertWorkshopGroup
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Mensagens de contato
  createContactMessage(message: InsertContact): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  getContactMessageById(id: number): Promise<ContactMessage | undefined>;
  markContactAsResponded(id: number): Promise<void>;

  // Cálculos ROI
  createCalculation(calculation: InsertCalculation): Promise<RoiCalculation>;
  getCalculationsByUserId(userId: number): Promise<RoiCalculation[]>;
  getCalculationById(id: number): Promise<RoiCalculation | undefined>;

  // Depoimentos
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  getTestimonials(): Promise<Testimonial[]>;
  getFeaturedTestimonials(): Promise<Testimonial[]>;
  getTestimonialById(id: number): Promise<Testimonial | undefined>;

  // Blog
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getFeaturedBlogPosts(): Promise<BlogPost[]>;
  getBlogPostById(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;

  // Oficinas
  createWorkshop(workshop: InsertWorkshop): Promise<Workshop>;
  getWorkshops(): Promise<Workshop[]>;
  getActiveWorkshops(): Promise<Workshop[]>;
  getWorkshopById(id: number): Promise<Workshop | undefined>;
  getWorkshopsByState(state: string): Promise<Workshop[]>;
  getWorkshopsByCity(city: string): Promise<Workshop[]>;
  updateWorkshop(id: number, workshop: Partial<InsertWorkshop>): Promise<Workshop>;
  deleteWorkshop(id: number): Promise<void>;
  createManyWorkshops(workshops: InsertWorkshop[]): Promise<Workshop[]>;

  // Workshop Admins
  createWorkshopAdmin(admin: InsertWorkshopAdmin): Promise<WorkshopAdmin>;
  getWorkshopAdminById(id: number): Promise<WorkshopAdmin | undefined>;
  getWorkshopAdminByEmail(email: string): Promise<WorkshopAdmin | undefined>;
  updateWorkshopAdmin(id: number, admin: Partial<InsertWorkshopAdmin>): Promise<WorkshopAdmin>;
  updateWorkshopAdminLastLogin(id: number): Promise<void>;

  // Workshop Admin Permissions
  createWorkshopAdminPermission(permission: InsertWorkshopAdminPermission): Promise<WorkshopAdminPermission>;
  getWorkshopAdminPermissions(adminId: number): Promise<WorkshopAdminPermission[]>;
  getWorkshopsByAdminId(adminId: number): Promise<Workshop[]>;
  updateWorkshopAdminPermission(adminId: number, workshopId: number, permission: Partial<InsertWorkshopAdminPermission>): Promise<WorkshopAdminPermission>;

  // Appointments
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentsByWorkshopId(workshopId: number): Promise<Appointment[]>;
  getAppointmentById(id: number): Promise<Appointment | undefined>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;

  // Workshop Services
  createWorkshopService(service: InsertWorkshopService): Promise<WorkshopService>;
  getWorkshopServicesByWorkshopId(workshopId: number): Promise<WorkshopService[]>;
  getWorkshopServiceById(id: number): Promise<WorkshopService | undefined>;
  updateWorkshopService(id: number, service: Partial<InsertWorkshopService>): Promise<WorkshopService>;
  deleteWorkshopService(id: number): Promise<void>;

  // Workshop Groups
  createWorkshopGroup(group: InsertWorkshopGroup): Promise<WorkshopGroup>;
  getWorkshopGroups(): Promise<WorkshopGroup[]>;
  getWorkshopGroupById(id: number): Promise<WorkshopGroup | undefined>;
  updateWorkshopGroup(id: number, group: Partial<InsertWorkshopGroup>): Promise<WorkshopGroup>;
  deleteWorkshopGroup(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Usuários
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Mensagens de contato
  async createContactMessage(message: InsertContact): Promise<ContactMessage> {
    const [contactMessage] = await db
      .insert(contactMessages)
      .values(message)
      .returning();
    return contactMessage;
  }
  
  async getContactMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages).orderBy(contactMessages.createdAt);
  }
  
  async getContactMessageById(id: number): Promise<ContactMessage | undefined> {
    const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
    return message;
  }
  
  async markContactAsResponded(id: number): Promise<void> {
    await db.update(contactMessages)
      .set({ responded: true })
      .where(eq(contactMessages.id, id));
  }
  
  // Cálculos ROI
  async createCalculation(calculation: InsertCalculation): Promise<RoiCalculation> {
    const [roiCalc] = await db
      .insert(roiCalculations)
      .values(calculation)
      .returning();
    return roiCalc;
  }
  
  async getCalculationsByUserId(userId: number): Promise<RoiCalculation[]> {
    return db.select()
      .from(roiCalculations)
      .where(eq(roiCalculations.userId, userId))
      .orderBy(roiCalculations.createdAt);
  }
  
  async getCalculationById(id: number): Promise<RoiCalculation | undefined> {
    const [calculation] = await db
      .select()
      .from(roiCalculations)
      .where(eq(roiCalculations.id, id));
    return calculation;
  }
  
  // Depoimentos
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [newTestimonial] = await db
      .insert(testimonials)
      .values(testimonial)
      .returning();
    return newTestimonial;
  }
  
  async getTestimonials(): Promise<Testimonial[]> {
    return db.select()
      .from(testimonials)
      .orderBy(testimonials.createdAt);
  }
  
  async getFeaturedTestimonials(): Promise<Testimonial[]> {
    return db.select()
      .from(testimonials)
      .where(eq(testimonials.featured, true))
      .orderBy(testimonials.createdAt);
  }
  
  async getTestimonialById(id: number): Promise<Testimonial | undefined> {
    const [testimonial] = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.id, id));
    return testimonial;
  }
  
  // Blog
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db
      .insert(blogPosts)
      .values(post)
      .returning();
    return newPost;
  }
  
  async getBlogPosts(): Promise<BlogPost[]> {
    return db.select()
      .from(blogPosts)
      .orderBy(blogPosts.createdAt);
  }
  
  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return db.select()
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(blogPosts.publishedAt);
  }
  
  async getFeaturedBlogPosts(): Promise<BlogPost[]> {
    return db.select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.published, true),
        eq(blogPosts.featured, true)
      ))
      .orderBy(blogPosts.publishedAt);
  }
  
  async getBlogPostById(id: number): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));
    return post;
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    return post;
  }
  
  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [updatedPost] = await db
      .update(blogPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }
  
  async deleteBlogPost(id: number): Promise<void> {
    await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id));
  }

  // Oficinas
  async createWorkshop(workshop: InsertWorkshop): Promise<Workshop> {
    const [newWorkshop] = await db
      .insert(workshops)
      .values(workshop)
      .returning();
    return newWorkshop;
  }

  async getWorkshops(): Promise<Workshop[]> {
    return db.select()
      .from(workshops)
      .orderBy(workshops.name);
  }

  async getActiveWorkshops(): Promise<Workshop[]> {
    return db.select()
      .from(workshops)
      .where(eq(workshops.active, true))
      .orderBy(workshops.name);
  }

  async getWorkshopById(id: number): Promise<Workshop | undefined> {
    const [workshop] = await db
      .select()
      .from(workshops)
      .where(eq(workshops.id, id));
    return workshop;
  }

  async getWorkshopsByState(state: string): Promise<Workshop[]> {
    return db.select()
      .from(workshops)
      .where(and(
        eq(workshops.state, state),
        eq(workshops.active, true)
      ))
      .orderBy(workshops.city);
  }

  async getWorkshopsByCity(city: string): Promise<Workshop[]> {
    return db.select()
      .from(workshops)
      .where(and(
        eq(workshops.city, city),
        eq(workshops.active, true)
      ))
      .orderBy(workshops.name);
  }

  async updateWorkshop(id: number, workshop: Partial<InsertWorkshop>): Promise<Workshop> {
    const [updatedWorkshop] = await db
      .update(workshops)
      .set({ ...workshop, updatedAt: new Date() })
      .where(eq(workshops.id, id))
      .returning();
    return updatedWorkshop;
  }

  async deleteWorkshop(id: number): Promise<void> {
    await db
      .delete(workshops)
      .where(eq(workshops.id, id));
  }

  async createManyWorkshops(workshopsData: InsertWorkshop[]): Promise<Workshop[]> {
    if (workshopsData.length === 0) return [];

    const newWorkshops = await db
      .insert(workshops)
      .values(workshopsData)
      .returning();
    return newWorkshops;
  }

  // Workshop Admins
  async createWorkshopAdmin(admin: InsertWorkshopAdmin): Promise<WorkshopAdmin> {
    const [newAdmin] = await db
      .insert(workshopAdmins)
      .values(admin)
      .returning();
    return newAdmin;
  }

  async getWorkshopAdminById(id: number): Promise<WorkshopAdmin | undefined> {
    const [admin] = await db
      .select()
      .from(workshopAdmins)
      .where(eq(workshopAdmins.id, id));
    return admin;
  }

  async getWorkshopAdminByEmail(email: string): Promise<WorkshopAdmin | undefined> {
    const [admin] = await db
      .select()
      .from(workshopAdmins)
      .where(eq(workshopAdmins.email, email));
    return admin;
  }

  async updateWorkshopAdmin(id: number, admin: Partial<InsertWorkshopAdmin>): Promise<WorkshopAdmin> {
    const [updatedAdmin] = await db
      .update(workshopAdmins)
      .set({ ...admin, updatedAt: new Date() })
      .where(eq(workshopAdmins.id, id))
      .returning();
    return updatedAdmin;
  }

  async updateWorkshopAdminLastLogin(id: number): Promise<void> {
    await db
      .update(workshopAdmins)
      .set({ lastLogin: new Date(), updatedAt: new Date() })
      .where(eq(workshopAdmins.id, id));
  }

  // Workshop Admin Permissions
  async createWorkshopAdminPermission(permission: InsertWorkshopAdminPermission): Promise<WorkshopAdminPermission> {
    const [newPermission] = await db
      .insert(workshopAdminPermissions)
      .values(permission)
      .returning();
    return newPermission;
  }

  async getWorkshopAdminPermissions(adminId: number): Promise<WorkshopAdminPermission[]> {
    return db
      .select()
      .from(workshopAdminPermissions)
      .where(eq(workshopAdminPermissions.adminId, adminId));
  }

  async getWorkshopsByAdminId(adminId: number): Promise<Workshop[]> {
    return db
      .select({
        id: workshops.id,
        name: workshops.name,
        address: workshops.address,
        contact: workshops.contact,
        phone: workshops.phone,
        website: workshops.website,
        latitude: workshops.latitude,
        longitude: workshops.longitude,
        city: workshops.city,
        state: workshops.state,
        active: workshops.active,
        groupId: workshops.groupId,
        diagnosisPrice: workshops.diagnosisPrice,
        adminNotes: workshops.adminNotes,
        operatingHours: workshops.operatingHours,
        certifications: workshops.certifications,
        images: workshops.images,
        createdAt: workshops.createdAt,
        updatedAt: workshops.updatedAt,
      })
      .from(workshops)
      .innerJoin(workshopAdminPermissions, eq(workshops.id, workshopAdminPermissions.workshopId))
      .where(eq(workshopAdminPermissions.adminId, adminId));
  }

  async updateWorkshopAdminPermission(adminId: number, workshopId: number, permission: Partial<InsertWorkshopAdminPermission>): Promise<WorkshopAdminPermission> {
    const [updatedPermission] = await db
      .update(workshopAdminPermissions)
      .set(permission)
      .where(and(
        eq(workshopAdminPermissions.adminId, adminId),
        eq(workshopAdminPermissions.workshopId, workshopId)
      ))
      .returning();
    return updatedPermission;
  }

  // Appointments
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    return newAppointment;
  }

  async getAppointmentsByWorkshopId(workshopId: number): Promise<Appointment[]> {
    return db
      .select()
      .from(appointments)
      .where(eq(appointments.workshopId, workshopId))
      .orderBy(appointments.createdAt);
  }

  async getAppointmentById(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    return appointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db
      .delete(appointments)
      .where(eq(appointments.id, id));
  }

  // Workshop Services
  async createWorkshopService(service: InsertWorkshopService): Promise<WorkshopService> {
    const [newService] = await db
      .insert(workshopServices)
      .values(service)
      .returning();
    return newService;
  }

  async getWorkshopServicesByWorkshopId(workshopId: number): Promise<WorkshopService[]> {
    return db
      .select()
      .from(workshopServices)
      .where(eq(workshopServices.workshopId, workshopId))
      .orderBy(workshopServices.name);
  }

  async getWorkshopServiceById(id: number): Promise<WorkshopService | undefined> {
    const [service] = await db
      .select()
      .from(workshopServices)
      .where(eq(workshopServices.id, id));
    return service;
  }

  async updateWorkshopService(id: number, service: Partial<InsertWorkshopService>): Promise<WorkshopService> {
    const [updatedService] = await db
      .update(workshopServices)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(workshopServices.id, id))
      .returning();
    return updatedService;
  }

  async deleteWorkshopService(id: number): Promise<void> {
    await db
      .delete(workshopServices)
      .where(eq(workshopServices.id, id));
  }

  // Workshop Groups
  async createWorkshopGroup(group: InsertWorkshopGroup): Promise<WorkshopGroup> {
    const [newGroup] = await db
      .insert(workshopGroups)
      .values(group)
      .returning();
    return newGroup;
  }

  async getWorkshopGroups(): Promise<WorkshopGroup[]> {
    return db
      .select()
      .from(workshopGroups)
      .orderBy(workshopGroups.name);
  }

  async getWorkshopGroupById(id: number): Promise<WorkshopGroup | undefined> {
    const [group] = await db
      .select()
      .from(workshopGroups)
      .where(eq(workshopGroups.id, id));
    return group;
  }

  async updateWorkshopGroup(id: number, group: Partial<InsertWorkshopGroup>): Promise<WorkshopGroup> {
    const [updatedGroup] = await db
      .update(workshopGroups)
      .set({ ...group, updatedAt: new Date() })
      .where(eq(workshopGroups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteWorkshopGroup(id: number): Promise<void> {
    await db
      .delete(workshopGroups)
      .where(eq(workshopGroups.id, id));
  }
}

export const storage = new DatabaseStorage();
