import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Wrench,
  Car,
  ChevronDown,
  LogOut,
  Settings,
  RefreshCw,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth, type AuthRole } from '@/hooks/use-auth';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showRoleSwitcher?: boolean;
  className?: string;
}

export default function AppHeader({
  title,
  subtitle,
  showRoleSwitcher = true,
  className = ''
}: AppHeaderProps) {
  const {
    user,
    roles,
    currentRole,
    switchRole,
    logout,
    isLoading
  } = useAuth();
  const { toast } = useToast();
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const getRoleIcon = (roleName: string, size = 'w-4 h-4') => {
    switch (roleName) {
      case 'ADMIN':
        return <Shield className={size} />;
      case 'OFICINA_OWNER':
        return <Wrench className={size} />;
      case 'CLIENTE':
        return <Car className={size} />;
      default:
        return <User className={size} />;
    }
  };

  const getRoleLabel = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return 'Administrador';
      case 'OFICINA_OWNER':
        return 'Dono da Oficina';
      case 'CLIENTE':
        return 'Cliente';
      default:
        return roleName;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'OFICINA_OWNER':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'CLIENTE':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRoleSwitch = async (role: AuthRole) => {
    if (role.roleId === currentRole?.roleId) return;

    setIsSwitchingRole(true);

    try {
      const success = await switchRole(role);

      if (success) {
        toast({
          title: 'Papel alterado',
          description: `Agora você está acessando como ${getRoleLabel(role.roleName)}`,
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível trocar de papel. Tente novamente.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro de conexão. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSwitchingRole(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado com sucesso.',
    });
  };

  if (isLoading || !user) {
    return (
      <header className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Título da página */}
        <div className="space-y-1">
          {title && (
            <h1 className="text-xl font-semibold text-gray-900">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        {/* Área do usuário */}
        <div className="flex items-center space-x-4">
          {/* Indicador de papel atual */}
          {showRoleSwitcher && currentRole && (
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm text-gray-600">Você está como:</span>
              <Badge variant="secondary" className={getRoleColor(currentRole.roleName)}>
                {getRoleIcon(currentRole.roleName, 'w-3 h-3')}
                <span className="ml-1">{getRoleLabel(currentRole.roleName)}</span>
              </Badge>
            </div>
          )}

          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user.name} />
                  <AvatarFallback className="text-sm">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>

              {/* Troca de papel - apenas se tiver múltiplas roles */}
              {showRoleSwitcher && roles.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Trocar Papel
                  </DropdownMenuLabel>
                  {roles.map((role) => (
                    <DropdownMenuItem
                      key={`${role.roleName}-${role.organizationId}`}
                      onClick={() => handleRoleSwitch(role)}
                      disabled={isSwitchingRole}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(role.roleName)}
                        <span>{getRoleLabel(role.roleName)}</span>
                        {role.organizationId && (
                          <Badge variant="outline" className="text-xs">
                            #{role.organizationId}
                          </Badge>
                        )}
                      </div>
                      {currentRole?.roleId === role.roleId && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                      {isSwitchingRole && (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile role indicator */}
      {showRoleSwitcher && currentRole && (
        <div className="sm:hidden mt-2 flex items-center space-x-2">
          <span className="text-xs text-gray-600">Papel atual:</span>
          <Badge variant="secondary" className={getRoleColor(currentRole.roleName)}>
            {getRoleIcon(currentRole.roleName, 'w-3 h-3')}
            <span className="ml-1">{getRoleLabel(currentRole.roleName)}</span>
          </Badge>
        </div>
      )}
    </header>
  );
}