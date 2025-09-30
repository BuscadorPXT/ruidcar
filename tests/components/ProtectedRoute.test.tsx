import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Router } from 'wouter';
import ProtectedRoute, {
  AdminRoute,
  OficinaRoute,
  ClienteRoute,
  AuthenticatedRoute,
  MultiRoleRoute
} from '../../client/src/components/ProtectedRoute';
import { useAuth } from '../../client/src/hooks/use-auth';

// Mock do hook useAuth
vi.mock('../../client/src/hooks/use-auth');
const mockUseAuth = useAuth as Mock;

// Mock do useLocation
const mockSetLocation = vi.fn();
vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useLocation: () => ['/test', mockSetLocation]
  };
});

describe('ProtectedRoute Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetLocation.mockClear();
  });

  const TestComponent = () => <div>Protected Content</div>;

  describe('ProtectedRoute Base Component', () => {
    it('should show loading when authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        user: null,
        roles: [],
        hasRole: vi.fn(),
        hasPermission: vi.fn(),
        hasOrganizationAccess: vi.fn()
      });

      render(
        <Router>
          <ProtectedRoute protection={{ requireAuth: true }}>
            <TestComponent />
          </ProtectedRoute>
        </Router>
      );

      expect(screen.getByText('Verificando permissões...')).toBeInTheDocument();
    });

    it('should redirect to login when not authenticated and auth required', async () => {
      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        roles: [],
        hasRole: vi.fn(),
        hasPermission: vi.fn(),
        hasOrganizationAccess: vi.fn()
      });

      render(
        <Router>
          <ProtectedRoute protection={{ requireAuth: true }}>
            <TestComponent />
          </ProtectedRoute>
        </Router>
      );

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/login?redirect=%2Ftest');
      });
    });

    it('should allow access when allowUnauthenticated is true', () => {
      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        roles: [],
        hasRole: vi.fn(),
        hasPermission: vi.fn(),
        hasOrganizationAccess: vi.fn()
      });

      render(
        <Router>
          <ProtectedRoute protection={{ allowUnauthenticated: true }}>
            <TestComponent />
          </ProtectedRoute>
        </Router>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should show access denied when user lacks required role', () => {
      const mockHasRole = vi.fn().mockReturnValue(false);

      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { id: 1, email: 'test@test.com', name: 'Test User' },
        roles: [{ roleId: 1, roleName: 'CLIENTE', organizationId: null, permissions: [] }],
        hasRole: mockHasRole,
        hasPermission: vi.fn(),
        hasOrganizationAccess: vi.fn()
      });

      render(
        <Router>
          <ProtectedRoute protection={{ requireAuth: true, requiredRole: 'ADMIN' }}>
            <TestComponent />
          </ProtectedRoute>
        </Router>
      );

      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      expect(screen.getByText("Acesso negado. Role 'ADMIN' necessária.")).toBeInTheDocument();
    });

    it('should allow access when user has required role', () => {
      const mockHasRole = vi.fn().mockReturnValue(true);

      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { id: 1, email: 'admin@test.com', name: 'Admin User' },
        roles: [{ roleId: 1, roleName: 'ADMIN', organizationId: null, permissions: ['admin.*'] }],
        hasRole: mockHasRole,
        hasPermission: vi.fn(),
        hasOrganizationAccess: vi.fn()
      });

      render(
        <Router>
          <ProtectedRoute protection={{ requireAuth: true, requiredRole: 'ADMIN' }}>
            <TestComponent />
          </ProtectedRoute>
        </Router>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow access when user has one of allowed roles', () => {
      const mockHasRole = vi.fn((role) => role === 'OFICINA_OWNER');

      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { id: 1, email: 'workshop@test.com', name: 'Workshop Owner' },
        roles: [{ roleId: 2, roleName: 'OFICINA_OWNER', organizationId: 1, permissions: ['workshop.*'] }],
        hasRole: mockHasRole,
        hasPermission: vi.fn(),
        hasOrganizationAccess: vi.fn()
      });

      render(
        <Router>
          <ProtectedRoute protection={{
            requireAuth: true,
            allowedRoles: ['ADMIN', 'OFICINA_OWNER']
          }}>
            <TestComponent />
          </ProtectedRoute>
        </Router>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should check organization access when organizationScoped is true', () => {
      const mockHasRole = vi.fn().mockReturnValue(true);
      const mockHasOrganizationAccess = vi.fn().mockReturnValue(false);

      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { id: 1, email: 'workshop@test.com', name: 'Workshop Owner' },
        roles: [{ roleId: 2, roleName: 'OFICINA_OWNER', organizationId: 1, permissions: ['workshop.*'] }],
        hasRole: mockHasRole,
        hasPermission: vi.fn(),
        hasOrganizationAccess: mockHasOrganizationAccess
      });

      // Mock location para simular URL com organizationId
      vi.mocked(require('wouter').useLocation).mockReturnValue(['/oficina/2/dashboard', mockSetLocation]);

      render(
        <Router>
          <ProtectedRoute protection={{
            requireAuth: true,
            requiredRole: 'OFICINA_OWNER',
            organizationScoped: true
          }}>
            <TestComponent />
          </ProtectedRoute>
        </Router>
      );

      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      expect(screen.getByText('Acesso negado para a organização 2.')).toBeInTheDocument();
    });

    it('should check permissions when requiredPermission is specified', () => {
      const mockHasRole = vi.fn().mockReturnValue(true);
      const mockHasPermission = vi.fn().mockReturnValue(false);

      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { id: 1, email: 'user@test.com', name: 'Test User' },
        roles: [{ roleId: 1, roleName: 'CLIENTE', organizationId: null, permissions: ['read'] }],
        hasRole: mockHasRole,
        hasPermission: mockHasPermission,
        hasOrganizationAccess: vi.fn()
      });

      render(
        <Router>
          <ProtectedRoute protection={{
            requireAuth: true,
            requiredPermission: 'admin.users.write'
          }}>
            <TestComponent />
          </ProtectedRoute>
        </Router>
      );

      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      expect(screen.getByText("Acesso negado. Permissão 'admin.users.write' necessária.")).toBeInTheDocument();
    });
  });

  describe('Convenience Components', () => {
    describe('AdminRoute', () => {
      it('should require ADMIN role', () => {
        const mockHasRole = vi.fn().mockReturnValue(false);

        mockUseAuth.mockReturnValue({
          isLoading: false,
          isAuthenticated: true,
          user: { id: 1, email: 'user@test.com', name: 'Test User' },
          roles: [{ roleId: 1, roleName: 'CLIENTE', organizationId: null, permissions: [] }],
          hasRole: mockHasRole,
          hasPermission: vi.fn(),
          hasOrganizationAccess: vi.fn()
        });

        render(
          <Router>
            <AdminRoute>
              <TestComponent />
            </AdminRoute>
          </Router>
        );

        expect(screen.getByText('Acesso restrito a administradores.')).toBeInTheDocument();
      });

      it('should allow access for ADMIN role', () => {
        const mockHasRole = vi.fn().mockReturnValue(true);

        mockUseAuth.mockReturnValue({
          isLoading: false,
          isAuthenticated: true,
          user: { id: 1, email: 'admin@test.com', name: 'Admin User' },
          roles: [{ roleId: 1, roleName: 'ADMIN', organizationId: null, permissions: ['admin.*'] }],
          hasRole: mockHasRole,
          hasPermission: vi.fn(),
          hasOrganizationAccess: vi.fn()
        });

        render(
          <Router>
            <AdminRoute>
              <TestComponent />
            </AdminRoute>
          </Router>
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    describe('OficinaRoute', () => {
      it('should require OFICINA_OWNER role', () => {
        const mockHasRole = vi.fn().mockReturnValue(false);

        mockUseAuth.mockReturnValue({
          isLoading: false,
          isAuthenticated: true,
          user: { id: 1, email: 'user@test.com', name: 'Test User' },
          roles: [{ roleId: 1, roleName: 'CLIENTE', organizationId: null, permissions: [] }],
          hasRole: mockHasRole,
          hasPermission: vi.fn(),
          hasOrganizationAccess: vi.fn()
        });

        render(
          <Router>
            <OficinaRoute>
              <TestComponent />
            </OficinaRoute>
          </Router>
        );

        expect(screen.getByText('Acesso restrito a donos de oficina.')).toBeInTheDocument();
      });
    });

    describe('ClienteRoute', () => {
      it('should require CLIENTE role', () => {
        const mockHasRole = vi.fn().mockReturnValue(false);

        mockUseAuth.mockReturnValue({
          isLoading: false,
          isAuthenticated: true,
          user: { id: 1, email: 'user@test.com', name: 'Test User' },
          roles: [{ roleId: 1, roleName: 'ADMIN', organizationId: null, permissions: [] }],
          hasRole: mockHasRole,
          hasPermission: vi.fn(),
          hasOrganizationAccess: vi.fn()
        });

        render(
          <Router>
            <ClienteRoute>
              <TestComponent />
            </ClienteRoute>
          </Router>
        );

        expect(screen.getByText('Acesso restrito a clientes.')).toBeInTheDocument();
      });
    });

    describe('AuthenticatedRoute', () => {
      it('should only require authentication', () => {
        mockUseAuth.mockReturnValue({
          isLoading: false,
          isAuthenticated: true,
          user: { id: 1, email: 'user@test.com', name: 'Test User' },
          roles: [],
          hasRole: vi.fn(),
          hasPermission: vi.fn(),
          hasOrganizationAccess: vi.fn()
        });

        render(
          <Router>
            <AuthenticatedRoute>
              <TestComponent />
            </AuthenticatedRoute>
          </Router>
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    describe('MultiRoleRoute', () => {
      it('should allow access when user has one of allowed roles', () => {
        const mockHasRole = vi.fn((role) => role === 'OFICINA_OWNER');

        mockUseAuth.mockReturnValue({
          isLoading: false,
          isAuthenticated: true,
          user: { id: 1, email: 'workshop@test.com', name: 'Workshop Owner' },
          roles: [{ roleId: 2, roleName: 'OFICINA_OWNER', organizationId: 1, permissions: [] }],
          hasRole: mockHasRole,
          hasPermission: vi.fn(),
          hasOrganizationAccess: vi.fn()
        });

        render(
          <Router>
            <MultiRoleRoute allowedRoles={['ADMIN', 'OFICINA_OWNER']}>
              <TestComponent />
            </MultiRoleRoute>
          </Router>
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      it('should deny access when user lacks all allowed roles', () => {
        const mockHasRole = vi.fn().mockReturnValue(false);

        mockUseAuth.mockReturnValue({
          isLoading: false,
          isAuthenticated: true,
          user: { id: 1, email: 'client@test.com', name: 'Client User' },
          roles: [{ roleId: 3, roleName: 'CLIENTE', organizationId: null, permissions: [] }],
          hasRole: mockHasRole,
          hasPermission: vi.fn(),
          hasOrganizationAccess: vi.fn()
        });

        render(
          <Router>
            <MultiRoleRoute allowedRoles={['ADMIN', 'OFICINA_OWNER']}>
              <TestComponent />
            </MultiRoleRoute>
          </Router>
        );

        expect(screen.getByText('Acesso restrito a: ADMIN, OFICINA_OWNER.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should provide retry functionality when access is denied', () => {
      const mockHasRole = vi.fn().mockReturnValue(false);

      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { id: 1, email: 'user@test.com', name: 'Test User' },
        roles: [{ roleId: 1, roleName: 'CLIENTE', organizationId: null, permissions: [] }],
        hasRole: mockHasRole,
        hasPermission: vi.fn(),
        hasOrganizationAccess: vi.fn()
      });

      render(
        <Router>
          <ProtectedRoute protection={{ requireAuth: true, requiredRole: 'ADMIN' }}>
            <TestComponent />
          </ProtectedRoute>
        </Router>
      );

      expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
    });

    it('should provide fallback navigation options', () => {
      const mockHasRole = vi.fn().mockReturnValue(false);

      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { id: 1, email: 'user@test.com', name: 'Test User' },
        roles: [{ roleId: 1, roleName: 'CLIENTE', organizationId: null, permissions: [] }],
        hasRole: mockHasRole,
        hasPermission: vi.fn(),
        hasOrganizationAccess: vi.fn()
      });

      render(
        <Router>
          <ProtectedRoute protection={{
            requireAuth: true,
            requiredRole: 'ADMIN',
            fallbackPath: '/dashboard'
          }}>
            <TestComponent />
          </ProtectedRoute>
        </Router>
      );

      expect(screen.getByText('Voltar')).toBeInTheDocument();
      expect(screen.getByText('Fazer Login')).toBeInTheDocument();
    });
  });

  describe('Development Mode Features', () => {
    it('should show debug info in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockHasRole = vi.fn().mockReturnValue(false);

      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { id: 1, email: 'user@test.com', name: 'Test User' },
        roles: [{ roleId: 1, roleName: 'CLIENTE', organizationId: null, permissions: [] }],
        hasRole: mockHasRole,
        hasPermission: vi.fn(),
        hasOrganizationAccess: vi.fn()
      });

      render(
        <Router>
          <ProtectedRoute protection={{
            requireAuth: true,
            requiredRole: 'ADMIN',
            requiredPermission: 'admin.users.read'
          }}>
            <TestComponent />
          </ProtectedRoute>
        </Router>
      );

      expect(screen.getByText('Debug Info:')).toBeInTheDocument();
      expect(screen.getByText('Suas roles: CLIENTE')).toBeInTheDocument();
      expect(screen.getByText('Role necessária: ADMIN')).toBeInTheDocument();
      expect(screen.getByText('Permissão necessária: admin.users.read')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });
});