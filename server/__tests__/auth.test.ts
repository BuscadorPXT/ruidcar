import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  generateJWT,
  verifyJWT,
  hasRole,
  hasPermission,
  getAllUserPermissions,
  hasOrganizationAccess,
  getPrimaryRole,
  getDefaultRedirect,
  matchesIntent,
  ROLES
} from '../middleware/auth';
import type { AuthenticatedUser, UserRoleData } from '../middleware/auth';

describe('Sistema RBAC - Testes Unitários', () => {

  // Mock de usuário para testes
  const mockAdminUser: AuthenticatedUser = {
    userId: 1,
    email: 'admin@ruidcar.com',
    name: 'Admin Teste',
    phone: null,
    roles: [{
      roleId: 1,
      roleName: 'ADMIN',
      organizationId: null,
      permissions: ROLES.ADMIN.permissions
    }],
    organizationIds: []
  };

  const mockOficinaOwnerUser: AuthenticatedUser = {
    userId: 2,
    email: 'oficina@ruidcar.com',
    name: 'Dono Oficina',
    phone: '11999999999',
    roles: [{
      roleId: 2,
      roleName: 'OFICINA_OWNER',
      organizationId: 123,
      permissions: ROLES.OFICINA_OWNER.permissions
    }],
    organizationIds: [123]
  };

  const mockMultiRoleUser: AuthenticatedUser = {
    userId: 3,
    email: 'multi@ruidcar.com',
    name: 'Usuário Multi-Role',
    phone: '11888888888',
    roles: [
      {
        roleId: 2,
        roleName: 'OFICINA_OWNER',
        organizationId: 123,
        permissions: ROLES.OFICINA_OWNER.permissions
      },
      {
        roleId: 3,
        roleName: 'CLIENTE',
        organizationId: null,
        permissions: ROLES.CLIENTE.permissions
      }
    ],
    organizationIds: [123]
  };

  describe('JWT Token Management', () => {

    test('deve gerar e verificar JWT token corretamente', () => {
      const payload = {
        userId: mockAdminUser.userId,
        email: mockAdminUser.email,
        name: mockAdminUser.name,
        phone: mockAdminUser.phone,
        roles: mockAdminUser.roles,
        organizationIds: mockAdminUser.organizationIds
      };

      const token = generateJWT(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = verifyJWT(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.roles).toEqual(payload.roles);
    });

    test('deve falhar ao verificar token inválido', () => {
      expect(() => verifyJWT('token-invalido')).toThrow();
    });

  });

  describe('Role Verification', () => {

    test('deve verificar role de admin corretamente', () => {
      expect(hasRole(mockAdminUser, 'ADMIN')).toBe(true);
      expect(hasRole(mockAdminUser, 'OFICINA_OWNER')).toBe(false);
      expect(hasRole(mockAdminUser, 'CLIENTE')).toBe(false);
    });

    test('deve verificar role de dono de oficina corretamente', () => {
      expect(hasRole(mockOficinaOwnerUser, 'OFICINA_OWNER')).toBe(true);
      expect(hasRole(mockOficinaOwnerUser, 'ADMIN')).toBe(false);
      expect(hasRole(mockOficinaOwnerUser, 'CLIENTE')).toBe(false);
    });

    test('deve verificar múltiplas roles corretamente', () => {
      expect(hasRole(mockMultiRoleUser, 'OFICINA_OWNER')).toBe(true);
      expect(hasRole(mockMultiRoleUser, 'CLIENTE')).toBe(true);
      expect(hasRole(mockMultiRoleUser, 'ADMIN')).toBe(false);
    });

  });

  describe('Permission Verification', () => {

    test('deve verificar permissões de admin', () => {
      expect(hasPermission(mockAdminUser, 'CRUD_GLOBAL')).toBe(true);
      expect(hasPermission(mockAdminUser, 'MANAGE_USERS')).toBe(true);
      expect(hasPermission(mockAdminUser, 'VIEW_ALL_TENANTS')).toBe(true);
    });

    test('deve verificar permissões de dono de oficina', () => {
      expect(hasPermission(mockOficinaOwnerUser, 'CRUD_ORGANIZATION')).toBe(true);
      expect(hasPermission(mockOficinaOwnerUser, 'MANAGE_APPOINTMENTS')).toBe(true);
      expect(hasPermission(mockOficinaOwnerUser, 'CRUD_GLOBAL')).toBe(false);
    });

    test('deve obter todas as permissões do usuário', () => {
      const adminPermissions = getAllUserPermissions(mockAdminUser);
      expect(adminPermissions).toContain('CRUD_GLOBAL');
      expect(adminPermissions).toContain('MANAGE_USERS');
      expect(adminPermissions.length).toBe(ROLES.ADMIN.permissions.length);

      const multiPermissions = getAllUserPermissions(mockMultiRoleUser);
      expect(multiPermissions).toContain('CRUD_ORGANIZATION');
      expect(multiPermissions).toContain('VIEW_MY_APPOINTMENTS');
      expect(multiPermissions.length).toBeGreaterThan(ROLES.OFICINA_OWNER.permissions.length);
    });

  });

  describe('Organization Access', () => {

    test('admin deve ter acesso a qualquer organização', () => {
      expect(hasOrganizationAccess(mockAdminUser, 123)).toBe(true);
      expect(hasOrganizationAccess(mockAdminUser, 999)).toBe(true);
    });

    test('dono de oficina deve ter acesso apenas à sua organização', () => {
      expect(hasOrganizationAccess(mockOficinaOwnerUser, 123)).toBe(true);
      expect(hasOrganizationAccess(mockOficinaOwnerUser, 999)).toBe(false);
    });

    test('usuário multi-role deve ter acesso baseado em suas organizações', () => {
      expect(hasOrganizationAccess(mockMultiRoleUser, 123)).toBe(true);
      expect(hasOrganizationAccess(mockMultiRoleUser, 999)).toBe(false);
    });

  });

  describe('Primary Role and Redirects', () => {

    test('deve obter role primária baseada na prioridade', () => {
      const adminPrimary = getPrimaryRole(mockAdminUser);
      expect(adminPrimary?.roleName).toBe('ADMIN');

      const oficinaPrimary = getPrimaryRole(mockOficinaOwnerUser);
      expect(oficinaPrimary?.roleName).toBe('OFICINA_OWNER');

      const multiPrimary = getPrimaryRole(mockMultiRoleUser);
      expect(multiPrimary?.roleName).toBe('OFICINA_OWNER'); // prioridade sobre CLIENTE
    });

    test('deve obter redirect padrão correto', () => {
      const adminRole = mockAdminUser.roles[0];
      expect(getDefaultRedirect(adminRole)).toBe('/admin');

      const oficinaRole = mockOficinaOwnerUser.roles[0];
      expect(getDefaultRedirect(oficinaRole)).toBe('/oficina/123');

      const clienteRole: UserRoleData = {
        roleId: 3,
        roleName: 'CLIENTE',
        organizationId: null,
        permissions: ROLES.CLIENTE.permissions
      };
      expect(getDefaultRedirect(clienteRole)).toBe('/cliente');
    });

  });

  describe('Intent Matching', () => {

    test('deve validar intent corretamente', () => {
      const adminRole = mockAdminUser.roles[0];
      expect(matchesIntent(adminRole, 'admin')).toBe(true);
      expect(matchesIntent(adminRole, 'oficina')).toBe(false);
      expect(matchesIntent(adminRole, 'cliente')).toBe(false);

      const oficinaRole = mockOficinaOwnerUser.roles[0];
      expect(matchesIntent(oficinaRole, 'oficina')).toBe(true);
      expect(matchesIntent(oficinaRole, 'admin')).toBe(false);
    });

    test('deve aceitar qualquer intent para intent vazio', () => {
      const adminRole = mockAdminUser.roles[0];
      expect(matchesIntent(adminRole, '')).toBe(true);
      expect(matchesIntent(adminRole, 'invalid')).toBe(true);
    });

  });

  describe('Role Definitions', () => {

    test('deve ter todas as roles definidas corretamente', () => {
      expect(ROLES.ADMIN).toBeDefined();
      expect(ROLES.OFICINA_OWNER).toBeDefined();
      expect(ROLES.CLIENTE).toBeDefined();

      expect(ROLES.ADMIN.permissions).toContain('CRUD_GLOBAL');
      expect(ROLES.OFICINA_OWNER.permissions).toContain('CRUD_ORGANIZATION');
      expect(ROLES.CLIENTE.permissions).toContain('VIEW_MY_APPOINTMENTS');
    });

    test('deve ter permissões exclusivas por role', () => {
      expect(ROLES.ADMIN.permissions).toContain('MANAGE_USERS');
      expect(ROLES.OFICINA_OWNER.permissions).not.toContain('MANAGE_USERS');
      expect(ROLES.CLIENTE.permissions).not.toContain('MANAGE_USERS');

      expect(ROLES.OFICINA_OWNER.permissions).toContain('MANAGE_APPOINTMENTS');
      expect(ROLES.CLIENTE.permissions).not.toContain('MANAGE_APPOINTMENTS');
    });

  });

  describe('Edge Cases', () => {

    test('deve lidar com usuário sem roles', () => {
      const userWithoutRoles: AuthenticatedUser = {
        userId: 999,
        email: 'no-roles@test.com',
        name: 'Sem Roles',
        phone: null,
        roles: [],
        organizationIds: []
      };

      expect(hasRole(userWithoutRoles, 'ADMIN')).toBe(false);
      expect(hasPermission(userWithoutRoles, 'CRUD_GLOBAL')).toBe(false);
      expect(getAllUserPermissions(userWithoutRoles)).toEqual([]);
      expect(getPrimaryRole(userWithoutRoles)).toBeNull();
    });

    test('deve lidar com organizationId null', () => {
      const roleWithNullOrg: UserRoleData = {
        roleId: 3,
        roleName: 'CLIENTE',
        organizationId: null,
        permissions: ROLES.CLIENTE.permissions
      };

      expect(getDefaultRedirect(roleWithNullOrg)).toBe('/cliente');
    });

  });

});