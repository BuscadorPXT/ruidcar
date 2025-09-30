import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth, type AuthRole } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Tipos para configuração de proteção
export interface ProtectionConfig {
  // Requer autenticação
  requireAuth?: boolean;

  // Requer role específica
  requiredRole?: 'ADMIN' | 'OFICINA_OWNER' | 'CLIENTE';

  // Requer permissão específica
  requiredPermission?: string;

  // Requer acesso a organização específica (via parâmetro da URL)
  organizationScoped?: boolean;

  // Permite múltiplas roles (OR logic)
  allowedRoles?: ('ADMIN' | 'OFICINA_OWNER' | 'CLIENTE')[];

  // Permite múltiplas permissões (OR logic)
  allowedPermissions?: string[];

  // Redirect customizado quando não autorizado
  fallbackPath?: string;

  // Mensagem customizada de erro
  errorMessage?: string;

  // Permite acesso sem autenticação (para páginas públicas com funcionalidades opcionais)
  allowUnauthenticated?: boolean;
}

interface ProtectedRouteProps {
  children: ReactNode;
  protection: ProtectionConfig;
  className?: string;
}

// Componente de Loading
function AuthLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 animate-pulse">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Verificando permissões...
        </h2>
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );
}

// Componente de Erro 403 - Acesso Negado
interface AccessDeniedProps {
  message: string;
  userRoles: string[];
  requiredRole?: string;
  requiredPermission?: string;
  fallbackPath: string;
  onRetry?: () => void;
}

function AccessDenied({
  message,
  userRoles,
  requiredRole,
  requiredPermission,
  fallbackPath,
  onRetry
}: AccessDeniedProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg border-red-200">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">
              Acesso Negado
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            {/* Informações de debug em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <h4 className="font-medium text-gray-900 mb-2">Debug Info:</h4>
                <div className="space-y-1 text-gray-600">
                  <p><strong>Suas roles:</strong> {userRoles.join(', ') || 'Nenhuma'}</p>
                  {requiredRole && <p><strong>Role necessária:</strong> {requiredRole}</p>}
                  {requiredPermission && <p><strong>Permissão necessária:</strong> {requiredPermission}</p>}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => setLocation(fallbackPath)}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              )}

              <Button
                onClick={() => setLocation('/login')}
                variant="secondary"
                className="w-full"
              >
                Fazer Login
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Precisa de ajuda?{' '}
                <button
                  className="text-primary hover:underline"
                  onClick={() => {
                    // Implementar sistema de suporte/contato
                    alert('Entre em contato: contato@ruidcar.com.br');
                  }}
                >
                  Entre em contato
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
  protection,
  className = ''
}: ProtectedRouteProps) {
  const [location, setLocation] = useLocation();
  const {
    isAuthenticated,
    user,
    roles,
    currentRole,
    isLoading,
    hasRole,
    hasPermission,
    hasOrganizationAccess
  } = useAuth();

  const [isAuthorizing, setIsAuthorizing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Extrair organizationId da URL se necessário
  const organizationId = protection.organizationScoped
    ? parseInt(location.split('/')[2] || '0')
    : null;

  useEffect(() => {
    const checkAuthorization = async () => {
      setIsAuthorizing(true);
      setAuthError(null);

      // Se ainda está carregando dados de auth, aguardar
      if (isLoading) {
        return;
      }

      // Se não requer autenticação, permitir acesso
      if (protection.allowUnauthenticated) {
        setIsAuthorizing(false);
        return;
      }

      // Verificar se requer autenticação
      if (protection.requireAuth !== false && !isAuthenticated) {
        console.log('🔒 Usuário não autenticado, redirecionando para login');
        console.log('🔒 Protection config:', protection);
        console.log('🔒 Auth state:', { isAuthenticated, user, roles });
        // Salvar URL atual para redirect pós-login
        const currentPath = encodeURIComponent(location);
        setLocation(`/login?redirect=${currentPath}`);
        return;
      }

      // Se não está autenticado mas não requer auth, permitir
      if (!isAuthenticated) {
        setIsAuthorizing(false);
        return;
      }

      // Verificar role específica
      if (protection.requiredRole) {
        console.log('🔐 Verificando role:', {
          requiredRole: protection.requiredRole,
          userRoles: roles.map(r => r.roleName),
          hasRole: hasRole(protection.requiredRole)
        });

        if (!hasRole(protection.requiredRole)) {
          setAuthError(
            protection.errorMessage ||
            `Acesso negado. Role '${protection.requiredRole}' necessária.`
          );
          setIsAuthorizing(false);
          return;
        }
      }

      // Verificar múltiplas roles permitidas (OR logic)
      if (protection.allowedRoles && protection.allowedRoles.length > 0) {
        const hasAnyAllowedRole = protection.allowedRoles.some(role => hasRole(role));
        if (!hasAnyAllowedRole) {
          setAuthError(
            protection.errorMessage ||
            `Acesso negado. Uma das seguintes roles é necessária: ${protection.allowedRoles.join(', ')}`
          );
          setIsAuthorizing(false);
          return;
        }
      }

      // Verificar permissão específica
      if (protection.requiredPermission && !hasPermission(protection.requiredPermission)) {
        setAuthError(
          protection.errorMessage ||
          `Acesso negado. Permissão '${protection.requiredPermission}' necessária.`
        );
        setIsAuthorizing(false);
        return;
      }

      // Verificar múltiplas permissões permitidas (OR logic)
      if (protection.allowedPermissions && protection.allowedPermissions.length > 0) {
        const hasAnyAllowedPermission = protection.allowedPermissions.some(permission =>
          hasPermission(permission)
        );
        if (!hasAnyAllowedPermission) {
          setAuthError(
            protection.errorMessage ||
            `Acesso negado. Uma das seguintes permissões é necessária: ${protection.allowedPermissions.join(', ')}`
          );
          setIsAuthorizing(false);
          return;
        }
      }

      // Verificar acesso à organização
      if (protection.organizationScoped && organizationId) {
        if (!hasOrganizationAccess(organizationId)) {
          setAuthError(
            protection.errorMessage ||
            `Acesso negado para a organização ${organizationId}.`
          );
          setIsAuthorizing(false);
          return;
        }
      }

      // Se chegou até aqui, acesso permitido
      setIsAuthorizing(false);
    };

    checkAuthorization();
  }, [
    isLoading,
    isAuthenticated,
    user,
    roles,
    currentRole,
    location,
    protection,
    organizationId,
    hasRole,
    hasPermission,
    hasOrganizationAccess,
    setLocation
  ]);

  // Mostrar loading enquanto verifica auth ou autorização
  if (isLoading || isAuthorizing) {
    return <AuthLoading />;
  }

  // Mostrar erro de acesso negado
  if (authError) {
    return (
      <AccessDenied
        message={authError}
        userRoles={roles.map(r => r.roleName)}
        requiredRole={protection.requiredRole}
        requiredPermission={protection.requiredPermission}
        fallbackPath={protection.fallbackPath || '/'}
        onRetry={() => {
          setAuthError(null);
          setIsAuthorizing(true);
        }}
      />
    );
  }

  // Renderizar conteúdo protegido
  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Componentes de conveniência para casos comuns
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'protection'>) {
  return (
    <ProtectedRoute
      protection={{
        requireAuth: true,
        requiredRole: 'ADMIN',
        errorMessage: 'Acesso restrito a administradores.',
        fallbackPath: '/'
      }}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function OficinaRoute({
  children,
  organizationScoped = true,
  ...props
}: Omit<ProtectedRouteProps, 'protection'> & { organizationScoped?: boolean }) {
  return (
    <ProtectedRoute
      protection={{
        requireAuth: true,
        requiredRole: 'OFICINA_OWNER',
        organizationScoped,
        errorMessage: 'Acesso restrito a donos de oficina.',
        fallbackPath: '/'
      }}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function ClienteRoute({ children, ...props }: Omit<ProtectedRouteProps, 'protection'>) {
  return (
    <ProtectedRoute
      protection={{
        requireAuth: true,
        requiredRole: 'CLIENTE',
        errorMessage: 'Acesso restrito a clientes.',
        fallbackPath: '/'
      }}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function AuthenticatedRoute({ children, ...props }: Omit<ProtectedRouteProps, 'protection'>) {
  return (
    <ProtectedRoute
      protection={{
        requireAuth: true,
        errorMessage: 'Login necessário para acessar esta página.',
        fallbackPath: '/'
      }}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function MultiRoleRoute({
  children,
  allowedRoles,
  ...props
}: Omit<ProtectedRouteProps, 'protection'> & {
  allowedRoles: ('ADMIN' | 'OFICINA_OWNER' | 'CLIENTE')[]
}) {
  return (
    <ProtectedRoute
      protection={{
        requireAuth: true,
        allowedRoles,
        errorMessage: `Acesso restrito a: ${allowedRoles.join(', ')}.`,
        fallbackPath: '/'
      }}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}