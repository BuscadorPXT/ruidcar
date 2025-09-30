import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { db } from './db';
import { contactMessages, leadInteractions, users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

interface LeadNotification {
  type: 'new_lead' | 'lead_updated' | 'lead_assigned' | 'new_interaction' | 'status_changed';
  leadId: number;
  data: any;
  timestamp: Date;
}

export function initializeWebSocket(server: HTTPServer) {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? 'https://ruidcar.com.br'
        : 'http://localhost:3000',
      credentials: true,
    },
    path: '/socket.io/',
  });

  // Track connected admin users
  const adminConnections = new Map<string, Set<string>>(); // userId -> socketIds

  io.on('connection', (socket: Socket) => {
    console.log('🔌 New WebSocket connection:', socket.id);

    // Handle admin joining
    socket.on('join-admin', async (userId: string) => {
      console.log(`👤 Admin ${userId} joined`);

      // Add to admin room
      socket.join('admin-room');
      socket.join(`admin-${userId}`);

      // Track connection
      if (!adminConnections.has(userId)) {
        adminConnections.set(userId, new Set());
      }
      adminConnections.get(userId)!.add(socket.id);

      // Send initial statistics
      try {
        const [{ newLeadsCount }] = await db
          .select({
            newLeadsCount: sql<number>`COUNT(CASE WHEN status = 'new' THEN 1 END)`
          })
          .from(contactMessages);

        socket.emit('lead-stats', {
          newLeadsCount,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error fetching lead stats:', error);
      }
    });

    // Handle leaving admin room
    socket.on('leave-admin', (userId: string) => {
      socket.leave('admin-room');
      socket.leave(`admin-${userId}`);

      const connections = adminConnections.get(userId);
      if (connections) {
        connections.delete(socket.id);
        if (connections.size === 0) {
          adminConnections.delete(userId);
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected:', socket.id);

      // Remove from all admin connections
      for (const [userId, socketIds] of adminConnections.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) {
            adminConnections.delete(userId);
          }
          break;
        }
      }
    });
  });

  // Helper function to emit lead events
  const emitLeadEvent = (event: LeadNotification) => {
    io.to('admin-room').emit('lead-event', event);
  };

  // Helper function to emit lead stats update
  const emitLeadStatsUpdate = async () => {
    try {
      const stats = await db.execute(sql`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count,
          COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_count,
          COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_count,
          COUNT(CASE WHEN status = 'closed_won' THEN 1 END) as won_count
        FROM contact_messages
      `);

      io.to('admin-room').emit('lead-stats-update', {
        stats: stats.rows[0],
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error emitting lead stats update:', error);
    }
  };

  return {
    io,
    emitLeadEvent,
    emitLeadStatsUpdate,

    // Emit specific events
    notifyNewLead: async (leadId: number) => {
      try {
        const [lead] = await db
          .select()
          .from(contactMessages)
          .where(eq(contactMessages.id, leadId));

        if (lead) {
          const notification: LeadNotification = {
            type: 'new_lead',
            leadId,
            data: lead,
            timestamp: new Date()
          };

          emitLeadEvent(notification);
          await emitLeadStatsUpdate();

          console.log(`📨 Notified new lead: ${leadId}`);
        }
      } catch (error) {
        console.error('Error notifying new lead:', error);
      }
    },

    notifyLeadStatusChange: async (leadId: number, oldStatus: string, newStatus: string, userId: number) => {
      try {
        const [lead] = await db
          .select()
          .from(contactMessages)
          .where(eq(contactMessages.id, leadId));

        if (lead) {
          const notification: LeadNotification = {
            type: 'status_changed',
            leadId,
            data: {
              lead,
              oldStatus,
              newStatus,
              changedBy: userId
            },
            timestamp: new Date()
          };

          emitLeadEvent(notification);
          await emitLeadStatsUpdate();

          console.log(`🔄 Notified status change for lead ${leadId}: ${oldStatus} -> ${newStatus}`);
        }
      } catch (error) {
        console.error('Error notifying status change:', error);
      }
    },

    notifyLeadAssigned: async (leadId: number, assignedToUserId: number, assignedByUserId: number) => {
      try {
        const [lead] = await db
          .select({
            lead: contactMessages,
            assignedUser: users
          })
          .from(contactMessages)
          .leftJoin(users, eq(contactMessages.assignedTo, users.id))
          .where(eq(contactMessages.id, leadId));

        if (lead) {
          const notification: LeadNotification = {
            type: 'lead_assigned',
            leadId,
            data: {
              lead: lead.lead,
              assignedTo: lead.assignedUser,
              assignedBy: assignedByUserId
            },
            timestamp: new Date()
          };

          emitLeadEvent(notification);

          // Also notify the specific user who got the lead assigned
          if (lead.assignedUser) {
            io.to(`admin-${assignedToUserId}`).emit('lead-assigned-to-you', notification);
          }

          console.log(`👤 Notified lead ${leadId} assigned to user ${assignedToUserId}`);
        }
      } catch (error) {
        console.error('Error notifying lead assignment:', error);
      }
    },

    notifyNewInteraction: async (leadId: number, interactionId: number) => {
      try {
        const [interaction] = await db
          .select({
            interaction: leadInteractions,
            user: users,
            lead: contactMessages
          })
          .from(leadInteractions)
          .leftJoin(users, eq(leadInteractions.userId, users.id))
          .leftJoin(contactMessages, eq(leadInteractions.leadId, contactMessages.id))
          .where(eq(leadInteractions.id, interactionId));

        if (interaction) {
          const notification: LeadNotification = {
            type: 'new_interaction',
            leadId,
            data: {
              interaction: interaction.interaction,
              user: interaction.user,
              lead: interaction.lead
            },
            timestamp: new Date()
          };

          emitLeadEvent(notification);

          console.log(`💬 Notified new interaction on lead ${leadId}`);
        }
      } catch (error) {
        console.error('Error notifying new interaction:', error);
      }
    },
  };
}

export type WebSocketServer = ReturnType<typeof initializeWebSocket>;