import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  User,
  Wrench,
  Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

// Schema de validação do login unificado
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Schema para login admin (usa email como campo padrão)
const adminLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Tipos para resposta da API
interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    phone?: string;
  };
  roles: Array<{
    roleId: number;
    roleName: string;
    organizationId: number | null;
    permissions: string[];
  }>;
  organizations: number[];
  primaryRole?: string;
  defaultRedirect: string;
  multipleRoles: boolean;
}

// Props do RoleSelector
interface RoleSelectorProps {
  roles: LoginResponse['roles'];
  onSelect: (role: LoginResponse['roles'][0]) => void;
  userName: string;
}

// Componente RoleSelector para usuários com múltiplas roles
function RoleSelector({ roles, onSelect, userName }: RoleSelectorProps) {
  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return <Shield className="w-6 h-6" />;
      case 'OFICINA_OWNER':
        return <Wrench className="w-6 h-6" />;
      case 'CLIENTE':
        return <Car className="w-6 h-6" />;
      default:
        return <User className="w-6 h-6" />;
    }
  };

  const getRoleLabel = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return 'Administrador Geral';
      case 'OFICINA_OWNER':
        return 'Dono da Oficina';
      case 'CLIENTE':
        return 'Cliente';
      default:
        return roleName;
    }
  };

  const getRoleDescription = (role: LoginResponse['roles'][0]) => {
    switch (role.roleName) {
      case 'ADMIN':
        return 'Gerenciar sistema global';
      case 'OFICINA_OWNER':
        return role.organizationId ? `Gerenciar oficina #${role.organizationId}` : 'Gerenciar oficina';
      case 'CLIENTE':
        return 'Acessar como cliente';
      default:
        return 'Acesso padrão';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Bem-vindo, {userName}!
        </h2>
        <p className="text-gray-600 mt-1">
          Você tem acesso a múltiplas áreas. Escolha como deseja continuar:
        </p>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <motion.button
            key={`${role.roleName}-${role.organizationId}`}
            onClick={() => onSelect(role)}
            className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition-all duration-200 text-left group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-4">
              <div className="text-primary group-hover:text-primary-dark transition-colors">
                {getRoleIcon(role.roleName)}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {getRoleLabel(role.roleName)}
                </h3>
                <p className="text-sm text-gray-600">
                  {getRoleDescription(role)}
                </p>
              </div>
              <LogIn className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default function UnifiedLogin() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [loginData, setLoginData] = useState<LoginResponse | null>(null);
  const { toast } = useToast();
  const { revalidate } = useAuth();

  // Não depender mais de intent na URL - deixar o backend decidir automaticamente
  const [intent, setIntent] = useState('auto');
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const value = params.get('intent');
      // Se tiver intent na URL, usar, senão deixar como 'auto' para detecção automática
      setIntent(value || 'auto');
    } catch {
      setIntent('auto');
    }
  }, [location]);

  // Debug logs para intent detection
  console.log('🔍 Intent Detection:', {
    fullLocation: location,
    intent: intent === 'auto' ? 'auto-detect' : intent
  });

  // Usar schema dinâmico baseado no intent
  const isAdminLogin = intent === 'admin';
  // Sempre usar loginSchema (email) para consistência
  const currentSchema = loginSchema;

  console.log('🎯 Login Configuration:', {
    intent,
    isAdminLogin,
    schemaUsed: 'loginSchema (email-based)'
  });

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(currentSchema)
  });

  const getPageTitle = () => {
    switch (intent) {
      case 'admin':
        return 'RuidCar Admin';
      case 'oficina':
        return 'Painel da Oficina';
      case 'cliente':
        return 'Área do Cliente';
      case 'auto':
      default:
        return 'RuidCar - Acesso';
    }
  };

  const getPageSubtitle = () => {
    switch (intent) {
      case 'admin':
        return 'Painel Administrativo';
      case 'oficina':
        return 'Acesse sua conta para gerenciar sua oficina RuidCar';
      case 'cliente':
        return 'Acesse sua conta de cliente';
      case 'auto':
      default:
        return 'Digite seu email e senha para acessar';
    }
  };

  const getPageIcon = () => {
    switch (intent) {
      case 'admin':
        return <Shield className="w-8 h-8 text-white" />;
      case 'oficina':
        return <Wrench className="w-8 h-8 text-white" />;
      case 'cliente':
        return <Car className="w-8 h-8 text-white" />;
      case 'auto':
      default:
        return <LogIn className="w-8 h-8 text-white" />;
    }
  };

  const performLogin = async (data: LoginFormData, selectedRole?: LoginResponse['roles'][0]) => {
    setIsLoading(true);
    setErrorMessage('');

    // Endpoint unificado para todos os logins
    const endpoint = '/api/auth/unified-login';

    try {

      // Corpo de login unificado - deixar backend detectar tipo automaticamente
      const loginData = {
        email: data.email,
        password: data.password,
        intent: intent || 'auto', // usar 'auto' para detecção automática
        selectedRole: selectedRole?.roleName
      };

      console.log('🔍 Tentando login:', {
        endpoint,
        intent: loginData.intent,
        loginData: { ...loginData, password: '***' }
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
        credentials: 'include' // Importante: para receber cookies
      });

      console.log('📡 Resposta do servidor:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const result: LoginResponse = await response.json();
      console.log('📦 Dados da resposta:', result);
      console.log('📦 result.roles:', result.roles);
      console.log('📦 result.multipleRoles:', result.multipleRoles);

      if (!response.ok) {
        console.log('❌ Login falhou:', (result as any)?.message);
        setErrorMessage((result as any)?.message || 'Erro no login');
        return;
      }

      // Padronizar resposta para todos os tipos de usuário
      // Converter resposta de oficina para formato unificado se necessário
      if (intent === 'oficina' && !result.roles) {
        // Adaptar resposta de oficina para formato padrão
        result.roles = [{
          roleId: 1,
          roleName: 'OFICINA_OWNER',
          organizationId: (result as any).workshops?.[0]?.id || null,
          permissions: ['manage_workshop']
        }];
        result.user = result.user || (result as any).admin;
        result.multipleRoles = false;
        result.primaryRole = 'OFICINA_OWNER';
        result.defaultRedirect = '/workshop/dashboard';
      }

      // Verificar se roles existe (com validação robusta)
      if (!result.roles || !Array.isArray(result.roles) || result.roles.length === 0) {
        console.error('❌ Erro: Nenhuma role encontrada para o usuário');
        setErrorMessage('Usuário sem permissões. Entre em contato com o suporte.');
        return;
      }

      // Salvar dados básicos do usuário para cache (sem dados sensíveis)
      sessionStorage.setItem('user-info', JSON.stringify({
        name: result.user.name,
        email: result.user.email,
        currentRole: result.primaryRole || result.roles[0].roleName
      }));

      // Se multiple roles e não há role selecionada, mostrar seletor
      if (result.multipleRoles && !selectedRole) {
        setLoginData(result);
        setShowRoleSelector(true);
        return;
      }

      // Toast de sucesso
      toast({
        title: 'Login realizado com sucesso!',
        description: `Bem-vindo(a), ${result.user.name}`,
      });

      console.log(`✅ Login bem-sucedido: ${result.user.email} (${result.primaryRole})`);

      // Revalidar sessão antes de redirecionar
      await revalidate();

      // Usar o redirecionamento fornecido pelo backend (baseado no tipo de usuário detectado)
      let redirectTo = selectedRole ? getRedirectForRole(selectedRole) : result.defaultRedirect;

      // Garantir redirecionamento correto baseado na role primária
      if (result.primaryRole === 'OFICINA_OWNER' && !redirectTo.startsWith('/workshop')) {
        redirectTo = '/workshop/dashboard';
      } else if (result.primaryRole === 'ADMIN' && !redirectTo.startsWith('/admin')) {
        redirectTo = '/admin';
      } else if (result.primaryRole === 'CLIENTE' && !redirectTo.startsWith('/cliente')) {
        redirectTo = '/cliente';
      }

      console.log(`🔀 Redirecionando para: ${redirectTo}`);
      console.log(`🔀 selectedRole:`, selectedRole);
      console.log(`🔀 result.defaultRedirect:`, result.defaultRedirect);
      console.log(`🔀 Intent:`, intent);
      console.log(`🔀 Primary Role:`, result.primaryRole);

      setLocation(redirectTo);
      console.log(`🔀 setLocation executado!`);

    } catch (error) {
      console.error('❌ Erro no login:', error);
      const err = error as unknown as { message?: string; stack?: string; name?: string; cause?: unknown };
      console.error('❌ Error details:', {
        message: err?.message,
        stack: err?.stack,
        endpoint,
        isAdminLogin,
        intent,
        name: err?.name,
        cause: err?.cause
      });

      const msg = typeof err?.message === 'string' ? err.message : '';
      if (msg.includes('Unexpected token')) {
        setErrorMessage('Erro de formato na resposta do servidor');
      } else {
        setErrorMessage(`Erro de conexão: ${msg || 'Tente novamente.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRedirectForRole = (role: LoginResponse['roles'][0]): string => {
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
  };

  const onSubmit = async (data: LoginFormData) => {
    await performLogin(data);
  };

  const onRoleSelect = async (role: LoginResponse['roles'][0]) => {
    if (!loginData) return;

    try {
      // Fazer switch-role request
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

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.message || 'Erro ao trocar papel');
        return;
      }

      // Token é atualizado via cookie HTTP-only pelo servidor

      // Toast de sucesso
      toast({
        title: 'Papel selecionado!',
        description: `Acessando como ${role.roleName.toLowerCase()}`,
      });

      // Revalidar sessão antes de redirecionar
      await revalidate();
      setLocation(result.defaultRedirect);

    } catch (error) {
      console.error('❌ Erro na troca de papel:', error);
      setErrorMessage('Erro de conexão. Tente novamente.');
    }
  };

  if (showRoleSelector && loginData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Selecione seu Acesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errorMessage && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <RoleSelector
                roles={loginData.roles}
                onSelect={onRoleSelect}
                userName={loginData.user.name}
              />

              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    setShowRoleSelector(false);
                    setLoginData(null);
                  }}
                  className="text-sm text-gray-600 hover:text-primary"
                >
                  ← Voltar ao login
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              {getPageIcon()}
            </div>
            <CardTitle className="text-2xl font-bold">
              {getPageTitle()}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {getPageSubtitle()}
            </p>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    {...register('email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    className="pl-10 pr-10"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            {intent === 'auto' && (
              <div className="mt-4 p-4 rounded-md border bg-gray-50">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Primeira vez acessando?</strong>
                </p>
                <div className="space-y-2">
                  <button
                    className="text-sm text-primary hover:underline block"
                    onClick={() => setLocation('/workshop/register?mode=existing')}
                  >
                    → Ativar oficina com código
                  </button>
                  <button
                    className="text-sm text-primary hover:underline block"
                    onClick={() => setLocation('/workshop/register')}
                  >
                    → Cadastrar nova oficina
                  </button>
                </div>
              </div>
            )}

            <div className="text-center mt-6 text-sm text-muted-foreground">
              <p>
                Problemas para acessar?{' '}
                <button
                  className="text-primary hover:underline"
                  onClick={() => {
                    toast({
                      title: 'Suporte',
                      description: 'Entre em contato: contato@ruidcar.com.br',
                    });
                  }}
                >
                  Entre em contato
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            Voltar para o{' '}
            <button
              className="text-primary hover:underline"
              onClick={() => setLocation('/')}
            >
              site principal
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}