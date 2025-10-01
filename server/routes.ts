import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertContactSchema,
  insertCalculationSchema,
  insertUserSchema,
  insertBlogPostSchema,
  insertWorkshopSchema,
  insertWorkshopAdminSchema,
  insertWorkshopAdminPermissionSchema,
  insertAppointmentSchema,
  insertWorkshopServiceSchema
} from "@shared/schema";
import { ROICalculationResult } from "@/components/RoiCalculator";
import { z } from "zod";
import fetch from "node-fetch";
import bcrypt from "bcryptjs";
import { sendContactToTrello } from "./email";
import { db } from "./db";
import { users, roles, userRoles, contactMessages, workshopServices, workshopAdmins, workshopAdminPermissions, workshops } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import {
  requireAdmin,
  authenticateUser,
  optionalAuth,
  createAdminUser,
  isAdmin,
  generateJWT,
  getUserWithRoles,
  hasRole,
  requirePermission,
  getPrimaryRole,
  getDefaultRedirect,
  matchesIntent,
  initializeDefaultRoles
} from "./middleware/auth";
import {
  requireWorkshopAdmin,
  requireWorkshopAccess,
  optionalWorkshopAuth,
  createWorkshopToken,
  validateWorkshopPassword,
  hashWorkshopPassword
} from "./middleware/workshopAuth";

// Temporário: middleware simples para substituir requireOficinaOwner
const requireOficinaOwner = (req: any, res: any, next: any) => {
  // TODO: Implementar verificação real
  next();
};

// Temporário: middleware simples para substituir requireCliente
const requireCliente = (req: any, res: any, next: any) => {
  // TODO: Implementar verificação real
  next();
};

// Função para processar dados do formulário de contato (desativada - apenas para referência futura)
/* 
Função desativada pois estamos usando apenas o Trello via SendGrid para integração
async function sendToCoda(formData: any) {
  try {
    // Preparamos os dados para envio
    const requestData = {
      nome: formData.nome || formData.fullName || '',
      empresa: formData.empresa || formData.company || '',
      email: formData.email || '',
      whatsapp: formData.whatsapp || '',
      cidade: formData.cidade || formData.city || '',
      estado: formData.estado || formData.state || '',
      tipoEmpresa: typeof formData.tipoEmpresa === 'string' ? formData.tipoEmpresa : 
                 typeof formData.businessType === 'string' ? formData.businessType : '',
      mensagem: formData.mensagem || formData.message || '',
      dataEnvio: new Date().toLocaleString('pt-BR'),
      origem: 'Site RuidCar - Formulário de Contato'
    };
    
    console.log("Dados do formulário processados:", requestData);
    
    // Credenciais do Coda fornecidas pelo cliente
    const apiToken = '7b85e33d-ba8a-4929-8567-0750cd46732a';

    // Testando formatos diferentes do docId - o Coda pode usar diferentes formatos
    // O ID pode ser precedido por '_d' ou necessitar de alguma outra formatação
    const docId = 'dHzALJIw0O';
    const docIdWithPrefix = '_d' + docId;
    const tableId = 'suhRo7'; // A tabela pode precisar do prefixo 'grid-', que testamos na segunda tentativa
    
    try {
      // Tentamos várias formas de acesso ao documento
      const possibleDocIds = [
        docId,                  // Original: dHzALJIw0O
        docIdWithPrefix,        // Com prefixo: _ddHzALJIw0O 
        'dHzALJIw0O',          // Hardcoded exatamente como fornecido
        '_ddHzALJIw0O',        // Hardcoded com prefixo _d
        'd-dHzALJIw0O',        // Variação com hífen
        docId.toLowerCase(),    // Letras minúsculas 
        docId.toUpperCase()     // Letras maiúsculas
      ];
      
      const possibleTableIds = [
        tableId,                // Original: suhRo7
        `grid-${tableId}`,      // Com prefixo grid-
        'grid-suhRo7',          // Hardcoded com prefixo
        't-suhRo7',             // Variação com t-
        'table-suhRo7'          // Variação com table-
      ];
      
      console.log("Tentando diferentes combinações de IDs para o Coda...");
      
      // Variável para controlar se conseguimos enviar com sucesso
      let sentSuccessfully = false;
      let finalResult = null;
      let finalMethod = "";
      
      // Tentamos todas as combinações possíveis
      for (const currentDocId of possibleDocIds) {
        if (sentSuccessfully) break;
        
        for (const currentTableId of possibleTableIds) {
          // Criamos a URL para esta combinação
          const codaApiUrl = `https://coda.io/apis/v1/docs/${currentDocId}/tables/${currentTableId}/rows`;
          console.log(`Tentando com Doc ID: ${currentDocId}, Table ID: ${currentTableId}`);
          
          try {
            const response = await fetch(codaApiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`
              },
              body: JSON.stringify({
                rows: [
                  {
                    cells: [
                      { column: 'Nome', value: requestData.nome },
                      { column: 'Empresa', value: requestData.empresa },
                      { column: 'Email', value: requestData.email },
                      { column: 'Telefone/WhatsApp', value: requestData.whatsapp },
                      { column: 'Cidade', value: requestData.cidade },
                      { column: 'Estado', value: requestData.estado },
                      { column: 'Tipo de Negócio', value: requestData.tipoEmpresa },
                      { column: 'Mensagem', value: requestData.mensagem },
                      { column: 'Data', value: requestData.dataEnvio },
                      { column: 'Origem', value: requestData.origem }
                    ]
                  }
                ]
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log("Envio para Coda bem-sucedido:", result);
              sentSuccessfully = true;
              finalResult = result;
              finalMethod = `coda_api_${currentDocId}_${currentTableId}`;
              break; // Conseguimos! Saímos do loop interno
            } else {
              console.log(`Falha com combinação ${currentDocId}/${currentTableId}: ${response.status}`);
              // Continuamos tentando outras combinações
            }
          } catch (error) {
            console.log(`Erro na requisição com ${currentDocId}/${currentTableId}:`, error);
            // Continuamos tentando outras combinações
          }
        }
      }
      
      // Se conseguimos enviar com sucesso, retornamos o resultado
      if (sentSuccessfully) {
        return {
          success: true,
          method: finalMethod,
          message: "Dados enviados com sucesso para o Coda",
          result: finalResult
        };
      }
      
      // Se chegamos aqui, nenhuma combinação funcionou
      throw new Error("Nenhuma das combinações de IDs do Coda funcionou");
    } catch (codaError: any) {
      // Se a integração com o Coda falhar, ainda assim consideramos o envio bem-sucedido
      // porque os dados estão salvos no banco de dados
      console.error("Erro na integração com o Coda:", codaError);
      
      return {
        success: true,
        method: "database_fallback",
        message: "Dados salvos no banco de dados. Integração com Coda será tentada posteriormente.",
        error: codaError?.message || String(codaError)
      };
    }
  } catch (error) {
    console.error("Erro ao processar dados do formulário:", error);
    
    // Garantimos que falhas no processamento não afetam o usuário
    return {
      success: true, // Respondemos sempre com sucesso para o cliente
      method: "fallback_storage",
      message: "Dados foram recebidos e armazenados localmente"
    };
  }
}
*/

// Função de substituição (não faz nada, apenas mantém compatibilidade)
async function sendToCoda(formData: any) {
  console.log("Função Coda desativada. Usando apenas Trello via SendGrid.");
  return {
    success: true,
    method: "trello_only_mode",
    message: "A integração com Coda está desativada. Dados salvos no banco de dados."
  };
}

// Esquema estendido para validação de contato
const contactFormSchema = insertContactSchema.extend({
  userId: z.number().optional(),
}).omit({ userId: true });

// Esquema para cálculo de ROI
const roiCalculationRequestSchema = z.object({
  services: z.number().min(1),
  ticket: z.number().min(1),
  noisePercent: z.number().min(1).max(100),
  diagnosisValue: z.number().min(1),
  userId: z.number().optional(),
});

// Esquema para registro de usuário
const userRegistrationSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  name: z.string().min(3),
  email: z.string().email(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Inicializar roles padrão no banco de dados
  await initializeDefaultRoles();

  // Endpoints de autenticação
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const result = userRegistrationSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: result.error.format() 
        });
      }
      
      const { username, password, email, name, company } = result.data;
      
      // Verificar se usuário já existe
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      
      // Criar novo usuário (em produção, a senha deve ser hash)
      const newUser = await storage.createUser({
        username,
        password, // Em produção: usar bcrypt ou similar
        name,
        email,
        company
      });
      
      // Não retornar a senha
      const { password: _, ...userWithoutPassword } = newUser;
      
      return res.status(201).json({
        message: "Usuário criado com sucesso",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      return res.status(500).json({ message: "Erro ao processar registro" });
    }
  });
  
  // Endpoint de Login Unificado RBAC
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password, intent } = req.body;

      // Validação básica
      if (!email || !password) {
        return res.status(400).json({
          message: "Email e senha são obrigatórios",
          code: "MISSING_CREDENTIALS"
        });
      }

      // Buscar usuário por email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(401).json({
          message: "Email ou senha inválidos",
          code: "INVALID_CREDENTIALS"
        });
      }

      // Por enquanto, todas as contas são consideradas ativas
      // TODO: Adicionar campo isActive na tabela users se necessário
      // if (!user.isActive) {
      //   return res.status(401).json({
      //     message: "Conta desativada. Entre em contato com o suporte.",
      //     code: "ACCOUNT_DISABLED"
      //   });
      // }

      // Verificar senha (em produção, usar bcrypt.compare)
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Email ou senha inválidos",
          code: "INVALID_CREDENTIALS"
        });
      }

      // Buscar dados completos do usuário com roles
      const authenticatedUser = await getUserWithRoles(user.id);
      if (!authenticatedUser) {
        return res.status(401).json({
          message: "Erro ao carregar dados do usuário",
          code: "USER_DATA_ERROR"
        });
      }

      // Verificar se usuário tem alguma role ativa
      if (authenticatedUser.roles.length === 0) {
        return res.status(403).json({
          message: "Usuário sem permissões ativas. Entre em contato com o administrador.",
          code: "NO_ACTIVE_ROLES"
        });
      }

      // Filtrar roles por intent se fornecido
      let availableRoles = authenticatedUser.roles;
      if (intent) {
        availableRoles = authenticatedUser.roles.filter(role =>
          matchesIntent(role, intent)
        );

        if (availableRoles.length === 0) {
          return res.status(403).json({
            message: `Usuário não tem permissão para acessar como '${intent}'`,
            code: "INTENT_NOT_ALLOWED",
            availableRoles: authenticatedUser.roles.map(r => r.roleName)
          });
        }
      }

      // Atualizar último login - campo não existe na tabela users
      // TODO: Adicionar campo lastLogin na tabela users se necessário
      // await db
      //   .update(users)
      //   .set({ lastLogin: new Date() })
      //   .where(eq(users.id, user.id));

      // Gerar JWT token
      const token = generateJWT({
        userId: authenticatedUser.userId,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        phone: authenticatedUser.phone,
        roles: availableRoles,
        organizationIds: authenticatedUser.organizationIds
      });

      // Determinar role primária para redirecionamento
      const primaryRole = getPrimaryRole({ ...authenticatedUser, roles: availableRoles });
      const defaultRedirect = getDefaultRedirect(primaryRole);

      console.log(`✅ Login bem-sucedido: ${email} (${availableRoles.map(r => r.roleName).join(', ')})`);

      // Definir cookie seguro HTTP-only
      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        path: '/'
      });

      // Resposta de sucesso
      return res.status(200).json({
        message: "Login realizado com sucesso",
        // Não retornar token no body por segurança
        user: {
          id: authenticatedUser.userId,
          email: authenticatedUser.email,
          name: authenticatedUser.name,
          phone: authenticatedUser.phone
        },
        roles: availableRoles,
        organizations: authenticatedUser.organizationIds,
        primaryRole: primaryRole?.roleName,
        defaultRedirect,
        multipleRoles: availableRoles.length > 1
      });

    } catch (error) {
      console.error("❌ Erro no login unificado:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "LOGIN_ERROR"
      });
    }
  });

  // Endpoint para trocar de papel (Role Switching)
  app.post("/api/auth/switch-role", authenticateUser, async (req: Request, res: Response) => {
    try {
      const { roleName, organizationId } = req.body;

      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
          code: "NOT_AUTHENTICATED"
        });
      }

      // Verificar se usuário tem a role solicitada
      const targetRole = req.user.roles.find(role =>
        role.roleName === roleName &&
        (organizationId ? role.organizationId === organizationId : true)
      );

      if (!targetRole) {
        return res.status(403).json({
          message: "Role não disponível para este usuário",
          code: "ROLE_NOT_AVAILABLE",
          availableRoles: req.user.roles.map(r => ({
            roleName: r.roleName,
            organizationId: r.organizationId
          }))
        });
      }

      // Gerar novo token com a role selecionada como primária
      const selectedRoles = [targetRole];
      const newToken = generateJWT({
        userId: req.user.userId,
        email: req.user.email,
        name: req.user.name,
        phone: req.user.phone,
        roles: selectedRoles,
        organizationIds: targetRole.organizationId ? [targetRole.organizationId] : []
      });

      const defaultRedirect = getDefaultRedirect(targetRole);

      console.log(`🔄 Troca de papel: ${req.user.email} → ${roleName}`);

      // Atualizar cookie seguro com novo token
      res.cookie('auth-token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        path: '/'
      });

      return res.status(200).json({
        message: "Papel alterado com sucesso",
        // Não retornar token no body por segurança
        currentRole: targetRole.roleName,
        currentOrganization: targetRole.organizationId,
        defaultRedirect
      });

    } catch (error) {
      console.error("❌ Erro na troca de papel:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "ROLE_SWITCH_ERROR"
      });
    }
  });

  // Endpoint para obter informações do usuário autenticado
  app.get("/api/auth/me", authenticateUser, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
          code: "NOT_AUTHENTICATED"
        });
      }

      const primaryRole = getPrimaryRole(req.user);

      return res.status(200).json({
        user: {
          id: req.user.userId,
          email: req.user.email,
          name: req.user.name,
          phone: req.user.phone
        },
        roles: req.user.roles,
        organizations: req.user.organizationIds,
        primaryRole: primaryRole?.roleName,
        currentRole: req.user.currentRole?.roleName,
        currentOrganization: req.user.currentOrganization
      });

    } catch (error) {
      console.error("❌ Erro ao obter dados do usuário:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "USER_INFO_ERROR"
      });
    }
  });

  // Endpoint de logout seguro
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    try {
      // Limpar cookie de autenticação
      res.clearCookie('auth-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      console.log('👋 Logout realizado com sucesso');

      return res.status(200).json({
        message: "Logout realizado com sucesso"
      });

    } catch (error) {
      console.error("❌ Erro no logout:", error);
      return res.status(500).json({
        message: "Erro interno do servidor",
        code: "LOGOUT_ERROR"
      });
    }
  });

  // Endpoint de contato
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const result = contactFormSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: result.error.format() 
        });
      }
      
      // Salvar no banco de dados
      const contactMessage = await storage.createContactMessage({
        ...result.data,
        userId: req.body.userId // opcional
      });

      // Enviar notificação WebSocket para novo lead
      const websocket = (global as any).websocket;
      if (websocket?.notifyNewLead) {
        await websocket.notifyNewLead(contactMessage.id);
      }

      // Processar os dados (enviar para Trello somente)
      try {
        console.log("Tentando enviar dados para o Trello via SendGrid...");
        // Enviar para o Trello via email
        const trelloResult = await sendContactToTrello(result.data);
        console.log("Envio para Trello:", trelloResult ? "Sucesso" : "Falha");
        
        // Se falhar, logamos o erro mas não tentamos o Coda
        if (!trelloResult) {
          console.log("Falha no envio para o Trello. Os dados foram salvos no banco de dados.");
        }
      } catch (processingError) {
        console.error("Erro ao processar dados externos:", processingError);
        // Não falha a requisição principal se o processamento externo falhar
      }
      
      return res.status(201).json({ 
        message: "Seus dados foram recebidos com sucesso e nossa equipe entrará em contato em breve!",
        contactId: contactMessage.id
      });
    } catch (error) {
      console.error("Erro ao processar formulário de contato:", error);
      
      // Mesmo em caso de erro interno sério, tentamos dar uma resposta amigável
      return res.status(200).json({ 
        message: "Seus dados foram recebidos. Nossa equipe entrará em contato em breve.",
        success: true
      });
    }
  });
  
  // Endpoint para salvar cálculos ROI
  app.post("/api/roi-calculator", async (req: Request, res: Response) => {
    try {
      const result = roiCalculationRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: result.error.format() 
        });
      }
      
      const { services, ticket, noisePercent, diagnosisValue, userId } = result.data;
      
      // Obter resultado do cálculo do frontend
      const roiResult = req.body.result as ROICalculationResult;
      
      if (!roiResult) {
        return res.status(400).json({ message: "Resultado do cálculo é obrigatório" });
      }
      
      // Salvar cálculo no banco de dados
      const calculation = await storage.createCalculation({
        services,
        ticket,
        noisePercent,
        diagnosisValue,
        result: roiResult,
        userId: userId || null
      });
      
      return res.status(201).json({
        message: "Cálculo salvo com sucesso",
        calculationId: calculation.id
      });
    } catch (error) {
      console.error("Erro ao salvar cálculo ROI:", error);
      return res.status(500).json({ message: "Erro ao processar cálculo ROI" });
    }
  });
  
  // Endpoint para obter depoimentos
  app.get("/api/testimonials", async (_req: Request, res: Response) => {
    try {
      const testimonials = await storage.getTestimonials();
      return res.status(200).json({ testimonials });
    } catch (error) {
      console.error("Erro ao buscar depoimentos:", error);
      return res.status(500).json({ message: "Erro ao buscar depoimentos" });
    }
  });
  
  // Endpoint para obter depoimentos em destaque
  app.get("/api/testimonials/featured", async (_req: Request, res: Response) => {
    try {
      const testimonials = await storage.getFeaturedTestimonials();
      return res.status(200).json({ testimonials });
    } catch (error) {
      console.error("Erro ao buscar depoimentos em destaque:", error);
      return res.status(500).json({ message: "Erro ao buscar depoimentos em destaque" });
    }
  });
  
  // API para Blog
  
  // Esquema para validação de posts do blog
  const blogPostSchema = insertBlogPostSchema.extend({
    authorId: z.number().optional(),
    publishedAt: z.date().optional(),
  });
  
  // Listar todos os posts publicados
  app.get("/api/blog", async (_req: Request, res: Response) => {
    try {
      const posts = await storage.getPublishedBlogPosts();
      return res.status(200).json({ posts });
    } catch (error) {
      console.error("Erro ao buscar posts do blog:", error);
      return res.status(500).json({ message: "Erro ao buscar posts do blog" });
    }
  });
  
  // Obter posts em destaque
  app.get("/api/blog/featured", async (_req: Request, res: Response) => {
    try {
      const posts = await storage.getFeaturedBlogPosts();
      return res.status(200).json({ posts });
    } catch (error) {
      console.error("Erro ao buscar posts em destaque:", error);
      return res.status(500).json({ message: "Erro ao buscar posts em destaque" });
    }
  });
  
  // Endpoint dedicado para enviar dados diretamente ao Trello via SendGrid
  app.post("/api/trello-send", async (req: Request, res: Response) => {
    try {
      // Validar os dados recebidos
      const formData = req.body;
      
      if (!formData || !formData.nome || !formData.email) {
        return res.status(400).json({
          message: "Dados inválidos. Nome e email são obrigatórios."
        });
      }
      
      console.log("Dados do formulário processados:", {
        nome: formData.nome || formData.fullName,
        empresa: formData.empresa || formData.company,
        email: formData.email,
        whatsapp: formData.whatsapp,
        cidade: formData.cidade || formData.city,
        estado: formData.estado || formData.state,
        tipoEmpresa: formData.tipoEmpresa || formData.businessType,
        mensagem: formData.mensagem || formData.message,
        dataEnvio: new Date().toLocaleString('pt-BR'),
        origem: formData.origem || 'Site RuidCar - Formulário de Contato'
      });
      
      try {
        // Enviar para o Trello via email
        const trelloResult = await sendContactToTrello(formData);
        console.log("Envio direto para Trello:", trelloResult ? "Sucesso" : "Falha");
        
        if (trelloResult) {
          return res.status(200).json({
            message: "Seus dados foram recebidos com sucesso e nossa equipe entrará em contato em breve!",
            result: {
              success: true,
              method: "trello_email",
              message: "Dados enviados com sucesso para o Trello"
            }
          });
        } else {
          return res.status(200).json({
            message: "Seus dados foram recebidos. Nossa equipe entrará em contato em breve.",
            result: {
              success: true,
              method: "database_fallback",
              message: "Dados armazenados para processamento posterior. Falha no envio para Trello."
            }
          });
        }
      } catch (error) {
        console.error("Erro ao tentar enviar para o Trello:", error);
        
        return res.status(200).json({
          message: "Seus dados foram recebidos. Nossa equipe entrará em contato em breve.",
          result: {
            success: true,
            method: "error_recovery",
            message: "Dados armazenados para processamento posterior",
            error: error.message
          }
        });
      }
    } catch (error) {
      console.error("Erro ao processar dados do formulário:", error);
      
      // Mesmo em caso de erro, retornamos sucesso para o cliente
      return res.status(200).json({
        message: "Seus dados foram recebidos. Nossa equipe entrará em contato em breve.",
        result: {
          success: true,
          method: "error_recovery",
          message: "Dados armazenados para processamento posterior"
        }
      });
    }
  });
  
  // Manter por compatibilidade, mas redirecionar para o endpoint correto
  app.post("/api/coda-send", async (req: Request, res: Response) => {
    console.log("Redirecionando de /api/coda-send para /api/trello-send");
    // Simplesmente redirecionamos para o endpoint de Trello
    req.url = "/api/trello-send";
    app._router.handle(req, res);
  });
  
  // Obter post por slug
  app.get("/api/blog/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Post não encontrado" });
      }
      
      return res.status(200).json({ post });
    } catch (error) {
      console.error("Erro ao buscar post:", error);
      return res.status(500).json({ message: "Erro ao buscar post" });
    }
  });
  
  // Criar novo post (requer autenticação em produção)
  app.post("/api/blog", async (req: Request, res: Response) => {
    try {
      const result = blogPostSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: result.error.format() 
        });
      }
      
      const postData = result.data;
      
      // Se o post for marcado como publicado, defina a data de publicação
      if (postData.published && !postData.publishedAt) {
        postData.publishedAt = new Date();
      }
      
      // Criar post
      const post = await storage.createBlogPost({
        ...postData,
        authorId: postData.authorId || 1, // Em produção, usar o ID do usuário autenticado
      });
      
      return res.status(201).json({
        message: "Post criado com sucesso",
        post
      });
    } catch (error) {
      console.error("Erro ao criar post:", error);
      return res.status(500).json({ message: "Erro ao criar post" });
    }
  });
  
  // Atualizar post (requer autenticação em produção)
  app.put("/api/blog/:id(\\d+)", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const existingPost = await storage.getBlogPostById(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post não encontrado" });
      }
      
      const result = blogPostSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: result.error.format() 
        });
      }
      
      const postData = result.data;
      
      // Se o post está sendo publicado agora, defina a data de publicação
      if (postData.published && !existingPost.published && !postData.publishedAt) {
        postData.publishedAt = new Date();
      }
      
      // Atualizar post
      const updatedPost = await storage.updateBlogPost(postId, postData);
      
      return res.status(200).json({
        message: "Post atualizado com sucesso",
        post: updatedPost
      });
    } catch (error) {
      console.error("Erro ao atualizar post:", error);
      return res.status(500).json({ message: "Erro ao atualizar post" });
    }
  });
  
  // Excluir post (requer autenticação em produção)
  app.delete("/api/blog/:id(\\d+)", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);

      if (isNaN(postId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const existingPost = await storage.getBlogPostById(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post não encontrado" });
      }

      // Excluir post
      await storage.deleteBlogPost(postId);

      return res.status(200).json({
        message: "Post excluído com sucesso"
      });
    } catch (error) {
      console.error("Erro ao excluir post:", error);
      return res.status(500).json({ message: "Erro ao excluir post" });
    }
  });

  // API para Oficinas RuidCar

  // Listar todas as oficinas ativas
  app.get("/api/workshops", async (_req: Request, res: Response) => {
    try {
      const workshops = await storage.getActiveWorkshops();
      return res.status(200).json({ workshops });
    } catch (error) {
      console.error("Erro ao buscar oficinas:", error);
      return res.status(500).json({ message: "Erro ao buscar oficinas" });
    }
  });

  // Buscar oficina por ID (apenas números) — evita capturar '/nearby', '/state/...', etc.
  app.get("/api/workshops/:id(\\d+)", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const workshopId = parseInt(id);

      if (isNaN(workshopId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const workshop = await storage.getWorkshopById(workshopId);

      if (!workshop) {
        return res.status(404).json({ message: "Oficina não encontrada" });
      }

      return res.status(200).json({ workshop });
    } catch (error) {
      console.error("Erro ao buscar oficina:", error);
      return res.status(500).json({ message: "Erro ao buscar oficina" });
    }
  });

  // Buscar oficinas por estado
  app.get("/api/workshops/state/:state", async (req: Request, res: Response) => {
    try {
      const { state } = req.params;
      const workshops = await storage.getWorkshopsByState(state.toUpperCase());
      return res.status(200).json({ workshops });
    } catch (error) {
      console.error("Erro ao buscar oficinas por estado:", error);
      return res.status(500).json({ message: "Erro ao buscar oficinas por estado" });
    }
  });

  // Buscar oficinas por cidade
  app.get("/api/workshops/city/:city", async (req: Request, res: Response) => {
    try {
      const { city } = req.params;
      const workshops = await storage.getWorkshopsByCity(city);
      return res.status(200).json({ workshops });
    } catch (error) {
      console.error("Erro ao buscar oficinas por cidade:", error);
      return res.status(500).json({ message: "Erro ao buscar oficinas por cidade" });
    }
  });

  // Buscar oficinas próximas (por coordenadas)
  app.get("/api/workshops/nearby", async (req: Request, res: Response) => {
    try {
      const { lat, lng, radius = "100" } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          message: "Latitude e longitude são obrigatórias"
        });
      }

      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const searchRadius = parseFloat(radius as string);

      if (isNaN(userLat) || isNaN(userLng) || isNaN(searchRadius)) {
        return res.status(400).json({
          message: "Coordenadas ou raio inválidos"
        });
      }

      // Buscar todas as oficinas ativas
      const allWorkshops = await storage.getActiveWorkshops();

      // Calcular distância usando fórmula de Haversine
      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      // Filtrar e ordenar por distância
      const nearbyWorkshops = allWorkshops
        .map(workshop => {
          const workshopLat = parseFloat(workshop.latitude);
          const workshopLng = parseFloat(workshop.longitude);
          const distance = calculateDistance(userLat, userLng, workshopLat, workshopLng);
          return { ...workshop, distance };
        })
        .filter(workshop => workshop.distance <= searchRadius)
        .sort((a, b) => a.distance - b.distance);

      return res.status(200).json({
        workshops: nearbyWorkshops,
        count: nearbyWorkshops.length,
        radius: searchRadius
      });
    } catch (error) {
      console.error("Erro ao buscar oficinas próximas:", error);
      return res.status(500).json({ message: "Erro ao buscar oficinas próximas" });
    }
  });

  // Buscar apenas a oficina mais próxima (otimizado para velocidade)
  app.get("/api/workshops/nearest-one", async (req: Request, res: Response) => {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          message: "Latitude e longitude são obrigatórias"
        });
      }

      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);

      if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({
          message: "Coordenadas inválidas"
        });
      }

      // Buscar todas as oficinas ativas
      const allWorkshops = await storage.getActiveWorkshops();

      if (allWorkshops.length === 0) {
        return res.status(404).json({
          message: "Nenhuma oficina ativa encontrada"
        });
      }

      // Função para calcular distância usando fórmula de Haversine
      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      // Calcular distância para cada oficina e encontrar a mais próxima
      let nearestWorkshop = null;
      let minDistance = Infinity;

      for (const workshop of allWorkshops) {
        const workshopLat = parseFloat(workshop.latitude);
        const workshopLng = parseFloat(workshop.longitude);

        if (isNaN(workshopLat) || isNaN(workshopLng)) {
          continue; // Pula oficinas com coordenadas inválidas
        }

        const distance = calculateDistance(userLat, userLng, workshopLat, workshopLng);

        if (distance < minDistance) {
          minDistance = distance;
          nearestWorkshop = { ...workshop, distance };
        }
      }

      if (!nearestWorkshop) {
        return res.status(404).json({
          message: "Nenhuma oficina com coordenadas válidas encontrada"
        });
      }

      console.log(`🎯 Oficina mais próxima encontrada: ${nearestWorkshop.name} (${nearestWorkshop.distance.toFixed(2)}km)`);

      return res.status(200).json({
        workshop: nearestWorkshop,
        distance: nearestWorkshop.distance,
        userLocation: { latitude: userLat, longitude: userLng }
      });

    } catch (error) {
      console.error("Erro ao buscar oficina mais próxima:", error);
      return res.status(500).json({
        message: "Erro ao buscar oficina mais próxima"
      });
    }
  });

  // Busca inteligente com linguagem natural
  app.post("/api/workshops/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query de busca é obrigatória" });
      }

      // Buscar todas as oficinas ativas
      const allWorkshops = await storage.getActiveWorkshops();

      // Busca simples por texto (pode ser melhorada com IA)
      const searchTerm = query.toLowerCase();

      // Extrair possíveis estados ou cidades da query
      const stateAbbreviations = ['RS', 'CE', 'PA', 'MA', 'ES', 'GO', 'DF', 'MG', 'PB', 'PE', 'PR', 'RJ', 'SP', 'SC', 'BA', 'AM', 'MT', 'MS', 'RO', 'RR', 'AC', 'TO', 'AP', 'AL', 'SE', 'PI', 'RN'];
      const stateNames: { [key: string]: string } = {
        'rio grande do sul': 'RS',
        'ceará': 'CE',
        'ceara': 'CE',
        'pará': 'PA',
        'para': 'PA',
        'maranhão': 'MA',
        'maranhao': 'MA',
        'espírito santo': 'ES',
        'espirito santo': 'ES',
        'goiás': 'GO',
        'goias': 'GO',
        'distrito federal': 'DF',
        'brasília': 'DF',
        'brasilia': 'DF',
        'minas gerais': 'MG',
        'paraíba': 'PB',
        'paraiba': 'PB',
        'pernambuco': 'PE',
        'paraná': 'PR',
        'parana': 'PR',
        'rio de janeiro': 'RJ',
        'são paulo': 'SP',
        'sao paulo': 'SP'
      };

      let filteredWorkshops = allWorkshops;

      // Verificar se a query menciona um estado
      let stateFilter: string | null = null;
      for (const [name, abbr] of Object.entries(stateNames)) {
        if (searchTerm.includes(name)) {
          stateFilter = abbr;
          break;
        }
      }

      // Verificar abreviações de estado
      if (!stateFilter) {
        for (const abbr of stateAbbreviations) {
          if (searchTerm.includes(abbr.toLowerCase()) || searchTerm.includes(` ${abbr} `)) {
            stateFilter = abbr;
            break;
          }
        }
      }

      if (stateFilter) {
        filteredWorkshops = filteredWorkshops.filter(w => w.state === stateFilter);
      } else {
        // Busca genérica por nome, endereço ou cidade
        filteredWorkshops = allWorkshops.filter(workshop => {
          const searchableText = `${workshop.name} ${workshop.address} ${workshop.city || ''} ${workshop.state || ''}`.toLowerCase();
          return searchableText.includes(searchTerm);
        });
      }

      // Ordenar por relevância (por enquanto, apenas alfabético)
      filteredWorkshops.sort((a, b) => a.name.localeCompare(b.name));

      return res.status(200).json({
        workshops: filteredWorkshops,
        count: filteredWorkshops.length,
        query: query
      });
    } catch (error) {
      console.error("Erro na busca inteligente:", error);
      return res.status(500).json({ message: "Erro ao processar busca" });
    }
  });

  // Endpoint para validação de CEP
  app.get("/api/cep/:cep", async (req: Request, res: Response) => {
    try {
      const { cep } = req.params;

      // Validar formato do CEP
      const cepPattern = /^[0-9]{8}$/;
      if (!cepPattern.test(cep)) {
        return res.status(400).json({
          message: "CEP deve conter exatamente 8 dígitos numéricos",
          valid: false
        });
      }

      // Buscar CEP na API ViaCEP
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

      if (!viaCepResponse.ok) {
        throw new Error('Erro na consulta do CEP');
      }

      const cepData = await viaCepResponse.json();

      // Verificar se CEP existe
      if (cepData.erro) {
        return res.status(404).json({
          message: "CEP não encontrado",
          valid: false
        });
      }

      // Retornar dados do CEP
      return res.status(200).json({
        valid: true,
        cep: cepData.cep,
        logradouro: cepData.logradouro,
        complemento: cepData.complemento,
        bairro: cepData.bairro,
        localidade: cepData.localidade,
        uf: cepData.uf,
        ibge: cepData.ibge,
        gia: cepData.gia,
        ddd: cepData.ddd,
        siafi: cepData.siafi
      });

    } catch (error) {
      console.error("Erro ao consultar CEP:", error);
      return res.status(500).json({
        message: "Erro interno ao consultar CEP",
        valid: false
      });
    }
  });

  // Endpoint para buscar oficina por código único
  app.get("/api/workshops/search-by-code/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;

      // Validar formato do código
      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          message: "Código é obrigatório"
        });
      }

      // Buscar todas as oficinas (incluindo inativas para permitir validação)
      const allWorkshops = await storage.getWorkshops();

      // Buscar oficina pelo código único
      const workshop = allWorkshops.find(w => w.uniqueCode === code.toUpperCase());

      if (!workshop) {
        return res.status(404).json({
          message: "Oficina não encontrada com este código",
          found: false
        });
      }

      return res.status(200).json({
        found: true,
        workshop: {
          id: workshop.id,
          uniqueCode: workshop.uniqueCode,
          name: workshop.name,
          address: workshop.address,
          city: workshop.city,
          state: workshop.state,
          phone: workshop.phone,
          active: workshop.active
        }
      });

    } catch (error) {
      console.error("Erro ao buscar oficina por código:", error);
      return res.status(500).json({
        message: "Erro interno ao buscar oficina"
      });
    }
  });

  // APIs Administrativas - Requerem permissões de admin

  // Criar usuário admin (apenas para setup inicial)
  app.post("/api/admin/setup", async (req: Request, res: Response) => {
    try {
      const { password, email, name, phone, setupKey } = req.body;

      // Verificar chave de setup (por segurança)
      if (setupKey !== process.env.ADMIN_SETUP_KEY && setupKey !== "ruidcar-admin-setup-2025") {
        return res.status(403).json({ message: "Chave de setup inválida" });
      }

      // Verificar se já existe um admin
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe" });
      }

      const adminUser = await createAdminUser({
        password,
        email,
        name,
        phone
      });

      return res.status(201).json({
        message: "Usuário administrador criado com sucesso",
        user: adminUser
      });
    } catch (error) {
      console.error("Erro ao criar admin:", error);
      return res.status(500).json({ message: "Erro ao criar administrador" });
    }
  });

  // Login simplificado (funciona com estrutura atual)
  app.post("/api/auth/admin-login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      console.log('🔍 Admin login attempt:', { email, password: '***' });

      if (!email || !password) {
        return res.status(400).json({ message: "Email e password são obrigatórios" });
      }

      // Buscar usuário por email
      const user = await storage.getUserByEmail(email).catch(() => null);

      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Verificar senha usando bcrypt apenas - SEM FALLBACK INSEGURO
      let isPasswordValid = false;
      try {
        // Verificar se a senha é um hash bcrypt válido
        if (!user.password.startsWith('$2b$')) {
          console.log('❌ Senha não está hashada com bcrypt. Acesso negado.');
          return res.status(401).json({
            message: "Credenciais inválidas",
            error: "Password not properly hashed. Contact administrator."
          });
        }

        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('🔐 bcrypt.compare result:', isPasswordValid);
      } catch (error) {
        console.log('❌ bcrypt.compare error:', error);
        return res.status(500).json({
          message: "Erro interno do servidor",
          error: "Authentication system error"
        });
      }

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Verificar se é admin (compatível com estrutura antiga e nova)
      const isAdminUser = (user as any).role === 'admin' || (user as any).role === 'ADMIN';
      if (!isAdminUser) {
        return res.status(403).json({ message: "Acesso negado. Permissões de administrador necessárias." });
      }

      // Return user info (in production, use JWT)
      const { password: _, ...safeUser } = user;

      // Gerar token JWT seguro
      const token = generateJWT({
        userId: user.id,
        email: user.email,
        name: user.name || user.username || 'Admin',
        phone: (user as any).phone || null,
        roles: [{
          roleId: 1,
          roleName: 'ADMIN',
          organizationId: null,
          permissions: ['CRUD_GLOBAL', 'VIEW_ALL_TENANTS', 'MANAGE_USERS', 'MANAGE_ROLES', 'VIEW_REPORTS_GLOBAL']
        }],
        organizationIds: []
      });

      // Definir cookie seguro HTTP-only
      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        path: '/'
      });

      return res.status(200).json({
        message: "Login realizado com sucesso",
        user: {
          id: safeUser.id,
          email: safeUser.email,
          name: safeUser.name || safeUser.username || 'Admin',
          phone: (safeUser as any).phone
        },
        // Não retornar token no body por segurança
        roles: [{
          roleId: 1,
          roleName: 'ADMIN',
          organizationId: null,
          permissions: ['admin:all']
        }],
        organizations: [],
        primaryRole: 'ADMIN',
        defaultRedirect: '/admin',
        multipleRoles: false
      });
    } catch (error) {
      console.error("Erro no login admin:", error);
      return res.status(500).json({ message: "Erro no servidor" });
    }
  });

  // ==========================================
  // WORKSHOP AUTHENTICATION ENDPOINTS
  // ==========================================

  // Esquemas para validação das oficinas
  const workshopRegistrationSchema = insertWorkshopAdminSchema.extend({
    confirmPassword: z.string(),
    workshopName: z.string().min(3, "Nome da oficina deve ter pelo menos 3 caracteres"),
    workshopCEP: z.string().min(8, "CEP é obrigatório").optional(),
    workshopAddress: z.string().min(10, "Endereço deve ser completo"),
    workshopPhone: z.string().min(10, "Telefone deve ser válido"),
    workshopCity: z.string().min(2, "Cidade é obrigatória"),
    workshopState: z.string().length(2, "Estado deve ter 2 caracteres"),
    latitude: z.string().min(1, "Coordenadas são obrigatórias"),
    longitude: z.string().min(1, "Coordenadas são obrigatórias"),
    // Campos para modo de oficina existente
    existingWorkshopCode: z.string().optional(),
  }).refine(data => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

  const workshopLoginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Senha é obrigatória")
  });

  // Registro de nova oficina
  app.post("/api/workshop/auth/register", async (req: Request, res: Response) => {
    try {
      const result = workshopRegistrationSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: result.error.format()
        });
      }

      const {
        email, password, name, phone, workshopName, workshopAddress,
        workshopPhone, workshopCity, workshopState, latitude, longitude
      } = result.data;

      // Verificar se o email já existe
      const existingAdmin = await storage.getWorkshopAdminByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      // Criar novo administrador da oficina
      const hashedPassword = await hashWorkshopPassword(password);
      const newAdmin = await storage.createWorkshopAdmin({
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'workshop_admin'
      });

      // Gerar código único (RCW-XXXX aleatório não colidente)
      const generateUniqueCode = async (): Promise<string> => {
        const randomCode = () => `RCW-${Math.floor(1000 + Math.random() * 9000)}`;
        const all = await storage.getWorkshops();
        let code = randomCode();
        const existingSet = new Set(all.map(w => (w.uniqueCode || '').toUpperCase()));
        let attempts = 0;
        while (existingSet.has(code) && attempts < 50) {
          code = randomCode();
          attempts++;
        }
        return code;
      };

      const uniqueCode = await generateUniqueCode();

      // Criar a oficina
      const newWorkshop = await storage.createWorkshop({
        uniqueCode,
        name: workshopName,
        address: workshopAddress,
        contact: name,
        phone: workshopPhone,
        latitude,
        longitude,
        city: workshopCity,
        state: workshopState.toUpperCase(),
        active: false // Aguardando aprovação
      });

      // Criar permissão para o administrador gerenciar a oficina
      await storage.createWorkshopAdminPermission({
        adminId: newAdmin.id,
        workshopId: newWorkshop.id,
        canEdit: true,
        canViewReports: true,
        canManageAppointments: true
      });

      // Criar usuário regular correspondente e definir owner_id
      try {
        // Criar novo usuário regular
        const newUser = await db
          .insert(users)
          .values({
            username: email.split('@')[0],
            email: email,
            name: name,
            password: hashedPassword,
            createdAt: new Date()
          })
          .returning();

        const userId = newUser[0].id;

        // Adicionar role OFICINA_OWNER
        const oficinaOwnerRole = await db
          .select()
          .from(roles)
          .where(eq(roles.name, 'OFICINA_OWNER'))
          .limit(1);

        if (oficinaOwnerRole.length > 0) {
          await db
            .insert(userRoles)
            .values({
              userId: userId,
              roleId: oficinaOwnerRole[0].id,
              organizationId: newWorkshop.id,
              isActive: true
            })
            .onConflictDoNothing();
        }

        // Atualizar owner_id na tabela workshops
        await db
          .update(workshops)
          .set({
            ownerId: userId,
            updatedAt: new Date()
          })
          .where(eq(workshops.id, newWorkshop.id));

        console.log(`✅ Oficina ${newWorkshop.id} vinculada ao usuário ${userId} (${email})`);
      } catch (error) {
        console.error('Erro ao criar usuário regular para dono de oficina:', error);
        // Não falhar o registro se houver erro na criação do usuário regular
      }

      // Não retornar a senha
      const { password: _, ...adminWithoutPassword } = newAdmin;

      return res.status(201).json({
        message: "Oficina cadastrada com sucesso! Aguarde aprovação do administrador.",
        admin: adminWithoutPassword,
        workshop: newWorkshop
      });
    } catch (error) {
      console.error("Erro ao registrar oficina:", error);
      return res.status(500).json({ message: "Erro ao processar cadastro" });
    }
  });

  // Login de administrador da oficina
  app.post("/api/workshop/auth/login", async (req: Request, res: Response) => {
    try {
      const result = workshopLoginSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: result.error.format()
        });
      }

      const { email, password } = result.data;
      const normalizedEmail = email.trim().toLowerCase();

      // Buscar administrador da oficina
      const admin = await storage.getWorkshopAdminByEmail(normalizedEmail);
      console.log('🔑 Workshop login attempt:', { email: normalizedEmail, found: !!admin });
      if (admin) {
        console.log('🔎 Admin record:', {
          id: admin.id,
          email: admin.email,
          isActive: (admin as any).isActive,
          emailVerified: (admin as any).emailVerified,
          passwordPrefix: typeof admin.password === 'string' ? admin.password.slice(0, 4) : 'n/a',
        });
      }

      if (!admin || !(await validateWorkshopPassword(password, admin.password))) {
        if (admin) {
          console.log('🔒 Password compare failed (bcrypt) for', normalizedEmail);
        }
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      if (!admin.isActive) {
        return res.status(403).json({
          message: "Conta desativada. Entre em contato com o suporte.",
          code: "ACCOUNT_DISABLED"
        });
      }

      // Buscar oficinas do administrador
      const workshops = await storage.getWorkshopsByAdminId(admin.id);

      if (workshops.length === 0) {
        return res.status(403).json({
          message: "Nenhuma oficina associada a esta conta.",
          code: "NO_WORKSHOPS"
        });
      }

      // Verificar se tem pelo menos uma oficina ativa
      const activeWorkshops = workshops.filter(w => w.active);
      if (activeWorkshops.length === 0) {
        return res.status(403).json({
          message: "Suas oficinas estão aguardando aprovação.",
          code: "WORKSHOPS_PENDING"
        });
      }

      // Criar token e atualizar último login
      const token = createWorkshopToken(admin);
      await storage.updateWorkshopAdminLastLogin(admin.id);

      // Não retornar a senha
      const { password: _, ...adminWithoutPassword } = admin;

      return res.status(200).json({
        message: "Login realizado com sucesso",
        admin: adminWithoutPassword,
        workshops: activeWorkshops,
        token
      });
    } catch (error) {
      console.error("Erro no login da oficina:", error);
      return res.status(500).json({ message: "Erro ao processar login" });
    }
  });

  // Reset de senha (modo desenvolvimento) para oficinas
  app.post("/api/workshop/auth/reset-password-dev", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email("Email inválido"),
        newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string().min(6)
      }).refine(d => d.newPassword === d.confirmPassword, { message: "As senhas não coincidem", path: ["confirmPassword"] });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.format() });
      }

      const normalizedEmail = parsed.data.email.trim().toLowerCase();
      const admin = await storage.getWorkshopAdminByEmail(normalizedEmail);
      if (!admin) {
        return res.status(404).json({ message: "Administrador não encontrado" });
      }

      const hashed = await hashWorkshopPassword(parsed.data.newPassword);
      await storage.updateWorkshopAdmin(admin.id, {
        password: hashed,
        // @ts-ignore
        isActive: true,
        // @ts-ignore
        emailVerified: true
      });

      console.log('🔧 Reset de senha DEV aplicado para', normalizedEmail);
      return res.status(200).json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error('Erro no reset-password-dev:', error);
      return res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  // Reivindicar/ativar acesso a uma oficina existente por código único
  app.post("/api/workshop/auth/claim-by-code", async (req: Request, res: Response) => {
    try {
      const claimSchema = z.object({
        code: z.string().min(3, "Código inválido"),
        email: z.string().email("Email inválido"),
        name: z.string().min(2, "Nome é obrigatório"),
        phone: z.string().min(8, "Telefone inválido").optional(),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string().min(6)
      }).refine(data => data.password === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
      });

      const result = claimSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: result.error.format()
        });
      }

      const { code, email, name, phone, password } = result.data;
      const normalizedEmail = email.trim().toLowerCase();

      // Encontrar oficina pelo código único (case-insensitive)
      const allWorkshops = await storage.getWorkshops();
      const normalizedCode = code.trim().toUpperCase();
      const targetWorkshop = allWorkshops.find(w =>
        w.uniqueCode &&
        w.uniqueCode.trim().toUpperCase() === normalizedCode
      );

      if (!targetWorkshop) {
        return res.status(404).json({
          message: `Código "${code}" não encontrado. Verifique se digitou corretamente (ex: RCW-1234)`,
          code: "WORKSHOP_NOT_FOUND",
          hint: "O código deve ser exatamente como foi fornecido pela RuidCar"
        });
      }

      // Verificar se já existe admin com este email
      let admin = await storage.getWorkshopAdminByEmail(normalizedEmail);

      if (!admin) {
        const hashedPassword = await hashWorkshopPassword(password);
        admin = await storage.createWorkshopAdmin({
          email: normalizedEmail,
          password: hashedPassword,
          name,
          phone: phone || null,
          role: 'workshop_admin',
          // @ts-ignore
          isActive: true,
          // @ts-ignore
          emailVerified: true
        });
      } else {
        // Atualizar senha e dados básicos ao reivindicar com código válido
        const hashedPassword = await hashWorkshopPassword(password);
        admin = await storage.updateWorkshopAdmin(admin.id, {
          password: hashedPassword,
          name,
          phone: phone || null,
          // @ts-ignore
          isActive: true,
          // @ts-ignore
          emailVerified: true
        });
      }

      // Garantir permissão para esta oficina
      const existingPermissions = await storage.getWorkshopAdminPermissions(admin.id);
      const alreadyHasAccess = existingPermissions.some(p => p.workshopId === targetWorkshop.id);
      if (!alreadyHasAccess) {
        await storage.createWorkshopAdminPermission({
          adminId: admin.id,
          workshopId: targetWorkshop.id,
          canEdit: true,
          canViewReports: true,
          canManageAppointments: true
        });
      }

      // Criar ou buscar usuário regular correspondente e definir owner_id
      try {
        // Buscar usuário regular com mesmo email
        let regularUser = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        let userId: number;

        if (regularUser.length === 0) {
          // Criar novo usuário regular
          const newUser = await db
            .insert(users)
            .values({
              username: normalizedEmail.split('@')[0],
              email: normalizedEmail,
              name: name,
              password: await hashWorkshopPassword(password),
              createdAt: new Date()
            })
            .returning();

          userId = newUser[0].id;

          // Adicionar role OFICINA_OWNER
          const oficinaOwnerRole = await db
            .select()
            .from(roles)
            .where(eq(roles.name, 'OFICINA_OWNER'))
            .limit(1);

          if (oficinaOwnerRole.length > 0) {
            await db
              .insert(userRoles)
              .values({
                userId: userId,
                roleId: oficinaOwnerRole[0].id,
                organizationId: targetWorkshop.id,
                isActive: true
              })
              .onConflictDoNothing();
          }
        } else {
          userId = regularUser[0].id;

          // Verificar se já tem role OFICINA_OWNER para esta oficina
          const hasRole = await db
            .select()
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(and(
              eq(userRoles.userId, userId),
              eq(roles.name, 'OFICINA_OWNER'),
              eq(userRoles.organizationId, targetWorkshop.id)
            ))
            .limit(1);

          if (hasRole.length === 0) {
            const oficinaOwnerRole = await db
              .select()
              .from(roles)
              .where(eq(roles.name, 'OFICINA_OWNER'))
              .limit(1);

            if (oficinaOwnerRole.length > 0) {
              await db
                .insert(userRoles)
                .values({
                  userId: userId,
                  roleId: oficinaOwnerRole[0].id,
                  organizationId: targetWorkshop.id,
                  isActive: true
                })
                .onConflictDoNothing();
            }
          }
        }

        // Atualizar owner_id na tabela workshops
        await db
          .update(workshops)
          .set({
            ownerId: userId,
            updatedAt: new Date()
          })
          .where(eq(workshops.id, targetWorkshop.id));

        console.log(`✅ Oficina ${targetWorkshop.id} vinculada ao usuário ${userId} (${normalizedEmail})`);
      } catch (error) {
        console.error('Erro ao criar/vincular usuário regular:', error);
        // Não falhar a operação se houver erro na criação do usuário regular
      }

      // Verificar se esta oficina já tinha outros admins antes desta reivindicação
      const allWorkshopPermissions = await db
        .select()
        .from(workshopAdminPermissions)
        .where(eq(workshopAdminPermissions.workshopId, targetWorkshop.id));

      // REMOVIDO: Lógica que desativava oficinas ativas após primeira reivindicação
      // Oficinas já ativas devem permanecer ativas quando um admin reivindica acesso
      // Apenas oficinas criadas sem admin (via script/migração) devem começar inativas

      console.log(`✅ Oficina ${targetWorkshop.id} (${targetWorkshop.name}) reivindicada com sucesso. Status atual: ${targetWorkshop.active ? 'Ativa' : 'Pendente de aprovação'}`);

      // Criar token para login imediato (opcional)
      const token = createWorkshopToken(admin);
      await storage.updateWorkshopAdminLastLogin(admin.id);

      const { password: _pwd, ...adminWithoutPassword } = admin;

      // Definir cookie específico para painel da oficina
      res.cookie('workshop-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      return res.status(200).json({
        message: "Acesso à oficina ativado com sucesso",
        admin: adminWithoutPassword,
        workshop: {
          id: targetWorkshop.id,
          uniqueCode: targetWorkshop.uniqueCode,
          name: targetWorkshop.name,
          city: targetWorkshop.city,
          state: targetWorkshop.state,
          active: targetWorkshop.active
        },
        token
      });
    } catch (error) {
      console.error("Erro ao reivindicar oficina por código:", error);
      return res.status(500).json({ message: "Erro ao ativar acesso por código" });
    }
  });

  // Perfil do administrador da oficina
  app.get("/api/workshop/auth/profile", requireWorkshopAdmin, async (req: Request, res: Response) => {
    try {
      if (!req.workshopAdmin) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      // Buscar oficinas do administrador
      const workshops = await storage.getWorkshopsByAdminId(req.workshopAdmin.id);

      // Não retornar a senha
      const { password: _, ...adminWithoutPassword } = req.workshopAdmin;

      return res.status(200).json({
        admin: adminWithoutPassword,
        workshops,
        permissions: req.workshopPermissions
      });
    } catch (error) {
      console.error("Erro ao buscar perfil da oficina:", error);
      return res.status(500).json({ message: "Erro ao buscar perfil" });
    }
  });

  // Atualizar perfil do administrador da oficina
  app.put("/api/workshop/auth/profile", requireWorkshopAdmin, async (req: Request, res: Response) => {
    try {
      if (!req.workshopAdmin) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const updateSchema = insertWorkshopAdminSchema.partial().omit({
        email: true, // Email não pode ser alterado
        password: true // Senha tem endpoint separado
      });

      const result = updateSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: result.error.format()
        });
      }

      const updatedAdmin = await storage.updateWorkshopAdmin(req.workshopAdmin.id, result.data);

      // Não retornar a senha
      const { password: _, ...adminWithoutPassword } = updatedAdmin;

      return res.status(200).json({
        message: "Perfil atualizado com sucesso",
        admin: adminWithoutPassword
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil da oficina:", error);
      return res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  // Alterar senha do administrador da oficina
  app.put("/api/workshop/auth/change-password", requireWorkshopAdmin, async (req: Request, res: Response) => {
    try {
      if (!req.workshopAdmin) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const changePasswordSchema = z.object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória")
      }).refine(data => data.newPassword === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
      });

      const result = changePasswordSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: result.error.format()
        });
      }

      const { currentPassword, newPassword } = result.data;

      // Verificar senha atual
      if (!(await validateWorkshopPassword(currentPassword, req.workshopAdmin.password))) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }

      // Atualizar senha
      const hashedNewPassword = await hashWorkshopPassword(newPassword);
      await storage.updateWorkshopAdmin(req.workshopAdmin.id, {
        password: hashedNewPassword
      });

      return res.status(200).json({
        message: "Senha alterada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao alterar senha da oficina:", error);
      return res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  // ========== ENDPOINTS DE AGENDAMENTOS DA OFICINA ==========

  // Listar agendamentos da oficina
  app.get("/api/workshop/appointments", requireWorkshopAdmin, async (req: Request, res: Response) => {
    try {
      if (!req.workshopAdmin || !req.workshopPermissions) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      // Buscar oficinas que o admin tem acesso
      const workshopIds = req.workshopPermissions.map(p => p.workshopId);

      // Buscar agendamentos das oficinas
      const appointments = await storage.db
        .select()
        .from(contactMessages)
        .where(
          sql`${contactMessages.workshopId} IN ${sql.raw(`(${workshopIds.join(',')})`)} AND ${contactMessages.appointmentType} IS NOT NULL`
        )
        .orderBy(desc(contactMessages.createdAt));

      return res.status(200).json({ appointments });
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      return res.status(500).json({ message: "Erro ao buscar agendamentos" });
    }
  });

  // Responder agendamento
  app.put("/api/workshop/appointments/:id/respond", requireWorkshopAdmin, async (req: Request, res: Response) => {
    try {
      if (!req.workshopAdmin) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const appointmentId = parseInt(req.params.id);
      const { status, notes, estimatedPrice } = req.body;

      // Verificar se o agendamento pertence a uma das oficinas do admin
      const appointment = await storage.db
        .select()
        .from(contactMessages)
        .where(eq(contactMessages.id, appointmentId))
        .limit(1);

      if (!appointment[0] || !appointment[0].workshopId) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }

      const hasPermission = req.workshopPermissions?.some(
        p => p.workshopId === appointment[0].workshopId
      );

      if (!hasPermission) {
        return res.status(403).json({ message: "Sem permissão para este agendamento" });
      }

      // Atualizar agendamento
      await storage.db
        .update(contactMessages)
        .set({
          status,
          workshopNotes: notes,
          estimatedPrice,
          respondedAt: new Date(),
          responded: true
        })
        .where(eq(contactMessages.id, appointmentId));

      return res.status(200).json({ message: "Agendamento atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao responder agendamento:", error);
      return res.status(500).json({ message: "Erro ao responder agendamento" });
    }
  });

  // ========== ENDPOINTS DE PERFIL DA OFICINA ==========

  // Obter dados completos da oficina
  app.get("/api/workshop/profile/:workshopId", requireWorkshopAdmin, async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.workshopId);

      // Verificar permissão
      const hasPermission = req.workshopPermissions?.some(
        p => p.workshopId === workshopId
      );

      if (!hasPermission) {
        return res.status(403).json({ message: "Sem permissão para esta oficina" });
      }

      const workshop = await storage.getWorkshopById(workshopId);
      if (!workshop) {
        return res.status(404).json({ message: "Oficina não encontrada" });
      }

      // Buscar serviços da oficina
      const services = await storage.db
        .select()
        .from(workshopServices)
        .where(eq(workshopServices.workshopId, workshopId));

      return res.status(200).json({ workshop, services });
    } catch (error) {
      console.error("Erro ao buscar perfil da oficina:", error);
      return res.status(500).json({ message: "Erro ao buscar dados da oficina" });
    }
  });

  // Atualizar perfil da oficina
  app.put("/api/workshop/profile/:workshopId", requireWorkshopAdmin, async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.workshopId);

      // Verificar permissão de edição
      const permission = req.workshopPermissions?.find(
        p => p.workshopId === workshopId
      );

      if (!permission || !permission.canEdit) {
        return res.status(403).json({ message: "Sem permissão de edição para esta oficina" });
      }

      // Atualizar dados da oficina
      await storage.updateWorkshop(workshopId, req.body);

      return res.status(200).json({ message: "Perfil atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar perfil da oficina:", error);
      return res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  // ========== ENDPOINTS DE SERVIÇOS DA OFICINA ==========

  // Listar serviços da oficina
  app.get("/api/workshop/services/:workshopId", requireWorkshopAdmin, async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.workshopId);

      // Verificar permissão
      const hasPermission = req.workshopPermissions?.some(
        p => p.workshopId === workshopId
      );

      if (!hasPermission) {
        return res.status(403).json({ message: "Sem permissão para esta oficina" });
      }

      const services = await storage.db
        .select()
        .from(workshopServices)
        .where(eq(workshopServices.workshopId, workshopId));

      return res.status(200).json({ services });
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      return res.status(500).json({ message: "Erro ao buscar serviços" });
    }
  });

  // Adicionar/Atualizar serviço
  app.post("/api/workshop/services/:workshopId", requireWorkshopAdmin, async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.workshopId);

      // Verificar permissão de edição
      const permission = req.workshopPermissions?.find(
        p => p.workshopId === workshopId
      );

      if (!permission || !permission.canEdit) {
        return res.status(403).json({ message: "Sem permissão de edição para esta oficina" });
      }

      const serviceData = {
        workshopId,
        ...req.body
      };

      // Se tem ID, atualizar. Se não, criar novo
      if (req.body.id) {
        await storage.db
          .update(workshopServices)
          .set(serviceData)
          .where(eq(workshopServices.id, req.body.id));
      } else {
        await storage.db
          .insert(workshopServices)
          .values(serviceData);
      }

      return res.status(200).json({ message: "Serviço salvo com sucesso" });
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      return res.status(500).json({ message: "Erro ao salvar serviço" });
    }
  });

  // Deletar serviço
  app.delete("/api/workshop/services/:workshopId/:serviceId", requireWorkshopAdmin, async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.workshopId);
      const serviceId = parseInt(req.params.serviceId);

      // Verificar permissão de edição
      const permission = req.workshopPermissions?.find(
        p => p.workshopId === workshopId
      );

      if (!permission || !permission.canEdit) {
        return res.status(403).json({ message: "Sem permissão de edição para esta oficina" });
      }

      await storage.db
        .delete(workshopServices)
        .where(
          and(
            eq(workshopServices.id, serviceId),
            eq(workshopServices.workshopId, workshopId)
          )
        );

      return res.status(200).json({ message: "Serviço removido com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar serviço:", error);
      return res.status(500).json({ message: "Erro ao deletar serviço" });
    }
  });

  // Dashboard - Estatísticas das oficinas
  app.get("/api/admin/dashboard", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allWorkshops = await storage.getWorkshops();
      const activeWorkshops = await storage.getActiveWorkshops();

      // Calcular estatísticas
      const stats = {
        total: allWorkshops.length,
        active: activeWorkshops.length,
        inactive: allWorkshops.length - activeWorkshops.length,
        byState: {} as Record<string, number>,
        recentlyAdded: allWorkshops.slice(-5).reverse()
      };

      // Contar por estado
      allWorkshops.forEach(workshop => {
        if (workshop.state) {
          stats.byState[workshop.state] = (stats.byState[workshop.state] || 0) + 1;
        }
      });

      return res.status(200).json({ stats });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Lead Management Endpoints
  const leadRoutes = await import("./routes/leads");

  app.get("/api/admin/leads", requireAdmin, leadRoutes.getLeads);
  app.get("/api/admin/leads/dashboard", requireAdmin, leadRoutes.getLeadDashboard);
  app.get("/api/admin/leads/export", requireAdmin, leadRoutes.exportLeads);
  app.get("/api/admin/leads/:id(\\d+)", requireAdmin, leadRoutes.getLeadById);
  app.put("/api/admin/leads/:id(\\d+)/status", requireAdmin, leadRoutes.updateLeadStatus);
  app.post("/api/admin/leads/:id(\\d+)/interaction", requireAdmin, leadRoutes.addLeadInteraction);
  app.post("/api/admin/leads/:id(\\d+)/assign", requireAdmin, leadRoutes.assignLead);

  // Listar todas as oficinas (incluindo inativas) - Admin only
  app.get("/api/admin/workshops", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, search, state, active } = req.query;

      let workshops = await storage.getWorkshops();

      // Filtrar por busca
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase();
        workshops = workshops.filter(w =>
          w.name.toLowerCase().includes(searchTerm) ||
          w.address.toLowerCase().includes(searchTerm) ||
          (w.city && w.city.toLowerCase().includes(searchTerm))
        );
      }

      // Filtrar por estado
      if (state && typeof state === 'string') {
        workshops = workshops.filter(w => w.state === state.toUpperCase());
      }

      // Filtrar por status ativo
      if (active !== undefined) {
        const isActive = active === 'true';
        workshops = workshops.filter(w => w.active === isActive);
      }

      // Paginação
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      const paginatedWorkshops = workshops.slice(offset, offset + limitNum);

      return res.status(200).json({
        workshops: paginatedWorkshops,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: workshops.length,
          totalPages: Math.ceil(workshops.length / limitNum)
        }
      });
    } catch (error) {
      console.error("Erro ao buscar oficinas (admin):", error);
      return res.status(500).json({ message: "Erro ao buscar oficinas" });
    }
  });

  // Criar nova oficina - Admin only
  app.post("/api/admin/workshops", requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = insertWorkshopSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: result.error.format()
        });
      }

      const workshop = await storage.createWorkshop(result.data);

      return res.status(201).json({
        message: "Oficina criada com sucesso",
        workshop
      });
    } catch (error) {
      console.error("Erro ao criar oficina:", error);
      return res.status(500).json({ message: "Erro ao criar oficina" });
    }
  });

  // Atualizar oficina - Admin only
  app.put("/api/admin/workshops/:id(\\d+)", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const workshopId = parseInt(id);

      if (isNaN(workshopId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const existingWorkshop = await storage.getWorkshopById(workshopId);
      if (!existingWorkshop) {
        return res.status(404).json({ message: "Oficina não encontrada" });
      }

      const result = insertWorkshopSchema.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: result.error.format()
        });
      }

      const updatedWorkshop = await storage.updateWorkshop(workshopId, result.data);

      return res.status(200).json({
        message: "Oficina atualizada com sucesso",
        workshop: updatedWorkshop
      });
    } catch (error) {
      console.error("Erro ao atualizar oficina:", error);
      return res.status(500).json({ message: "Erro ao atualizar oficina" });
    }
  });

  // Excluir oficina - Admin only (soft delete)
  app.delete("/api/admin/workshops/:id(\\d+)", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const workshopId = parseInt(id);

      if (isNaN(workshopId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const existingWorkshop = await storage.getWorkshopById(workshopId);
      if (!existingWorkshop) {
        return res.status(404).json({ message: "Oficina não encontrada" });
      }

      // Soft delete - marca como inativa
      await storage.updateWorkshop(workshopId, { active: false });

      return res.status(200).json({
        message: "Oficina desativada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao excluir oficina:", error);
      return res.status(500).json({ message: "Erro ao excluir oficina" });
    }
  });

  // Reativar oficina - Admin only
  app.post("/api/admin/workshops/:id(\\d+)/activate", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const workshopId = parseInt(id);

      if (isNaN(workshopId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const existingWorkshop = await storage.getWorkshopById(workshopId);
      if (!existingWorkshop) {
        return res.status(404).json({ message: "Oficina não encontrada" });
      }

      await storage.updateWorkshop(workshopId, { active: true });

      return res.status(200).json({
        message: "Oficina reativada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao reativar oficina:", error);
      return res.status(500).json({ message: "Erro ao reativar oficina" });
    }
  });

  // Excluir permanentemente - Admin only (cuidado!)
  app.delete("/api/admin/workshops/:id(\\d+)/permanent", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const workshopId = parseInt(id);

      if (isNaN(workshopId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const existingWorkshop = await storage.getWorkshopById(workshopId);
      if (!existingWorkshop) {
        return res.status(404).json({ message: "Oficina não encontrada" });
      }

      await storage.deleteWorkshop(workshopId);

      return res.status(200).json({
        message: "Oficina excluída permanentemente"
      });
    } catch (error) {
      console.error("Erro ao excluir oficina permanentemente:", error);
      return res.status(500).json({ message: "Erro ao excluir oficina" });
    }
  });

  // ============================================================================
  // ENDPOINTS ADMIN - APROVAÇÃO DE OFICINAS
  // ============================================================================

  // Buscar oficinas pendentes de aprovação
  app.get("/api/admin/workshops/pending", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allWorkshops = await storage.getWorkshops();
      const pendingWorkshops = [];

      // Buscar oficinas inativas (pendentes)
      for (const workshop of allWorkshops) {
        if (!workshop.active) {
          // Buscar admin associado
          const permissions = await db
            .select()
            .from(workshopAdminPermissions)
            .where(eq(workshopAdminPermissions.workshopId, workshop.id));

          let adminInfo = null;
          if (permissions.length > 0) {
            const admin = await storage.getWorkshopAdminById(permissions[0].adminId);
            if (admin) {
              adminInfo = {
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                createdAt: admin.createdAt
              };
            }
          }

          pendingWorkshops.push({
            ...workshop,
            admin: adminInfo,
            daysSinceCreation: Math.floor((Date.now() - new Date(workshop.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      }

      // Ordenar por data de criação (mais recentes primeiro)
      pendingWorkshops.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json({
        total: pendingWorkshops.length,
        workshops: pendingWorkshops
      });
    } catch (error) {
      console.error("Erro ao buscar oficinas pendentes:", error);
      return res.status(500).json({ message: "Erro ao buscar oficinas pendentes" });
    }
  });

  // Aprovar oficina
  app.post("/api/admin/workshops/:id(\\d+)/approve", requireAdmin, async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.id);

      if (isNaN(workshopId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const workshop = await storage.getWorkshopById(workshopId);
      if (!workshop) {
        return res.status(404).json({ message: "Oficina não encontrada" });
      }

      if (workshop.active) {
        return res.status(400).json({ message: "Oficina já está ativa" });
      }

      // Ativar a oficina
      const updatedWorkshop = await storage.updateWorkshop(workshopId, {
        active: true
      });

      // Log da aprovação
      console.log(`✅ Oficina ${workshopId} aprovada por admin ${req.user?.email}`);

      return res.status(200).json({
        message: "Oficina aprovada com sucesso",
        workshop: updatedWorkshop
      });
    } catch (error) {
      console.error("Erro ao aprovar oficina:", error);
      return res.status(500).json({ message: "Erro ao aprovar oficina" });
    }
  });

  // Rejeitar oficina
  app.post("/api/admin/workshops/:id(\\d+)/reject", requireAdmin, async (req: Request, res: Response) => {
    try {
      const workshopId = parseInt(req.params.id);
      const { reason } = req.body;

      if (isNaN(workshopId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const workshop = await storage.getWorkshopById(workshopId);
      if (!workshop) {
        return res.status(404).json({ message: "Oficina não encontrada" });
      }

      if (workshop.active) {
        return res.status(400).json({ message: "Não é possível rejeitar uma oficina já ativa" });
      }

      // Marcar como rejeitada (opcional: adicionar campo de status no banco)
      // Por enquanto, vamos apenas deletar
      await storage.deleteWorkshop(workshopId);

      // Log da rejeição
      console.log(`❌ Oficina ${workshopId} rejeitada por admin ${req.user?.email}. Razão: ${reason || 'Não especificada'}`);

      return res.status(200).json({
        message: "Oficina rejeitada",
        reason
      });
    } catch (error) {
      console.error("Erro ao rejeitar oficina:", error);
      return res.status(500).json({ message: "Erro ao rejeitar oficina" });
    }
  });

  // ============================================================================
  // NOVOS ENDPOINTS RBAC - ORGANIZAÇÃO ESPECÍFICA
  // ============================================================================

  // Informações detalhadas da oficina - Requer acesso à organização
  app.get("/api/oficina/:organizationId(\\d+)/info", requireOficinaOwner, async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.organizationId);

      const workshop = await storage.getWorkshopById(organizationId);
      if (!workshop) {
        return res.status(404).json({ message: "Oficina não encontrada" });
      }

      // Buscar informações adicionais da oficina
      const appointments = await storage.getAppointmentsByWorkshopId(organizationId);
      const services = await storage.getWorkshopServices(organizationId);

      console.log(`📊 Info oficina ${organizationId} acessada por usuário ${req.user?.userId}`);

      return res.status(200).json({
        workshop,
        stats: {
          totalAppointments: appointments.length,
          pendingAppointments: appointments.filter(a => a.status === 'pending').length,
          totalServices: services.length,
          activeServices: services.filter(s => s.isActive).length
        },
        appointments: appointments.slice(0, 10), // Últimos 10 agendamentos
        services
      });
    } catch (error) {
      console.error("Erro ao buscar informações da oficina:", error);
      return res.status(500).json({ message: "Erro ao buscar informações da oficina" });
    }
  });

  // Atualizar configurações da oficina - Requer acesso à organização
  app.put("/api/oficina/:organizationId(\\d+)/settings", requireOficinaOwner, async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.organizationId);

      const updateSchema = z.object({
        name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").optional(),
        address: z.string().min(10, "Endereço deve ser completo").optional(),
        phone: z.string().min(10, "Telefone deve ser válido").optional(),
        website: z.string().url("Website deve ser uma URL válida").optional(),
        operatingHours: z.record(z.string()).optional(),
        diagnosisPrice: z.number().min(0, "Preço deve ser positivo").optional(),
        certifications: z.array(z.string()).optional(),
        adminNotes: z.string().optional()
      });

      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: result.error.format()
        });
      }

      const existingWorkshop = await storage.getWorkshopById(organizationId);
      if (!existingWorkshop) {
        return res.status(404).json({ message: "Oficina não encontrada" });
      }

      const updatedWorkshop = await storage.updateWorkshop(organizationId, result.data);

      console.log(`⚙️ Configurações da oficina ${organizationId} atualizadas por usuário ${req.user?.userId}`);

      return res.status(200).json({
        message: "Configurações atualizadas com sucesso",
        workshop: updatedWorkshop
      });
    } catch (error) {
      console.error("Erro ao atualizar configurações da oficina:", error);
      return res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });

  // Listar agendamentos da oficina - Requer acesso à organização
  app.get("/api/oficina/:organizationId(\\d+)/appointments", requireOficinaOwner, async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      const { status, page = 1, limit = 20 } = req.query;

      let appointments = await storage.getAppointmentsByWorkshopId(organizationId);

      // Filtrar por status se fornecido
      if (status && typeof status === 'string') {
        appointments = appointments.filter(a => a.status === status);
      }

      // Paginação
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      const paginatedAppointments = appointments.slice(offset, offset + limitNum);

      console.log(`📅 Agendamentos da oficina ${organizationId} acessados por usuário ${req.user?.userId}`);

      return res.status(200).json({
        appointments: paginatedAppointments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: appointments.length,
          totalPages: Math.ceil(appointments.length / limitNum)
        },
        stats: {
          pending: appointments.filter(a => a.status === 'pending').length,
          confirmed: appointments.filter(a => a.status === 'confirmed').length,
          completed: appointments.filter(a => a.status === 'completed').length,
          cancelled: appointments.filter(a => a.status === 'cancelled').length
        }
      });
    } catch (error) {
      console.error("Erro ao buscar agendamentos da oficina:", error);
      return res.status(500).json({ message: "Erro ao buscar agendamentos" });
    }
  });

  // Atualizar status de agendamento - Requer acesso à organização
  app.put("/api/oficina/:organizationId(\\d+)/appointments/:appointmentId(\\d+)", requireOficinaOwner, async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      const appointmentId = parseInt(req.params.appointmentId);

      const updateSchema = z.object({
        status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
        estimatedPrice: z.number().min(0).optional(),
        workshopNotes: z.string().optional(),
        appointmentDate: z.string().datetime().optional()
      });

      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: result.error.format()
        });
      }

      // Verificar se o agendamento pertence à oficina
      const appointment = await storage.getAppointmentById(appointmentId);
      if (!appointment || appointment.workshopId !== organizationId) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }

      const updatedAppointment = await storage.updateAppointment(appointmentId, result.data);

      console.log(`📋 Agendamento ${appointmentId} atualizado por usuário ${req.user?.userId} (oficina ${organizationId})`);

      return res.status(200).json({
        message: "Agendamento atualizado com sucesso",
        appointment: updatedAppointment
      });
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      return res.status(500).json({ message: "Erro ao atualizar agendamento" });
    }
  });

  // Gerenciar serviços da oficina - Requer acesso à organização
  app.get("/api/oficina/:organizationId(\\d+)/services", requireOficinaOwner, async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.organizationId);

      const services = await storage.getWorkshopServices(organizationId);

      console.log(`🔧 Serviços da oficina ${organizationId} acessados por usuário ${req.user?.userId}`);

      return res.status(200).json({
        services,
        stats: {
          total: services.length,
          active: services.filter(s => s.isActive).length,
          inactive: services.filter(s => !s.isActive).length
        }
      });
    } catch (error) {
      console.error("Erro ao buscar serviços da oficina:", error);
      return res.status(500).json({ message: "Erro ao buscar serviços" });
    }
  });

  // Criar novo serviço da oficina - Requer acesso à organização
  app.post("/api/oficina/:organizationId(\\d+)/services", requireOficinaOwner, async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.organizationId);

      const serviceSchema = insertWorkshopServiceSchema.extend({
        workshopId: z.number().default(organizationId)
      });

      const result = serviceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: result.error.format()
        });
      }

      // Garantir que o workshopId seja o da organização
      result.data.workshopId = organizationId;

      const newService = await storage.createWorkshopService(result.data);

      console.log(`➕ Novo serviço criado na oficina ${organizationId} por usuário ${req.user?.userId}`);

      return res.status(201).json({
        message: "Serviço criado com sucesso",
        service: newService
      });
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      return res.status(500).json({ message: "Erro ao criar serviço" });
    }
  });

  // Atualizar serviço da oficina - Requer acesso à organização
  app.put("/api/oficina/:organizationId(\\d+)/services/:serviceId(\\d+)", requireOficinaOwner, async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      const serviceId = parseInt(req.params.serviceId);

      const updateSchema = insertWorkshopServiceSchema.partial().omit({ workshopId: true });

      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: result.error.format()
        });
      }

      // Verificar se o serviço pertence à oficina
      const service = await storage.getWorkshopServiceById(serviceId);
      if (!service || service.workshopId !== organizationId) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }

      const updatedService = await storage.updateWorkshopService(serviceId, result.data);

      console.log(`🔄 Serviço ${serviceId} atualizado na oficina ${organizationId} por usuário ${req.user?.userId}`);

      return res.status(200).json({
        message: "Serviço atualizado com sucesso",
        service: updatedService
      });
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      return res.status(500).json({ message: "Erro ao atualizar serviço" });
    }
  });

  // Endpoint protegido para clientes - Meus agendamentos
  app.get("/api/cliente/my-appointments", requireCliente, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não identificado" });
      }

      // Buscar agendamentos do cliente (usando email como identificador)
      const userEmail = req.user?.email;
      const appointments = await storage.getAppointmentsByCustomerEmail(userEmail);

      console.log(`👤 Agendamentos do cliente ${userId} (${userEmail}) acessados`);

      return res.status(200).json({
        appointments,
        stats: {
          total: appointments.length,
          pending: appointments.filter(a => a.status === 'pending').length,
          confirmed: appointments.filter(a => a.status === 'confirmed').length,
          completed: appointments.filter(a => a.status === 'completed').length
        }
      });
    } catch (error) {
      console.error("Erro ao buscar agendamentos do cliente:", error);
      return res.status(500).json({ message: "Erro ao buscar agendamentos" });
    }
  });

  // Endpoint multi-role - Dashboard geral
  app.get("/api/dashboard/summary", [authenticateUser, requirePermission('VIEW_REPORTS_ORG')], async (req: Request, res: Response) => {
    try {
      const userRoles = req.user?.roles || [];
      const organizationIds = req.user?.organizationIds || [];

      let summary: any = {
        userInfo: {
          id: req.user?.userId,
          email: req.user?.email,
          name: req.user?.name,
          roles: userRoles.map(r => r.roleName),
          organizations: organizationIds
        }
      };

      // Dados específicos baseados na role
      if (req.user && hasRole(req.user, 'ADMIN')) {
        // Admin vê estatísticas globais
        const allWorkshops = await storage.getWorkshops();
        summary.globalStats = {
          totalWorkshops: allWorkshops.length,
          activeWorkshops: allWorkshops.filter(w => w.active).length,
          // Adicionar mais estatísticas conforme necessário
        };
      }

      if (req.user && hasRole(req.user, 'OFICINA_OWNER')) {
        // Dono de oficina vê estatísticas das suas oficinas
        const workshopStats = [];
        for (const orgId of organizationIds) {
          const appointments = await storage.getAppointmentsByWorkshopId(orgId);
          const services = await storage.getWorkshopServices(orgId);
          workshopStats.push({
            organizationId: orgId,
            appointmentsCount: appointments.length,
            servicesCount: services.length
          });
        }
        summary.workshopStats = workshopStats;
      }

      console.log(`📊 Dashboard summary acessado por usuário ${req.user?.userId}`);

      return res.status(200).json(summary);
    } catch (error) {
      console.error("Erro ao buscar sumário do dashboard:", error);
      return res.status(500).json({ message: "Erro ao buscar dados do dashboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
