import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

// Tipos para autenticação
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
}

export interface AuthRole {
  roleId: number;
  roleName: string;
  organizationId: number | null;
  permissions: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  roles: AuthRole[];
  currentRole?: AuthRole;
  token: string | null;
  isLoading: boolean;
}

// Hook para gerenciar autenticação
export function useAuth() {
  const [, setLocation] = useLocation();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    roles: [],
    currentRole: undefined,
    token: null,
    isLoading: true,
  });

  // Inicializar estado de autenticação (usando cookies seguros)
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verificar se há dados em cache primeiro (para resposta mais rápida)
        const cachedUser = sessionStorage.getItem('user-info');
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          // Estado temporário enquanto valida com servidor
          setAuthState(prev => ({
            ...prev,
            user: { ...userData, id: 0 },
            isLoading: true
          }));
        }

        // Validar sessão com servidor
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // Não autenticado - limpar cache e estado
          sessionStorage.removeItem('user-info');
          setAuthState({
            isAuthenticated: false,
            user: null,
            roles: [],
            currentRole: undefined,
            token: null,
            isLoading: false
          });
          return;
        }

        const authData = await response.json();

        // Validar estrutura de dados
        if (!authData.user || !authData.user.id) {
          throw new Error('Dados de usuário inválidos');
        }

        // Garantir que roles sempre é um array
        const roles = Array.isArray(authData.roles) ? authData.roles : [];

        // Encontrar role atual com validação
        const currentRole = roles.find((r: AuthRole) => r.roleName === authData.currentRole) || roles[0];

        setAuthState({
          isAuthenticated: true,
          user: authData.user,
          roles: roles,
          currentRole: currentRole,
          token: 'cookie-based',
          isLoading: false,
        });

        // Atualizar cache
        sessionStorage.setItem('user-info', JSON.stringify({
          name: authData.user.name,
          email: authData.user.email,
          currentRole: currentRole?.roleName
        }));

      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        sessionStorage.removeItem('user-info');
        setAuthState({
          isAuthenticated: false,
          user: null,
          roles: [],
          currentRole: undefined,
          token: null,
          isLoading: false
        });
      }
    };

    initAuth();
  }, []);

  // Forçar revalidação da sessão (após login/switch-role)
  const revalidate = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return false;
      }

      const authData = await response.json();
      const roles = Array.isArray(authData.roles) ? authData.roles : [];
      const currentRole = roles.find((r: AuthRole) => r.roleName === authData.currentRole) || roles[0];

      setAuthState({
        isAuthenticated: true,
        user: authData.user,
        roles,
        currentRole,
        token: 'cookie-based',
        isLoading: false,
      });

      sessionStorage.setItem('user-info', JSON.stringify({
        name: authData.user.name,
        email: authData.user.email,
        currentRole: currentRole?.roleName,
      }));

      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // Função para fazer login (agora baseado em cookies)
  const login = useCallback((user: AuthUser, roles: AuthRole[]) => {
    setAuthState({
      isAuthenticated: true,
      user,
      roles,
      currentRole: roles[0],
      token: 'cookie-based', // Token está no cookie HTTP-only
      isLoading: false,
    });
  }, []);

  // Função para fazer logout (chamada API para limpar cookie)
  const logout = useCallback(async () => {
    try {
      // Chamar endpoint de logout para limpar cookie seguro
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    }

    // Limpar todo o estado e cache
    sessionStorage.removeItem('user-info');
    localStorage.removeItem('workshop-admin');
    localStorage.removeItem('workshop-workshops');

    setAuthState({
      isAuthenticated: false,
      user: null,
      roles: [],
      currentRole: undefined,
      token: null,
      isLoading: false,
    });

    setLocation('/');
  }, [setLocation]);

  // Função para trocar role
  const switchRole = useCallback(async (role: AuthRole) => {
    try {
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          roleName: role.roleName,
          organizationId: role.organizationId
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();

      setAuthState(prev => ({
        ...prev,
        currentRole: role,
        token: 'cookie-based'
      }));

      // Redirecionar para área apropriada
      setLocation(result.defaultRedirect);

      return true;
    } catch (error) {
      console.error('Erro ao trocar role:', error);
      return false;
    }
  }, [setLocation]);

  // Função para verificar se usuário tem role específica (com validação)
  const hasRole = useCallback((roleName: string) => {
    if (!Array.isArray(authState.roles)) return false;
    return authState.roles.some(role => role.roleName === roleName);
  }, [authState.roles]);

  // Função para verificar se usuário tem permissão específica (com validação)
  const hasPermission = useCallback((permission: string) => {
    if (!Array.isArray(authState.roles)) return false;
    return authState.roles.some(role =>
      Array.isArray(role.permissions) && role.permissions.includes(permission)
    );
  }, [authState.roles]);

  // Função para verificar se usuário tem acesso à organização
  const hasOrganizationAccess = useCallback((organizationId: number) => {
    // Admin global tem acesso a tudo
    if (hasRole('ADMIN')) {
      return true;
    }

    return authState.roles.some(role => role.organizationId === organizationId);
  }, [authState.roles, hasRole]);

  // Função para obter todas as permissões do usuário
  const getAllPermissions = useCallback(() => {
    const allPermissions = authState.roles.flatMap(role => role.permissions);
    return Array.from(new Set(allPermissions)); // remove duplicatas
  }, [authState.roles]);

  // Função para obter organizações do usuário
  const getOrganizations = useCallback(() => {
    const orgIds = authState.roles
      .map(role => role.organizationId)
      .filter((id): id is number => id !== null);
    return Array.from(new Set(orgIds)); // remove duplicatas
  }, [authState.roles]);

  return {
    // Estado
    ...authState,

    // Ações
    login,
    logout,
    switchRole,
    revalidate,

    // Verificações
    hasRole,
    hasPermission,
    hasOrganizationAccess,

    // Utilitários
    getAllPermissions,
    getOrganizations,
  };
}