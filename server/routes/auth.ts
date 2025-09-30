import type { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users, roles, userRoles, workshops, workshopAdmins, workshopAdminPermissions } from "../../shared/schema";
import { eq, and, or } from "drizzle-orm";
import {
  generateJWT,
  verifyJWT,
  getUserWithRoles,
  authenticateUser,
  getPrimaryRole,
  getDefaultRedirect,
  matchesIntent,
  type AuthenticatedUser,
  type UserRoleData
} from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "ruidcar-auth-secret-2025";

// Interface para resposta unificada
interface UnifiedLoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    phone?: string;
  };
  roles: UserRoleData[];
  organizations: number[];
  primaryRole?: string;
  defaultRedirect: string;
  multipleRoles: boolean;
}

export function createAuthRoutes(app: Router) {

  // ============================================
  // 0. TESTE DE CONEXÃO
  // ============================================
  app.get("/api/auth/test", async (req: Request, res: Response) => {
    console.log('🧪 Teste de conexão recebido');
    return res.json({
      message: "API funcionando",
      timestamp: new Date().toISOString()
    });
  });

  // ============================================
  // 1. LOGIN UNIFICADO
  // ============================================
  app.post("/api/auth/unified-login", async (req: Request, res: Response) => {
    try {
      const { email, password, intent = 'auto', selectedRole } = req.body;

      console.log('🔐 Login unificado:', { email, intent: intent === 'auto' ? 'auto-detect' : intent, selectedRole });
      console.log('📝 Request body completo:', JSON.stringify(req.body, null, 2));

      if (!email || !password) {
        return res.status(400).json({
          message: "Email e senha são obrigatórios",
          code: "MISSING_CREDENTIALS"
        });
      }

      // Buscar usuário por email (primeiro em users, depois em workshop_admins)
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      console.log('🔍 Usuário encontrado em users:', user ? 'SIM' : 'NÃO');
      if (user) {
        console.log('🔍 Dados do usuário:', { id: user.id, email: user.email, role: user.role });
      }

      let isWorkshopAdminOnly = false;
      let workshopAdminData: any = null;

      // Se não encontrou em users, tentar como workshop_admin (oficina)
      if (!user) {
        console.log('🔍 Usuário não encontrado em users, buscando em workshop_admins...');

        try {
          const [workshopAdmin] = await db
            .select()
            .from(workshopAdmins)
            .where(eq(workshopAdmins.email, email.toLowerCase()))
            .limit(1);

          console.log('📊 Workshop admin encontrado:', workshopAdmin ? 'SIM' : 'NÃO');

          if (workshopAdmin) {
            console.log('🔑 Verificando senha do workshop admin...');
            // Verificar senha do workshop admin
            const validPassword = await bcrypt.compare(password, workshopAdmin.password);
            if (!validPassword) {
              console.log('❌ Senha inválida para workshop admin:', email);
              return res.status(401).json({
                message: "Credenciais inválidas",
                code: "INVALID_CREDENTIALS"
              });
            }

            console.log('✅ Senha válida, criando user temporário...');
            // Criar um user temporário para compatibilidade
            isWorkshopAdminOnly = true;
            workshopAdminData = workshopAdmin;
            user = {
              id: -1, // ID temporário negativo para indicar que é workshop admin
              username: workshopAdmin.email,
              password: workshopAdmin.password,
              name: workshopAdmin.name,
              email: workshopAdmin.email,
              company: null,
              role: 'workshop_admin',
              createdAt: workshopAdmin.createdAt
            };
          }
        } catch (dbError) {
          console.error('❌ Erro ao buscar workshop admin:', dbError);
          throw dbError;
        }
      }

      if (!user) {
        console.log('❌ Usuário não encontrado:', email);
        return res.status(401).json({
          message: "Credenciais inválidas",
          code: "INVALID_CREDENTIALS"
        });
      }

      // Verificar senha apenas se não for workshop admin (já verificado acima)
      if (!isWorkshopAdminOnly) {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          console.log('❌ Senha inválida para:', email);
          return res.status(401).json({
            message: "Credenciais inválidas",
            code: "INVALID_CREDENTIALS"
          });
        }
      }

      // Buscar dados completos com roles (ou criar se for workshop admin only)
      let authUser;
      if (isWorkshopAdminOnly && workshopAdminData) {
        // Criar authUser manual para workshop admin
        authUser = {
          userId: workshopAdminData.id,
          email: workshopAdminData.email,
          name: workshopAdminData.name,
          phone: workshopAdminData.phone || '',
          roles: [],
          organizationIds: []
        };
      } else {
        console.log('🔍 Buscando roles para usuário ID:', user.id);
        authUser = await getUserWithRoles(user.id);
        console.log('🔍 AuthUser retornado:', authUser ? {
          userId: authUser.userId,
          email: authUser.email,
          roles: authUser.roles,
          organizationIds: authUser.organizationIds
        } : 'NULL');
      }

      if (!authUser) {
        return res.status(401).json({
          message: "Erro ao buscar dados do usuário",
          code: "USER_DATA_ERROR"
        });
      }

      // Verificar se tem roles
      console.log('🔍 Verificando roles:', {
        hasRoles: authUser.roles && authUser.roles.length > 0,
        rolesCount: authUser.roles ? authUser.roles.length : 0,
        roles: authUser.roles
      });

      if (!authUser.roles || authUser.roles.length === 0) {
        console.log('⚠️ Usuário sem roles:', email);

        // Se detectamos admin de oficina, tentar atribuir roles de oficina
        if (isWorkshopAdminOnly) {
          // Se já temos os dados do workshop admin, usar eles
          let adminId = isWorkshopAdminOnly && workshopAdminData ? workshopAdminData.id : null;

          // Se não, buscar administrador da oficina
          if (!adminId) {
            const [workshopAdmin] = await db
              .select()
              .from(workshopAdmins)
              .where(eq(workshopAdmins.email, email.toLowerCase()))
              .limit(1);

            if (workshopAdmin) {
              adminId = workshopAdmin.id;
            }
          }

          if (adminId) {
            console.log('🔎 Buscando permissões para admin ID:', adminId);

            try {
              // Buscar as oficinas que este admin pode gerenciar
              const adminPermissions = await db
                .select({
                  workshop: workshops,
                  permission: workshopAdminPermissions
                })
                .from(workshopAdminPermissions)
                .innerJoin(workshops, eq(workshops.id, workshopAdminPermissions.workshopId))
                .where(eq(workshopAdminPermissions.adminId, adminId));

              console.log(`📋 Encontradas ${adminPermissions.length} permissões para o admin`);

              if (adminPermissions.length > 0) {
                // Criar roles para cada oficina que o admin gerencia
                const activeWorkshops = adminPermissions.filter(p => p.workshop.active);
                console.log(`✅ ${activeWorkshops.length} oficinas ativas de ${adminPermissions.length} total`);

                authUser.roles = activeWorkshops.map(p => ({
                  roleId: 2,
                  roleName: 'OFICINA_OWNER',
                  organizationId: p.workshop.id,
                  permissions: ['manage_workshop']
                }));

                authUser.organizationIds = activeWorkshops.map(p => p.workshop.id);
                console.log('🎯 Roles criadas com sucesso:', authUser.roles.length);
              }
            } catch (permError) {
              console.error('❌ Erro ao buscar permissões do admin:', permError);
              console.error('Stack trace:', (permError as any).stack);
              throw permError;
            }
          }
        }

        // Se ainda não tem roles, retornar erro
        if (!authUser.roles || authUser.roles.length === 0) {
          return res.status(403).json({
            message: "Usuário sem permissões. Entre em contato com o administrador.",
            code: "NO_ROLES"
          });
        }
      }

      // Usar todas as roles disponíveis (detecção automática)
      let availableRoles = authUser.roles;

      // Se tiver intent específico e não for 'auto', filtrar
      if (intent !== 'auto' && intent !== 'general') {
        const filteredRoles = authUser.roles.filter(role => matchesIntent(role, intent));

        if (filteredRoles.length > 0) {
          availableRoles = filteredRoles;
        }
        // Não falhar se não encontrar match - usar todas as roles disponíveis
      }

      // Determinar role atual (selecionada ou primária)
      let currentRole: UserRoleData;
      if (selectedRole) {
        const selected = availableRoles.find(r => r.roleName === selectedRole);
        if (!selected) {
          return res.status(400).json({
            message: "Role selecionada inválida",
            code: "INVALID_ROLE"
          });
        }
        currentRole = selected;
      } else {
        currentRole = getPrimaryRole({ ...authUser, roles: availableRoles }) || availableRoles[0];
      }

      // Gerar token JWT (ajustar ID se for workshop admin only)
      const token = generateJWT({
        userId: isWorkshopAdminOnly && workshopAdminData ? workshopAdminData.id : authUser.userId,
        email: authUser.email,
        name: authUser.name,
        phone: authUser.phone,
        roles: availableRoles,
        organizationIds: authUser.organizationIds
      });

      // Definir cookie seguro - CRÍTICO para funcionar em desenvolvimento
      const isProduction = process.env.NODE_ENV === 'production';

      const cookieOptions: any = {
        httpOnly: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      };

      if (isProduction) {
        // Configurações de produção
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'strict';
        cookieOptions.domain = '.ruidcar.com.br';
      } else {
        // Configurações de desenvolvimento - CRÍTICO para localhost
        cookieOptions.secure = false; // DEVE ser false para HTTP
        cookieOptions.sameSite = 'lax'; // Lax permite cookies em localhost
        // NÃO definir domain em desenvolvimento
      }

      res.cookie('auth-token', token, cookieOptions);

      console.log('🍪 Cookie configurado:', {
        domain: process.env.NODE_ENV === 'production' ? '.ruidcar.com.br' : 'localhost',
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
      });

      // Resposta unificada (ajustar ID se for workshop admin only)
      const response: UnifiedLoginResponse = {
        message: "Login realizado com sucesso",
        token,
        user: {
          id: isWorkshopAdminOnly && workshopAdminData ? workshopAdminData.id : authUser.userId,
          email: authUser.email,
          name: authUser.name,
          phone: authUser.phone || undefined
        },
        roles: availableRoles,
        organizations: authUser.organizationIds,
        primaryRole: currentRole.roleName,
        defaultRedirect: getDefaultRedirect(currentRole),
        multipleRoles: availableRoles.length > 1
      };

      console.log('✅ Login bem-sucedido:', {
        email: authUser.email,
        roles: availableRoles.map(r => r.roleName),
        redirect: response.defaultRedirect
      });

      return res.json(response);

    } catch (error) {
      console.error("❌ Erro no login unificado:", error);
      console.error("Stack trace:", (error as any)?.stack);

      // Garantir que sempre retornamos JSON válido
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      // Se for erro de SQL, dar uma mensagem mais clara
      if (errorMessage.includes('column') || errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
        console.error('🚨 Erro de SQL detectado:', errorMessage);
        return res.status(500).json({
          message: "Erro de configuração do banco de dados. Entre em contato com o suporte.",
          code: "DATABASE_ERROR",
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
      }

      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  });

  // ============================================
  // 2. OBTER DADOS DO USUÁRIO ATUAL
  // ============================================
  app.get("/api/auth/me", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          message: "Não autenticado",
          code: "NOT_AUTHENTICATED"
        });
      }

      const primaryRole = getPrimaryRole(user);

      return res.json({
        user: {
          id: user.userId,
          email: user.email,
          name: user.name,
          phone: user.phone
        },
        roles: user.roles,
        organizations: user.organizationIds,
        currentRole: primaryRole?.roleName,
        defaultRedirect: getDefaultRedirect(primaryRole)
      });

    } catch (error) {
      console.error("❌ Erro ao buscar dados do usuário:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      });
    }
  });

  // ============================================
  // 3. LOGOUT SEGURO
  // ============================================
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      // Limpar cookie de autenticação - Mesmas configurações do set
      const clearCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
        domain: process.env.NODE_ENV === 'production' ? '.ruidcar.com.br' : undefined,
        path: '/'
      };

      res.clearCookie('auth-token', clearCookieOptions);

      return res.json({
        message: "Logout realizado com sucesso"
      });

    } catch (error) {
      console.error("❌ Erro no logout:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      });
    }
  });

  // ============================================
  // 4. REIVINDICAR OFICINA COM CÓDIGO (USUÁRIO REGULAR)
  // ============================================
  app.post("/api/auth/claim-workshop", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          message: "Não autenticado",
          code: "NOT_AUTHENTICATED"
        });
      }

      if (!code || code.trim().length < 3) {
        return res.status(400).json({
          message: "Código inválido",
          code: "INVALID_CODE"
        });
      }

      const normalizedCode = code.trim().toUpperCase();

      // Buscar oficina pelo código
      const workshop = await db
        .select()
        .from(workshops)
        .where(eq(workshops.uniqueCode, normalizedCode))
        .limit(1);

      if (workshop.length === 0) {
        return res.status(404).json({
          message: `Código "${code}" não encontrado`,
          code: "WORKSHOP_NOT_FOUND"
        });
      }

      const targetWorkshop = workshop[0];

      // Verificar se a oficina já tem dono
      if (targetWorkshop.ownerId && targetWorkshop.ownerId !== user.userId) {
        return res.status(400).json({
          message: "Esta oficina já está vinculada a outro usuário",
          code: "WORKSHOP_ALREADY_CLAIMED"
        });
      }

      // Se já é o dono, apenas retornar sucesso
      if (targetWorkshop.ownerId === user.userId) {
        return res.json({
          message: "Você já é o proprietário desta oficina",
          workshop: {
            id: targetWorkshop.id,
            name: targetWorkshop.name,
            uniqueCode: targetWorkshop.uniqueCode,
            active: targetWorkshop.active
          }
        });
      }

      // Atualizar oficina com owner_id
      await db
        .update(workshops)
        .set({
          ownerId: user.userId,
          updatedAt: new Date()
        })
        .where(eq(workshops.id, targetWorkshop.id));

      // Adicionar role OFICINA_OWNER se não tiver
      const hasOficinaOwnerRole = user.roles.some(r => r.roleName === 'OFICINA_OWNER');
      if (!hasOficinaOwnerRole) {
        // Buscar ID da role OFICINA_OWNER
        const oficinaOwnerRole = await db
          .select()
          .from(roles)
          .where(eq(roles.name, 'OFICINA_OWNER'))
          .limit(1);

        if (oficinaOwnerRole.length > 0) {
          // Adicionar a role ao usuário com a oficina como organização
          await db
            .insert(userRoles)
            .values({
              userId: user.userId,
              roleId: oficinaOwnerRole[0].id,
              organizationId: targetWorkshop.id,
              isActive: true
            })
            .onConflictDoNothing();
        }
      }

      return res.json({
        message: "Oficina reivindicada com sucesso",
        workshop: {
          id: targetWorkshop.id,
          name: targetWorkshop.name,
          uniqueCode: targetWorkshop.uniqueCode,
          active: targetWorkshop.active,
          status: targetWorkshop.active ? 'approved' : 'pending'
        }
      });

    } catch (error) {
      console.error("❌ Erro ao reivindicar oficina:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      });
    }
  });

  // ============================================
  // 5. TROCAR ROLE ATIVA
  // ============================================
  app.post("/api/auth/switch-role", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { roleName, organizationId } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          message: "Não autenticado",
          code: "NOT_AUTHENTICATED"
        });
      }

      // Verificar se o usuário tem a role solicitada
      const selectedRole = user.roles.find(r =>
        r.roleName === roleName &&
        (organizationId === undefined || r.organizationId === organizationId)
      );

      if (!selectedRole) {
        return res.status(403).json({
          message: "Você não tem acesso a esta role",
          code: "ROLE_NOT_AVAILABLE"
        });
      }

      // Gerar novo token com role selecionada como primária
      const reorderedRoles = [
        selectedRole,
        ...user.roles.filter(r => r !== selectedRole)
      ];

      const newToken = generateJWT({
        userId: user.userId,
        email: user.email,
        name: user.name,
        phone: user.phone,
        roles: reorderedRoles,
        organizationIds: user.organizationIds
      });

      // Atualizar cookie - usar mesma configuração
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions: any = {
        httpOnly: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      };

      if (isProduction) {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'strict';
        cookieOptions.domain = '.ruidcar.com.br';
      } else {
        cookieOptions.secure = false;
        cookieOptions.sameSite = 'lax';
      }

      res.cookie('auth-token', newToken, cookieOptions);

      return res.json({
        message: "Role alterada com sucesso",
        currentRole: selectedRole.roleName,
        defaultRedirect: getDefaultRedirect(selectedRole),
        token: newToken
      });

    } catch (error) {
      console.error("❌ Erro ao trocar role:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      });
    }
  });

  console.log('✅ Rotas de autenticação unificadas criadas');
}