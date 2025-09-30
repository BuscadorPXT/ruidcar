import type { Request, Response, Router } from "express";
import { db } from "../db";
import { workshops, workshopAdmins } from "../../shared/schema";
import { eq, and, or, desc, isNull } from "drizzle-orm";
import { authenticateUser, hasRole } from "../middleware/auth";

// Interface para notificações (em memória por enquanto)
interface Notification {
  id: string;
  userId: number;
  type: 'workshop_pending' | 'workshop_approved' | 'workshop_rejected' | 'general';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: any;
}

// Armazenamento em memória (substituir por banco de dados em produção)
const notificationsStore = new Map<number, Notification[]>();

// Função para criar notificação
function createNotification(
  userId: number,
  type: Notification['type'],
  title: string,
  message: string,
  actionUrl?: string,
  metadata?: any
): Notification {
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title,
    message,
    timestamp: new Date(),
    read: false,
    actionUrl,
    metadata
  };

  // Adicionar ao store
  if (!notificationsStore.has(userId)) {
    notificationsStore.set(userId, []);
  }
  notificationsStore.get(userId)!.push(notification);

  return notification;
}

// Função para buscar notificações do usuário
function getUserNotifications(userId: number): Notification[] {
  return notificationsStore.get(userId) || [];
}

export function createNotificationRoutes(app: Router) {

  // ============================================
  // 1. BUSCAR NOTIFICAÇÕES DO USUÁRIO
  // ============================================
  app.get("/api/notifications", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          message: "Não autenticado",
          code: "NOT_AUTHENTICATED"
        });
      }

      // Buscar notificações do usuário
      let notifications = getUserNotifications(user.userId);

      // Se for admin, adicionar notificação de oficinas pendentes
      if (hasRole(user, 'ADMIN')) {
        // Buscar oficinas pendentes
        const pendingWorkshops = await db
          .select({
            id: workshops.id,
            name: workshops.name,
            createdAt: workshops.createdAt
          })
          .from(workshops)
          .where(eq(workshops.active, false))
          .orderBy(desc(workshops.createdAt))
          .limit(5);

        // Criar notificações para oficinas pendentes
        for (const workshop of pendingWorkshops) {
          const existingNotif = notifications.find(n =>
            n.type === 'workshop_pending' &&
            n.metadata?.workshopId === workshop.id
          );

          if (!existingNotif) {
            createNotification(
              user.userId,
              'workshop_pending',
              'Nova oficina aguardando aprovação',
              `${workshop.name} cadastrou-se e aguarda sua aprovação`,
              '/admin/workshops/pending',
              { workshopId: workshop.id }
            );
          }
        }

        // Recarregar notificações
        notifications = getUserNotifications(user.userId);
      }

      // Se for dono de oficina, verificar status da aprovação
      if (hasRole(user, 'OFICINA_OWNER')) {
        // Buscar oficinas do usuário
        const userWorkshops = await db
          .select({
            workshop: workshops,
            admin: workshopAdmins
          })
          .from(workshopAdmins)
          .innerJoin(workshops, eq(workshops.id, workshopAdmins.workshopId))
          .where(eq(workshopAdmins.email, user.email));

        for (const { workshop } of userWorkshops) {
          // Se foi aprovada recentemente (últimas 24h)
          const approvedRecently = workshop.active &&
            workshop.updatedAt &&
            (Date.now() - new Date(workshop.updatedAt).getTime()) < 24 * 60 * 60 * 1000;

          if (approvedRecently) {
            const existingNotif = notifications.find(n =>
              n.type === 'workshop_approved' &&
              n.metadata?.workshopId === workshop.id
            );

            if (!existingNotif) {
              createNotification(
                user.userId,
                'workshop_approved',
                'Oficina aprovada!',
                `Parabéns! ${workshop.name} foi aprovada e já está visível no mapa.`,
                '/workshop/dashboard',
                { workshopId: workshop.id }
              );
            }
          }
        }

        // Recarregar notificações
        notifications = getUserNotifications(user.userId);
      }

      // Ordenar por data (mais recentes primeiro)
      notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return res.json({
        notifications: notifications.slice(0, 20) // Limitar a 20 notificações
      });

    } catch (error) {
      console.error("❌ Erro ao buscar notificações:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      });
    }
  });

  // ============================================
  // 2. MARCAR NOTIFICAÇÃO COMO LIDA
  // ============================================
  app.post("/api/notifications/:id/read", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const notificationId = req.params.id;

      if (!user) {
        return res.status(401).json({
          message: "Não autenticado",
          code: "NOT_AUTHENTICATED"
        });
      }

      const notifications = getUserNotifications(user.userId);
      const notification = notifications.find(n => n.id === notificationId);

      if (!notification) {
        return res.status(404).json({
          message: "Notificação não encontrada",
          code: "NOT_FOUND"
        });
      }

      // Marcar como lida
      notification.read = true;

      return res.json({
        message: "Notificação marcada como lida",
        notification
      });

    } catch (error) {
      console.error("❌ Erro ao marcar notificação como lida:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      });
    }
  });

  // ============================================
  // 3. MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS
  // ============================================
  app.post("/api/notifications/read-all", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          message: "Não autenticado",
          code: "NOT_AUTHENTICATED"
        });
      }

      const notifications = getUserNotifications(user.userId);
      notifications.forEach(n => { n.read = true; });

      return res.json({
        message: "Todas as notificações foram marcadas como lidas",
        count: notifications.length
      });

    } catch (error) {
      console.error("❌ Erro ao marcar todas como lidas:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      });
    }
  });

  // ============================================
  // 4. DELETAR NOTIFICAÇÃO
  // ============================================
  app.delete("/api/notifications/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const notificationId = req.params.id;

      if (!user) {
        return res.status(401).json({
          message: "Não autenticado",
          code: "NOT_AUTHENTICATED"
        });
      }

      const notifications = getUserNotifications(user.userId);
      const index = notifications.findIndex(n => n.id === notificationId);

      if (index === -1) {
        return res.status(404).json({
          message: "Notificação não encontrada",
          code: "NOT_FOUND"
        });
      }

      // Remover notificação
      notifications.splice(index, 1);

      return res.json({
        message: "Notificação removida com sucesso"
      });

    } catch (error) {
      console.error("❌ Erro ao deletar notificação:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      });
    }
  });

  // ============================================
  // 5. CRIAR NOTIFICAÇÃO (ADMIN ONLY)
  // ============================================
  app.post("/api/notifications/create", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = req.user;

      if (!user || !hasRole(user, 'ADMIN')) {
        return res.status(403).json({
          message: "Acesso negado",
          code: "ACCESS_DENIED"
        });
      }

      const { userId, type, title, message, actionUrl, metadata } = req.body;

      if (!userId || !type || !title || !message) {
        return res.status(400).json({
          message: "Dados incompletos",
          code: "MISSING_DATA"
        });
      }

      const notification = createNotification(
        userId,
        type,
        title,
        message,
        actionUrl,
        metadata
      );

      return res.json({
        message: "Notificação criada com sucesso",
        notification
      });

    } catch (error) {
      console.error("❌ Erro ao criar notificação:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      });
    }
  });

  console.log('✅ Rotas de notificações criadas');
}