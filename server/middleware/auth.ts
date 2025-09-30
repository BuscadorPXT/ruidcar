import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { storage } from "../storage";
import { users, roles, userRoles, workshops } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

// JWT Secret (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || "ruidcar-auth-secret-2025";
const JWT_EXPIRES_IN = "7d";

// Definições das Roles e Permissões
export const ROLES = {
  ADMIN: {
    name: 'ADMIN',
    permissions: [
      'CRUD_GLOBAL',
      'VIEW_ALL_TENANTS',
      'MANAGE_USERS',
      'MANAGE_ROLES',
      'VIEW_REPORTS_GLOBAL',
      'MANAGE_WORKSHOPS'
    ]
  },
  OFICINA_OWNER: {
    name: 'OFICINA_OWNER',
    permissions: [
      'CRUD_ORGANIZATION',
      'MANAGE_APPOINTMENTS',
      'MANAGE_SERVICES',
      'VIEW_REPORTS_ORG',
      'MANAGE_TEAM'
    ]
  },
  CLIENTE: {
    name: 'CLIENTE',
    permissions: [
      'VIEW_MY_APPOINTMENTS',
      'CREATE_APPOINTMENTS',
      'APPROVE_BUDGETS',
      'UPLOAD_PHOTOS',
      'CHAT_WORKSHOP'
    ]
  }
} as const;

// Tipos para RBAC
export interface UserRoleData {
  roleId: number;
  roleName: string;
  organizationId: number | null;
  permissions: string[];
}

export interface AuthenticatedUser {
  userId: number;
  email: string;
  name: string;
  phone: string | null;
  roles: UserRoleData[];
  organizationIds: number[];
  currentRole?: UserRoleData;
  currentOrganization?: number;
}

// Extend Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// JWT Token Payload
interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  phone: string | null;
  roles: UserRoleData[];
  organizationIds: number[];
  iat?: number;
  exp?: number;
}

// Gerar JWT Token
export function generateJWT(user: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verificar JWT Token
export function verifyJWT(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

// Buscar dados completos do usuário com roles
export async function getUserWithRoles(userId: number): Promise<AuthenticatedUser | null> {
  try {
    console.log('🔍 getUserWithRoles - Buscando usuário ID:', userId);

    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    console.log('🔍 getUserWithRoles - Usuário encontrado:', user ? { id: user.id, email: user.email } : 'NULL');

    if (!user) {
      return null;
    }

    // TODO: Adicionar campo isActive na tabela users se necessário
    // if (!user.isActive) {
    //   return null;
    // }

    // Buscar roles do usuário
    console.log('🔍 getUserWithRoles - Buscando roles para usuário:', userId);

    const userRoleData = await db
      .select({
        roleId: roles.id,
        roleName: roles.name,
        organizationId: userRoles.organizationId,
        permissions: roles.permissions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.isActive, true)
      ));

    console.log('🔍 getUserWithRoles - Roles encontradas:', userRoleData.length, userRoleData);

    const rolesList: UserRoleData[] = userRoleData.map(role => ({
      roleId: role.roleId,
      roleName: role.roleName,
      organizationId: role.organizationId,
      permissions: role.permissions as string[]
    }));

    const organizationIds = rolesList
      .map(role => role.organizationId)
      .filter((id): id is number => id !== null);

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: null, // TODO: Adicionar campo phone na tabela users se necessário
      roles: rolesList,
      organizationIds: [...new Set(organizationIds)], // remove duplicatas
    };
  } catch (error) {
    console.error("❌ getUserWithRoles - Erro ao buscar usuário com roles:", error);
    console.error("❌ Stack trace:", (error as any).stack);
    return null;
  }
}

// Middleware de autenticação principal
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Debug: ver todos os cookies recebidos
    console.log('🍪 Cookies recebidos:', req.cookies);
    console.log('🍪 Headers:', {
      cookie: req.headers.cookie,
      authorization: req.headers.authorization,
      origin: req.headers.origin
    });

    // Buscar token do header Authorization ou cookie
    let token = req.headers.authorization?.replace('Bearer ', '');

    // Fallback para header x-auth-token (compatibilidade)
    if (!token) {
      token = req.headers['x-auth-token'] as string;
    }

    // Fallback para cookie seguro (prioridade maior)
    if (!token && req.cookies?.['auth-token']) {
      token = req.cookies['auth-token'];
    }
    // Aceitar também o cookie do painel de oficina
    if (!token && req.cookies?.['workshop-token']) {
      token = req.cookies['workshop-token'];
    }

    console.log('🔍 Token final:', token ? token.substring(0, 20) + '...' : 'null');

    if (!token) {
      return res.status(401).json({
        message: "Token de autenticação necessário",
        code: "NO_AUTH_TOKEN"
      });
    }

    // Verificar se é um token simples de admin (temporário)
    console.log('🔍 Verificando se é token simples...', token.startsWith('admin-simple-token-'));
    if (token.startsWith('admin-simple-token-')) {
      console.log('✅ Token simples detectado, criando usuário mock');
      // Para tokens simples de admin, criar um usuário mock
      const mockUser: AuthenticatedUser = {
        userId: 1,
        email: 'admin@ruidcar.com',
        name: 'Admin',
        phone: null,
        roles: [{
          roleId: 1,
          roleName: 'ADMIN',
          organizationId: null,
          permissions: ['admin:all']
        }],
        organizationIds: []
      };

      req.user = mockUser;
      console.log('✅ Mock user criado:', mockUser.email, 'roles:', mockUser.roles.map(r => r.roleName));
      next();
      return;
    }

    // Verificar e decodificar JWT normal
    let decoded: JWTPayload;
    try {
      decoded = verifyJWT(token);
    } catch (jwtError) {
      return res.status(401).json({
        message: "Token inválido ou expirado",
        code: "INVALID_TOKEN"
      });
    }

    // Buscar dados atualizados do usuário (padrão)
    let user = await getUserWithRoles(decoded.userId);

    // Fallback: aceitar tokens de administradores de oficina (sem entrada em users)
    if (!user && Array.isArray((decoded as any).roles)) {
      const rolesFromToken = (decoded as any).roles as UserRoleData[];
      const isWorkshopToken = rolesFromToken.some(r => r.roleName === 'OFICINA_OWNER');
      if (isWorkshopToken) {
        const admin = await storage.getWorkshopAdminById(decoded.userId).catch(() => undefined);
        if (admin) {
          const organizationIds = rolesFromToken
            .map(r => r.organizationId)
            .filter((id): id is number => id !== null);

          user = {
            userId: decoded.userId,
            email: admin.email,
            name: admin.name,
            phone: (admin as any).phone || null,
            roles: rolesFromToken,
            organizationIds: [...new Set(organizationIds)],
          };
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        message: "Usuário não encontrado ou inativo",
        code: "INVALID_USER"
      });
    }

    // Anexar usuário à requisição
    req.user = user;
    next();

  } catch (error) {
    console.error("Erro na autenticação:", error);
    return res.status(500).json({
      message: "Erro interno do servidor",
      code: "AUTH_ERROR"
    });
  }
}

// Middleware para verificar role específica
export function requireRole(requiredRole: keyof typeof ROLES) {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log('🔍 requireRole - verificando role:', requiredRole);
    console.log('🔍 requireRole - req.user existe:', !!req.user);
    if (req.user) {
      console.log('🔍 requireRole - user roles:', req.user.roles.map(r => r.roleName));
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Autenticação necessária",
        code: "AUTH_REQUIRED"
      });
    }

    const hasRole = req.user.roles.some(role => role.roleName === requiredRole);
    console.log('🔍 requireRole - hasRole:', hasRole);

    if (!hasRole) {
      return res.status(403).json({
        message: `Acesso negado. Role '${requiredRole}' necessária.`,
        code: "ROLE_REQUIRED",
        userRoles: req.user.roles.map(r => r.roleName),
        requiredRole
      });
    }

    console.log('✅ requireRole - role verificada com sucesso');
    next();
  };
}

// Middleware para verificar permissão específica
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Autenticação necessária",
        code: "AUTH_REQUIRED"
      });
    }

    const hasPermission = req.user.roles.some(role =>
      role.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: `Permissão '${permission}' necessária.`,
        code: "PERMISSION_REQUIRED",
        userPermissions: getAllUserPermissions(req.user),
        requiredPermission: permission
      });
    }

    next();
  };
}

// Middleware para verificar acesso à organização
export function requireOrganization(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      message: "Autenticação necessária",
      code: "AUTH_REQUIRED"
    });
  }

  // Admin global bypassa verificação de organização
  if (hasRole(req.user, 'ADMIN')) {
    return next();
  }

  // Buscar organization ID dos parâmetros ou body
  const organizationId = parseInt(req.params.organizationId || req.body.organizationId);

  if (!organizationId) {
    return res.status(400).json({
      message: "ID da organização necessário",
      code: "ORGANIZATION_ID_REQUIRED"
    });
  }

  if (!req.user.organizationIds.includes(organizationId)) {
    return res.status(403).json({
      message: "Acesso negado para esta organização",
      code: "ORGANIZATION_ACCESS_DENIED",
      userOrganizations: req.user.organizationIds,
      requestedOrganization: organizationId
    });
  }

  next();
}

// Middleware de autenticação opcional (não falha se não autenticado)
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Tentar autenticar, mas não falhar se não conseguir
    await new Promise<void>((resolve) => {
      authenticateUser(req, res, (err) => {
        // Sempre resolve, mesmo se houver erro
        resolve();
      });
    });
  } catch (error) {
    console.error("Erro na autenticação opcional:", error);
  }

  // Sempre continua, mesmo sem autenticação
  next();
}

// Helper: Verificar se usuário tem role específica
export function hasRole(user: AuthenticatedUser, roleName: keyof typeof ROLES): boolean {
  return user.roles.some(role => role.roleName === roleName);
}

// Helper: Verificar se usuário tem permissão específica
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  return user.roles.some(role => role.permissions.includes(permission));
}

// Helper: Obter todas as permissões do usuário
export function getAllUserPermissions(user: AuthenticatedUser): string[] {
  const allPermissions = user.roles.flatMap(role => role.permissions);
  return [...new Set(allPermissions)]; // remove duplicatas
}

// Helper: Verificar se usuário tem acesso à organização
export function hasOrganizationAccess(user: AuthenticatedUser, organizationId: number): boolean {
  // Admin global tem acesso a tudo
  if (hasRole(user, 'ADMIN')) {
    return true;
  }

  return user.organizationIds.includes(organizationId);
}

// Helper: Obter role primária do usuário (para redirecionamento)
export function getPrimaryRole(user: AuthenticatedUser): UserRoleData | null {
  // Prioridade: ADMIN > OFICINA_OWNER > CLIENTE
  const priorities = ['ADMIN', 'OFICINA_OWNER', 'CLIENTE'];

  for (const priority of priorities) {
    const role = user.roles.find(r => r.roleName === priority);
    if (role) return role;
  }

  return user.roles[0] || null;
}

// Helper: Obter redirect padrão baseado na role
export function getDefaultRedirect(role: UserRoleData | null): string {
  if (!role) return '/';

  switch (role.roleName) {
    case 'ADMIN':
      return '/admin';
    case 'OFICINA_OWNER':
      return '/workshop/dashboard';
    case 'CLIENTE':
      return '/cliente';
    default:
      return '/';
  }
}

// Helper: Validar intent do login
export function matchesIntent(role: UserRoleData, intent: string): boolean {
  switch (intent) {
    case 'admin':
      return role.roleName === 'ADMIN';
    case 'oficina':
      return role.roleName === 'OFICINA_OWNER';
    case 'cliente':
      return role.roleName === 'CLIENTE';
    default:
      return true;
  }
}

// Função para inicializar roles padrão no banco
export async function initializeDefaultRoles() {
  try {
    // Verificar se roles já existem
    const existingRoles = await db.select().from(roles);

    if (existingRoles.length === 0) {
      console.log("🔧 Inicializando roles padrão...");

      // Inserir roles padrão
      await db.insert(roles).values([
        {
          name: 'ADMIN',
          description: 'Administrador global do sistema',
          permissions: ROLES.ADMIN.permissions
        },
        {
          name: 'OFICINA_OWNER',
          description: 'Proprietário/Gerente de oficina',
          permissions: ROLES.OFICINA_OWNER.permissions
        },
        {
          name: 'CLIENTE',
          description: 'Cliente final (dono de veículo)',
          permissions: ROLES.CLIENTE.permissions
        }
      ]);

      console.log("✅ Roles padrão criadas com sucesso!");
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar roles padrão:", error);
  }
}

// Middleware combinado: autenticação + role + organização
export function requireRoleAndOrganization(roleName: keyof typeof ROLES) {
  return [
    authenticateUser,
    requireRole(roleName),
    requireOrganization
  ];
}

// Middleware: somente admin
export const requireAdmin = [
  authenticateUser,
  requireRole('ADMIN')
];

// Middleware: dono de oficina com verificação de organização
export const requireOficinaOwner = [
  authenticateUser,
  requireRole('OFICINA_OWNER'),
  requireOrganization
];

// Middleware: cliente
export const requireCliente = [
  authenticateUser,
  requireRole('CLIENTE')
];

// Helper function para compatibilidade - criar usuário admin
export async function createAdminUser(userData: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Buscar role ADMIN
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'ADMIN'))
      .limit(1);

    if (!adminRole) {
      throw new Error('Role ADMIN não encontrada. Execute initializeDefaultRoles() primeiro.');
    }

    // Criar usuário
    const [newUser] = await db
      .insert(users)
      .values({
        username: userData.email, // usar email como username temporariamente
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        company: (userData as any).company || null,
        role: 'ADMIN',
      })
      .returning();

    // Associar role ADMIN
    await db
      .insert(userRoles)
      .values({
        userId: newUser.id,
        roleId: adminRole.id,
        organizationId: null,
        isActive: true,
      });

    console.log(`✅ Usuário admin criado: ${newUser.email}`);

    // Retornar sem senha
    const { password, ...safeUser } = newUser;
    return safeUser;

  } catch (error) {
    console.error("❌ Erro ao criar usuário admin:", error);
    throw error;
  }
}

// Helper function para compatibilidade - verificar se é admin
export function isAdmin(user?: AuthenticatedUser): boolean {
  return hasRole(user!, 'ADMIN');
}