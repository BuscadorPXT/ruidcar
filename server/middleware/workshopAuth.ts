import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { WorkshopAdmin, WorkshopAdminPermission } from "@shared/schema";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Extend Request interface to include workshop admin data
declare global {
  namespace Express {
    interface Request {
      workshopAdmin?: WorkshopAdmin;
      workshopPermissions?: WorkshopAdminPermission[];
    }
  }
}

/**
 * Middleware para autenticar administradores de oficinas
 * Verifica o token no header X-Workshop-Token ou Authorization
 */
export const requireWorkshopAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers['x-workshop-token'] ||
                 req.headers['authorization']?.replace('Bearer ', '') ||
                 req.headers['x-admin-token']; // Compatibilidade temporária

    if (!token || typeof token !== 'string') {
      return res.status(401).json({
        message: "Token de autenticação é obrigatório",
        code: "AUTH_TOKEN_REQUIRED"
      });
    }

    // Verificar e decodificar JWT
    const decoded = verifyWorkshopToken(token);

    if (!decoded) {
      return res.status(401).json({
        message: "Token de autenticação inválido ou expirado",
        code: "AUTH_TOKEN_INVALID"
      });
    }

    // Buscar o administrador da oficina
    const workshopAdmin = await storage.getWorkshopAdminById(decoded.adminId);

    if (!workshopAdmin) {
      return res.status(401).json({
        message: "Administrador não encontrado",
        code: "AUTH_ADMIN_NOT_FOUND"
      });
    }

    if (!workshopAdmin.isActive) {
      return res.status(403).json({
        message: "Conta desativada. Entre em contato com o suporte.",
        code: "AUTH_ACCOUNT_DISABLED"
      });
    }

    // Buscar permissões do administrador
    const permissions = await storage.getWorkshopAdminPermissions(decoded.adminId);

    // Adicionar dados ao request
    req.workshopAdmin = workshopAdmin;
    req.workshopPermissions = permissions;

    // Atualizar último login
    await storage.updateWorkshopAdminLastLogin(decoded.adminId);

    next();
  } catch (error) {
    console.error("Erro na autenticação do administrador da oficina:", error);
    return res.status(500).json({
      message: "Erro interno de autenticação",
      code: "AUTH_INTERNAL_ERROR"
    });
  }
};

/**
 * Middleware para verificar se o administrador tem acesso a uma oficina específica
 * @param requiredPermissions - Permissões necessárias (opcional)
 */
export const requireWorkshopAccess = (
  requiredPermissions?: {
    canEdit?: boolean;
    canViewReports?: boolean;
    canManageAppointments?: boolean;
  }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.workshopAdmin || !req.workshopPermissions) {
        return res.status(401).json({
          message: "Autenticação necessária",
          code: "AUTH_REQUIRED"
        });
      }

      const workshopId = parseInt(req.params.workshopId || req.body.workshopId);

      if (isNaN(workshopId)) {
        return res.status(400).json({
          message: "ID da oficina é obrigatório",
          code: "WORKSHOP_ID_REQUIRED"
        });
      }

      // Verificar se o administrador tem acesso a esta oficina
      const permission = req.workshopPermissions.find(p => p.workshopId === workshopId);

      if (!permission) {
        return res.status(403).json({
          message: "Acesso negado a esta oficina",
          code: "WORKSHOP_ACCESS_DENIED"
        });
      }

      // Verificar permissões específicas se fornecidas
      if (requiredPermissions) {
        if (requiredPermissions.canEdit && !permission.canEdit) {
          return res.status(403).json({
            message: "Permissão de edição necessária",
            code: "WORKSHOP_EDIT_PERMISSION_DENIED"
          });
        }

        if (requiredPermissions.canViewReports && !permission.canViewReports) {
          return res.status(403).json({
            message: "Permissão para visualizar relatórios necessária",
            code: "WORKSHOP_REPORTS_PERMISSION_DENIED"
          });
        }

        if (requiredPermissions.canManageAppointments && !permission.canManageAppointments) {
          return res.status(403).json({
            message: "Permissão para gerenciar agendamentos necessária",
            code: "WORKSHOP_APPOINTMENTS_PERMISSION_DENIED"
          });
        }
      }

      next();
    } catch (error) {
      console.error("Erro na verificação de acesso à oficina:", error);
      return res.status(500).json({
        message: "Erro interno na verificação de permissões",
        code: "WORKSHOP_ACCESS_INTERNAL_ERROR"
      });
    }
  };
};

/**
 * Middleware opcional - não falha se não houver autenticação
 */
export const optionalWorkshopAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers['x-workshop-token'] ||
                 req.headers['authorization']?.replace('Bearer ', '');

    if (!token || typeof token !== 'string') {
      return next(); // Continua sem autenticação
    }

    const decoded = verifyWorkshopToken(token);

    if (!decoded) {
      return next(); // Continua sem autenticação
    }

    const workshopAdmin = await storage.getWorkshopAdminById(decoded.adminId);

    if (workshopAdmin && workshopAdmin.isActive) {
      const permissions = await storage.getWorkshopAdminPermissions(decoded.adminId);
      req.workshopAdmin = workshopAdmin;
      req.workshopPermissions = permissions;
    }

    next();
  } catch (error) {
    console.error("Erro na autenticação opcional da oficina:", error);
    next(); // Continua mesmo com erro
  }
};

// Configuração JWT
const JWT_SECRET = process.env.JWT_SECRET || 'workshop_jwt_secret_change_in_production';
const JWT_EXPIRES_IN = '24h';

interface JWTPayload {
  adminId: number;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Função para criar um token JWT
 */
export const createWorkshopToken = (admin: WorkshopAdmin): string => {
  const payload: JWTPayload = {
    adminId: admin.id,
    email: admin.email
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'ruidcar-workshop',
    audience: 'workshop-admin'
  });
};

/**
 * Função para verificar e decodificar token JWT
 */
export const verifyWorkshopToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ruidcar-workshop',
      audience: 'workshop-admin'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
};

/**
 * Função para validar senha usando bcrypt
 */
export const validateWorkshopPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Erro ao validar senha:', error);
    return false;
  }
};

/**
 * Função para hash da senha usando bcrypt
 */
export const hashWorkshopPassword = async (password: string): Promise<string> => {
  try {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Erro ao criar hash da senha:', error);
    throw new Error('Erro ao processar senha');
  }
};