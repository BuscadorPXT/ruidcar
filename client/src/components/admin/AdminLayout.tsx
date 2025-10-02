import { useState, useEffect, useMemo, memo } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Home,
  Building2,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  MapPin,
  BarChart3,
  MessageSquare,
  MessageCircle,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useLeadSocket } from '@/hooks/useLeadSocket';
import { AuthLoading } from '@/components/ui/loading';
import { useAutoPrefetch, useHoverPrefetch } from '@/hooks/use-prefetch';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  description: string;
  external?: boolean;
  badge?: string;
}

// Componente NavigationItem memoizado para evitar re-renders
const NavigationItem = memo<{
  item: NavigationItem;
  isCurrentPath: (href: string) => boolean;
  onClick: () => void;
  newLeadsCount: number;
  onHover: (href: string) => void;
}>(({ item, isCurrentPath, onClick, newLeadsCount, onHover }) => {
  const Icon = item.icon;
  const isCurrent = !item.external && isCurrentPath(item.href);

  if (item.external) {
    return (
      <li key={item.name}>
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-colors text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <Icon className="h-4 w-4" />
          <span>{item.name}</span>
        </a>
      </li>
    );
  }

  return (
    <li key={item.name}>
      <Link href={item.href}>
        <div
          className={`
            flex items-center gap-3 px-4 py-3 mx-2 text-sm font-medium rounded-xl transition-colors cursor-pointer
            ${isCurrent
              ? 'bg-gradient-to-r from-zinc-200 to-zinc-300 text-zinc-900 dark:from-zinc-700 dark:to-zinc-800 dark:text-zinc-100 beautiful-shadow'
              : 'text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }
          `}
          onClick={onClick}
          onMouseEnter={() => onHover(item.href)}
          role="link"
          aria-current={isCurrent ? 'page' : undefined}
        >
          <Icon className="h-4 w-4" />
          <span>{item.name}</span>
          {item.badge && (
            <Badge
              variant={item.name === 'Leads' ? 'default' : 'secondary'}
              className={`ml-auto text-xs ${item.name === 'Leads' && newLeadsCount > 0 ? 'animate-pulse bg-red-500 text-white' : ''}`}
            >
              {item.badge}
            </Badge>
          )}
        </div>
      </Link>
    </li>
  );
});
NavigationItem.displayName = 'NavigationItem';

const baseNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: Home,
    description: 'Visão geral'
  },
  {
    name: 'Leads',
    href: '/admin/leads',
    icon: MessageSquare,
    description: 'Gerenciar leads'
  },
  {
    name: 'Inteligência IA',
    href: '/admin/leads-intelligence',
    icon: Brain,
    description: 'Central de IA para Leads',
    badge: 'Novo'
  },
  {
    name: 'WhatsApp',
    href: '/admin/whatsapp',
    icon: MessageCircle,
    description: 'Automação WhatsApp'
  },
  {
    name: 'Analytics',
    href: '/admin/leads/dashboard',
    icon: BarChart3,
    description: 'Dashboard de leads'
  },
  {
    name: 'Usuários',
    href: '/admin/users',
    icon: Users,
    description: 'Gerenciar usuários'
  },
  {
    name: 'Oficinas',
    href: '/admin/workshops',
    icon: Building2,
    description: 'Gerenciar oficinas'
  },
  {
    name: 'Aprovações',
    href: '/admin/workshops/pending',
    icon: Shield,
    description: 'Oficinas pendentes'
  },
  {
    name: 'Mapa Público',
    href: '/mapa',
    icon: MapPin,
    description: 'Ver mapa público',
    external: true
  }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const { toast } = useToast();
  const { newLeadsCount, enableRealTime, shouldConnect } = useLeadSocket();
  const { handleMouseEnter } = useHoverPrefetch();

  // Auto-prefetch para otimização
  useAutoPrefetch(location);

  // Ativar tempo real apenas em páginas específicas
  useEffect(() => {
    const realTimePages = ['/admin/leads', '/admin/leads/dashboard', '/admin/leads-intelligence'];
    const currentPath = location;

    if (realTimePages.some(page => currentPath.startsWith(page))) {
      enableRealTime();
    }
  }, [location, enableRealTime]);

  // Create navigation with dynamic badge (memoized for performance)
  const navigation = useMemo(() =>
    baseNavigation.map(item => ({
      ...item,
      badge: item.name === 'Leads' && newLeadsCount > 0
        ? newLeadsCount.toString()
        : item.badge
    })),
    [newLeadsCount]
  );

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          setLocation('/admin/login');
          return;
        }
        const data = await res.json();
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          username: data.user.email,
          role: data.primaryRole || (data.roles?.[0]?.roleName ?? 'ADMIN')
        });
      } catch (e) {
        setLocation('/admin/login');
      }
    };
    init();
  }, [setLocation]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso'
      });
      setLocation('/admin/login');
    }
  };

  const isCurrentPath = (href: string) => {
    if (href === '/admin') {
      return location === '/admin';
    }
    return location.startsWith(href);
  };

  if (!user) {
    return <AuthLoading />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-80 sidebar beautiful-shadow overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-screen max-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="font-bold text-lg text-foreground">RuidCar</span>
                <div className="text-xs text-muted-foreground font-medium">Admin Panel</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="select-none text-sm pt-4 pr-2 pl-2 flex-1 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            <div className="pb-4">
              <div className="px-3 mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu Principal</p>
              </div>
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <NavigationItem
                    key={item.name}
                    item={item}
                    isCurrentPath={isCurrentPath}
                    onClick={() => setSidebarOpen(false)}
                    onHover={handleMouseEnter}
                    newLeadsCount={newLeadsCount}
                  />
                ))}
              </ul>
            </div>
          </nav>

          {/* User info + Logout no final */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-gradient-to-t from-zinc-100 via-zinc-50 to-transparent dark:from-zinc-900 dark:via-zinc-950 backdrop-blur-sm">
            {/* User info */}
            <div className="p-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-sm">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <Badge variant="secondary" className="text-xs mt-1 bg-primary/10 text-primary border-primary/20">
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="px-4 pb-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top bar */}
        <div className="bg-card border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>

              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {navigation.find(item => !item.external && isCurrentPath(item.href))?.name || 'Admin'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {navigation.find(item => !item.external && isCurrentPath(item.href))?.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:inline-flex">
                Ambiente: Desenvolvimento
              </Badge>

              {shouldConnect && (
                <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                  🔴 Tempo Real
                </Badge>
              )}

              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>

              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}