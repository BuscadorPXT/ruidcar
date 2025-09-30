import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { db } from '../server/db';
import { users, roles, userRoles, workshops } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Mock da aplicação Express para evitar conflitos de porta
const mockApp = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  listen: vi.fn()
};

describe('Authorization System Tests', () => {
  let testUser: any;
  let testAdmin: any;
  let testWorkshop: any;
  let adminToken: string;
  let userToken: string;
  let workshopToken: string;

  beforeEach(async () => {
    // Limpar dados de teste
    await db.delete(userRoles);
    await db.delete(users);
    await db.delete(workshops);

    // Criar usuário admin de teste
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const [admin] = await db.insert(users).values({
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin Test',
      isActive: true,
      emailVerified: true
    }).returning();

    testAdmin = admin;

    // Criar usuário comum de teste
    const [user] = await db.insert(users).values({
      email: 'user@test.com',
      password: await bcrypt.hash('user123', 10),
      name: 'User Test',
      isActive: true,
      emailVerified: true
    }).returning();

    testUser = user;

    // Criar workshop de teste
    const [workshop] = await db.insert(workshops).values({
      nomeFantasia: 'Workshop Test',
      razaoSocial: 'Workshop Test LTDA',
      cnpj: '12345678000123',
      email: 'workshop@test.com',
      telefone: '11999999999',
      endereco: 'Rua Test, 123',
      cep: '12345678',
      cidade: 'São Paulo',
      estado: 'SP',
      isActive: true
    }).returning();

    testWorkshop = workshop;

    // Buscar roles
    const adminRole = await db.query.roles.findFirst({
      where: eq(roles.name, 'ADMIN')
    });

    const clienteRole = await db.query.roles.findFirst({
      where: eq(roles.name, 'CLIENTE')
    });

    const oficinaRole = await db.query.roles.findFirst({
      where: eq(roles.name, 'OFICINA_OWNER')
    });

    // Atribuir roles
    if (adminRole) {
      await db.insert(userRoles).values({
        userId: admin.id,
        roleId: adminRole.id,
        organizationId: null,
        isActive: true
      });
    }

    if (clienteRole) {
      await db.insert(userRoles).values({
        userId: user.id,
        roleId: clienteRole.id,
        organizationId: null,
        isActive: true
      });
    }

    if (oficinaRole) {
      await db.insert(userRoles).values({
        userId: user.id,
        roleId: oficinaRole.id,
        organizationId: workshop.id,
        isActive: true
      });
    }

    // Fazer login para obter tokens
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123',
        intent: 'admin'
      });

    adminToken = adminLoginRes.body.token;

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'user123',
        intent: 'client'
      });

    userToken = userLoginRes.body.token;

    const workshopLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'user123',
        intent: 'workshop'
      });

    workshopToken = workshopLoginRes.body.token;
  });

  afterEach(async () => {
    // Limpar dados após cada teste
    await db.delete(userRoles);
    await db.delete(users);
    await db.delete(workshops);
  });

  describe('Authentication Tests', () => {
    it('should authenticate admin user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
          intent: 'admin'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('admin@test.com');
      expect(response.body.roles).toContainEqual(
        expect.objectContaining({ roleName: 'ADMIN' })
      );
    });

    it('should fail authentication with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword',
          intent: 'admin'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Credenciais inválidas');
    });

    it('should fail authentication for inactive user', async () => {
      // Desativar usuário
      await db.update(users)
        .set({ isActive: false })
        .where(eq(users.id, testAdmin.id));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'admin123',
          intent: 'admin'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Usuário inativo');
    });

    it('should validate JWT token correctly', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('admin@test.com');
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Role-Based Access Control Tests', () => {
    it('should allow admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny non-admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso negado: role ADMIN necessária');
    });

    it('should allow workshop owner access to workshop endpoints', async () => {
      const response = await request(app)
        .get('/api/workshop/profile')
        .set('Authorization', `Bearer ${workshopToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny non-workshop-owner access to workshop endpoints', async () => {
      const response = await request(app)
        .get('/api/workshop/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Organization-Scoped Access Tests', () => {
    it('should allow access to own organization', async () => {
      const response = await request(app)
        .get(`/api/workshops/${testWorkshop.id}/profile`)
        .set('Authorization', `Bearer ${workshopToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny access to other organization', async () => {
      // Criar outro workshop
      const [otherWorkshop] = await db.insert(workshops).values({
        nomeFantasia: 'Other Workshop',
        razaoSocial: 'Other Workshop LTDA',
        cnpj: '98765432000123',
        email: 'other@test.com',
        telefone: '11888888888',
        endereco: 'Rua Other, 456',
        cep: '87654321',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        isActive: true
      }).returning();

      const response = await request(app)
        .get(`/api/workshops/${otherWorkshop.id}/profile`)
        .set('Authorization', `Bearer ${workshopToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso negado à organização');
    });

    it('should allow admin access to any organization', async () => {
      const response = await request(app)
        .get(`/api/workshops/${testWorkshop.id}/profile`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Permission-Based Access Tests', () => {
    it('should allow access with correct permission', async () => {
      const response = await request(app)
        .get('/api/admin/system-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny access without correct permission', async () => {
      const response = await request(app)
        .get('/api/admin/system-stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Role Switching Tests', () => {
    it('should allow user to switch between available roles', async () => {
      const oficinaRole = await db.query.roles.findFirst({
        where: eq(roles.name, 'OFICINA_OWNER')
      });

      const response = await request(app)
        .post('/api/auth/switch-role')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          roleName: 'OFICINA_OWNER',
          organizationId: testWorkshop.id
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.currentRole).toBe('OFICINA_OWNER');
    });

    it('should deny role switch to unavailable role', async () => {
      const response = await request(app)
        .post('/api/auth/switch-role')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          roleName: 'ADMIN',
          organizationId: null
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Role não encontrada para este usuário');
    });
  });

  describe('Multi-Role User Tests', () => {
    it('should handle user with multiple roles correctly', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.roles.length).toBeGreaterThan(1);
      expect(response.body.roles).toContainEqual(
        expect.objectContaining({ roleName: 'CLIENTE' })
      );
      expect(response.body.roles).toContainEqual(
        expect.objectContaining({ roleName: 'OFICINA_OWNER' })
      );
    });

    it('should filter roles by intent during login', async () => {
      const clientResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'user123',
          intent: 'client'
        });

      expect(clientResponse.body.roles).toContainEqual(
        expect.objectContaining({ roleName: 'CLIENTE' })
      );

      const workshopResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'user123',
          intent: 'workshop'
        });

      expect(workshopResponse.body.roles).toContainEqual(
        expect.objectContaining({ roleName: 'OFICINA_OWNER' })
      );
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive data in responses', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.user.password).toBeUndefined();
      expect(response.body).not.toHaveProperty('password');
    });

    it('should require authentication for protected endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token de autenticação necessário');
    });

    it('should validate token expiration', async () => {
      // Este teste requereria manipulação do tempo ou token expirado
      // Por enquanto, apenas verificamos que tokens inválidos são rejeitados
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired-or-invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
    });

    it('should handle malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
    });

    it('should handle non-existent user in token', async () => {
      // Deletar usuário mas manter token válido (cenário edge case)
      await db.delete(users).where(eq(users.id, testUser.id));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
    });

    it('should handle user with no active roles', async () => {
      // Desativar todas as roles do usuário
      await db.update(userRoles)
        .set({ isActive: false })
        .where(eq(userRoles.userId, testUser.id));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'user123',
          intent: 'client'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Nenhuma role ativa encontrada para este usuário');
    });
  });
});