import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Home,
  Building2,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
  ClipboardList,
  DollarSign,
  MapPin,
  User,
  Phone,
  Mail,
  BarChart3,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface WorkshopLayoutProps {
  children: React.ReactNode;
}

interface WorkshopAdmin {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
}

interface Workshop {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  active: boolean;
  diagnosisPrice?: number;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/workshop',
    icon: Home,
    description: 'Visão geral da oficina'
  },
  {
    name: 'Agendamentos',
    href: '/workshop/appointments',
    icon: Calendar,
    description: 'Gerenciar agendamentos'
  },
  {
    name: 'Diagnóstico RuidCar',
    href: '/workshop/diagnostic',
    icon: Stethoscope,
    description: 'Configurar serviço de diagnóstico',
    badge: 'Novo'
  },
  {
    name: 'Serviços e Preços',
    href: '/workshop/services',
    icon: DollarSign,
    description: 'Configurar serviços'
  },
  {
    name: 'Perfil da Oficina',
    href: '/workshop/profile',
    icon: Building2,
    description: 'Editar dados da oficina'
  },
  {
    name: 'Relatórios',
    href: '/workshop/reports',
    icon: BarChart3,
    description: 'Ver estatísticas'
  },
  {
    name: 'Mapa Público',
    href: '/mapa',
    icon: MapPin,
    description: 'Ver no mapa público',
    external: true
  }
];

export default function WorkshopLayout({ children }: WorkshopLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<WorkshopAdmin | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, [setLocation]);

  const loadUserData = async () => {
    try {
      // Não verificar mais workshop-token pois agora usamos cookies HTTP-only
      // A autenticação já foi verificada pelo ProtectedRoute

      // Verificar dados do usuário no localStorage primeiro
      const adminData = localStorage.getItem('workshop-admin');
      const workshopsData = localStorage.getItem('workshop-workshops');

      if (adminData && workshopsData) {
        const parsedAdmin = JSON.parse(adminData);
        const parsedWorkshops = JSON.parse(workshopsData);
        setAdmin(parsedAdmin);
        setWorkshops(parsedWorkshops);
        setSelectedWorkshop(parsedWorkshops[0] || null);
        setLoading(false);
      } else {
        // Se não há dados no localStorage, buscar do servidor
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            handleLogout();
            return;
          }
          throw new Error('Erro ao carregar dados do usuário');
        }

        const data = await response.json();

        // Criar estrutura de dados compatível
        const adminData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          role: 'OFICINA_OWNER',
          isActive: true
        };

        // Extrair workshops das organizações
        const workshopIds = data.organizations || [];
        const workshopsData = workshopIds.map((id: number) => ({
          id,
          name: `Oficina #${id}`,
          active: true
        }));

        setAdmin(adminData);
        setWorkshops(workshopsData);
        setSelectedWorkshop(workshopsData[0] || null);

        // Salvar no localStorage para cache
        localStorage.setItem('workshop-admin', JSON.stringify(adminData));
        localStorage.setItem('workshop-workshops', JSON.stringify(workshopsData));

        setLoading(false);
      }

    } catch (error) {
      console.error('Erro ao carregar dados da oficina:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da oficina',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Chamar API para limpar cookie de autenticação
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    }

    // Limpar dados locais
    localStorage.removeItem('workshop-admin');
    localStorage.removeItem('workshop-workshops');
    sessionStorage.removeItem('user-info');

    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado com sucesso'
    });
    setLocation('/workshop/login');
  };

  const isCurrentPath = (href: string) => {
    if (href === '/workshop') {
      return location === '/workshop' || location === '/workshop/dashboard';
    }
    return location.startsWith(href);
  };

  const formatPrice = (priceInCents?: number) => {
    if (!priceInCents) return 'Não definido';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(priceInCents / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando painel da oficina...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Erro ao carregar dados. Redirecionando...</p>
        </div>
      </div>
    );
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
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="font-bold text-lg text-foreground">RuidCar</span>
                <div className="text-xs text-muted-foreground font-medium">Workshop Panel</div>
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

          {/* Workshop info */}
          {selectedWorkshop && (
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <Card className="bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border-0">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 text-foreground">{selectedWorkshop.name}</h3>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{selectedWorkshop.city}, {selectedWorkshop.state}</span>
                        </div>
                        {selectedWorkshop.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{selectedWorkshop.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>Diagnóstico: {formatPrice(selectedWorkshop.diagnosisPrice)}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        {selectedWorkshop.active ? (
                          <Badge variant="default" className="text-xs bg-green-500">
                            Oficina Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Aguardando Aprovação
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <nav className="select-none text-sm pt-4 pr-2 pl-2 flex-1 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            <div className="pb-4">
              <div className="px-3 mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu da Oficina</p>
              </div>
              <ul className="space-y-1">
              {navigation.map((item) => {
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
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <Badge className="ml-auto bg-orange-500 text-white text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    </li>
                  );
                }

                return (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <a
                        className={`
                          flex items-center gap-3 px-4 py-3 mx-2 text-sm font-medium rounded-xl transition-colors
                          ${isCurrent
                            ? 'bg-gradient-to-r from-zinc-200 to-zinc-300 text-zinc-900 dark:from-zinc-700 dark:to-zinc-800 dark:text-zinc-100 beautiful-shadow'
                            : 'text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                          }
                        `}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <Badge className="ml-auto bg-orange-500 text-white text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    </Link>
                  </li>
                );
              })}
              </ul>
            </div>
          </nav>

          {/* Admin info + Logout no final */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-gradient-to-t from-zinc-100 via-zinc-50 to-transparent dark:from-zinc-900 dark:via-zinc-950 backdrop-blur-sm">
            {/* Admin info */}
            <div className="p-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-sm">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                    {admin.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {admin.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {admin.email}
                  </p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                      Administrador
                    </Badge>
                    {admin.isActive && (
                      <Badge variant="default" className="text-xs bg-green-500/90 hover:bg-green-500">
                        Ativo
                      </Badge>
                    )}
                  </div>
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
                  {navigation.find(item => !item.external && isCurrentPath(item.href))?.name || 'Painel da Oficina'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {navigation.find(item => !item.external && isCurrentPath(item.href))?.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:inline-flex">
                {workshops.length} oficina{workshops.length !== 1 ? 's' : ''}
              </Badge>

              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{admin.name}</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
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