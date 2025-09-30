import type { Request, Response, Router } from "express";
import { db } from "../db";
import { workshops, workshopAdmins } from "../../shared/schema";
import { eq, or, and } from "drizzle-orm";

interface WorkshopStatus {
  found: boolean;
  workshop?: {
    id: number;
    name: string;
    code: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    rejectionReason?: string;
    adminEmail?: string;
  };
}

export function createWorkshopStatusRoutes(app: Router) {

  // ============================================
  // 1. VERIFICAR STATUS DA OFICINA
  // ============================================
  app.post("/api/workshops/check-status", async (req: Request, res: Response) => {
    try {
      const { identifier } = req.body;

      if (!identifier || identifier.trim().length < 3) {
        return res.status(400).json({
          message: "Código ou email inválido",
          code: "INVALID_IDENTIFIER"
        });
      }

      const searchValue = identifier.trim().toLowerCase();

      // Buscar por código ou email
      let workshop;
      let adminEmail: string | undefined;

      // Primeiro tentar buscar por código
      if (searchValue.includes('rcw-') || searchValue.includes('RCW-')) {
        const result = await db
          .select()
          .from(workshops)
          .where(eq(workshops.uniqueCode, searchValue.toUpperCase()))
          .limit(1);

        if (result.length > 0) {
          workshop = result[0];

          // Buscar email do admin se existir
          const adminResult = await db
            .select({ email: workshopAdmins.email })
            .from(workshopAdmins)
            .where(eq(workshopAdmins.workshopId, workshop.id))
            .limit(1);

          if (adminResult.length > 0) {
            adminEmail = adminResult[0].email;
          }
        }
      }

      // Se não encontrou por código, tentar por email
      if (!workshop && searchValue.includes('@')) {
        const adminResult = await db
          .select({
            workshop: workshops,
            adminEmail: workshopAdmins.email
          })
          .from(workshopAdmins)
          .innerJoin(workshops, eq(workshops.id, workshopAdmins.workshopId))
          .where(eq(workshopAdmins.email, searchValue))
          .limit(1);

        if (adminResult.length > 0) {
          workshop = adminResult[0].workshop;
          adminEmail = adminResult[0].adminEmail;
        }
      }

      // Se não encontrou nada
      if (!workshop) {
        return res.json({
          found: false
        } as WorkshopStatus);
      }

      // Determinar status
      let status: 'pending' | 'approved' | 'rejected' = 'pending';
      let rejectionReason: string | undefined;

      if (workshop.active) {
        status = 'approved';
      } else if (workshop.rejectedAt) {
        status = 'rejected';
        rejectionReason = workshop.rejectionReason || 'Motivo não informado';
      }

      // Montar resposta
      const response: WorkshopStatus = {
        found: true,
        workshop: {
          id: workshop.id,
          name: workshop.name,
          code: workshop.uniqueCode,
          status,
          createdAt: workshop.createdAt.toISOString(),
          updatedAt: workshop.updatedAt?.toISOString() || workshop.createdAt.toISOString(),
          rejectionReason,
          adminEmail
        }
      };

      return res.json(response);

    } catch (error) {
      console.error("❌ Erro ao verificar status da oficina:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      });
    }
  });

  // ============================================
  // 2. BUSCAR OFICINA POR CÓDIGO (endpoint alternativo)
  // ============================================
  app.get("/api/workshops/search-by-code/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;

      if (!code || code.trim().length < 3) {
        return res.status(400).json({
          found: false,
          message: "Código inválido"
        });
      }

      const searchCode = code.trim().toUpperCase();

      // Buscar oficina por código
      const result = await db
        .select()
        .from(workshops)
        .where(eq(workshops.uniqueCode, searchCode))
        .limit(1);

      if (result.length === 0) {
        return res.json({
          found: false,
          message: "Oficina não encontrada com este código"
        });
      }

      const workshop = result[0];

      return res.json({
        found: true,
        workshop: {
          id: workshop.id,
          name: workshop.name,
          address: workshop.address,
          city: workshop.city,
          state: workshop.state,
          phone: workshop.phone,
          active: workshop.active,
          uniqueCode: workshop.uniqueCode
        }
      });

    } catch (error) {
      console.error("❌ Erro ao buscar oficina por código:", error);
      return res.status(500).json({
        found: false,
        message: "Erro ao buscar oficina"
      });
    }
  });

  // ============================================
  // 3. LISTAR OFICINAS PENDENTES (ADMIN)
  // ============================================
  app.get("/api/admin/workshops/pending", async (req: Request, res: Response) => {
    try {
      // Buscar oficinas pendentes (não ativas e não rejeitadas)
      const pendingWorkshops = await db
        .select({
          workshop: workshops,
          admin: {
            name: workshopAdmins.name,
            email: workshopAdmins.email,
            phone: workshopAdmins.phone,
            createdAt: workshopAdmins.createdAt
          }
        })
        .from(workshops)
        .leftJoin(workshopAdmins, eq(workshops.id, workshopAdmins.workshopId))
        .where(
          and(
            eq(workshops.active, false),
            eq(workshops.rejectedAt, null)
          )
        )
        .orderBy(workshops.createdAt);

      // Formatar resposta
      const formattedWorkshops = pendingWorkshops.map(({ workshop, admin }) => {
        const daysSinceCreation = Math.floor(
          (Date.now() - workshop.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: workshop.id,
          name: workshop.name,
          address: workshop.address,
          city: workshop.city,
          state: workshop.state,
          phone: workshop.phone,
          uniqueCode: workshop.uniqueCode,
          latitude: workshop.latitude,
          longitude: workshop.longitude,
          active: workshop.active,
          createdAt: workshop.createdAt.toISOString(),
          daysSinceCreation,
          admin: admin ? {
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            createdAt: admin.createdAt?.toISOString()
          } : null
        };
      });

      return res.json({
        workshops: formattedWorkshops
      });

    } catch (error) {
      console.error("❌ Erro ao buscar oficinas pendentes:", error);
      return res.status(500).json({
        message: "Erro ao buscar oficinas pendentes",
        workshops: []
      });
    }
  });

  // ============================================
  // 4. APROVAR OFICINA (ADMIN)
  // ============================================
  app.post("/api/admin/workshops/:id/approve", async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.id);

      if (!workshopId) {
        return res.status(400).json({
          message: "ID da oficina inválido"
        });
      }

      // Atualizar status da oficina
      const result = await db
        .update(workshops)
        .set({
          active: true,
          updatedAt: new Date(),
          rejectedAt: null,
          rejectionReason: null
        })
        .where(eq(workshops.id, workshopId))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          message: "Oficina não encontrada"
        });
      }

      // TODO: Enviar email de aprovação para o admin da oficina

      return res.json({
        message: "Oficina aprovada com sucesso",
        workshop: result[0]
      });

    } catch (error) {
      console.error("❌ Erro ao aprovar oficina:", error);
      return res.status(500).json({
        message: "Erro ao aprovar oficina"
      });
    }
  });

  // ============================================
  // 5. REJEITAR OFICINA (ADMIN)
  // ============================================
  app.post("/api/admin/workshops/:id/reject", async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.id);
      const { reason } = req.body;

      if (!workshopId) {
        return res.status(400).json({
          message: "ID da oficina inválido"
        });
      }

      // Atualizar status da oficina
      const result = await db
        .update(workshops)
        .set({
          active: false,
          updatedAt: new Date(),
          rejectedAt: new Date(),
          rejectionReason: reason || 'Não atende aos critérios'
        })
        .where(eq(workshops.id, workshopId))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          message: "Oficina não encontrada"
        });
      }

      // TODO: Enviar email de rejeição para o admin da oficina

      return res.json({
        message: "Oficina rejeitada",
        workshop: result[0]
      });

    } catch (error) {
      console.error("❌ Erro ao rejeitar oficina:", error);
      return res.status(500).json({
        message: "Erro ao rejeitar oficina"
      });
    }
  });

  console.log('✅ Rotas de status de oficina criadas');
}