import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Building2,
  CheckCircle,
  XCircle,
  MapPin,
  Plus,
  Eye,
  TrendingUp,
  AlertCircle,
  Clock,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { type Workshop } from '@shared/schema';

interface DashboardStats {
  total: number;
  active: number;
  inactive: number;
  byState: Record<string, number>;
  recentlyAdded: Workshop[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Carregando dados do dashboard...');
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include'
      });

      const data = await response.json();
      console.log('📋 Dados do dashboard:', data);

      if (response.ok) {
        setStats(data.stats);
      } else {
        throw new Error(data.message || 'Erro ao carregar dashboard');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      toast({
        title: 'Erro ao carregar dashboard',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTopStates = () => {
    if (!stats?.byState) return [];

    return Object.entries(stats.byState)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = 'blue',
    description
  }: {
    title: string;
    value: number | string;
    icon: any;
    color?: string;
    description?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={
            color === 'blue'
              ? 'h-4 w-4 text-blue-600'
              : color === 'green'
              ? 'h-4 w-4 text-green-600'
              : color === 'red'
              ? 'h-4 w-4 text-red-600'
              : color === 'purple'
              ? 'h-4 w-4 text-purple-600'
              : 'h-4 w-4 text-foreground'
          }
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={loadDashboardData}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p>Nenhum dado encontrado</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do sistema de oficinas RuidCar</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/workshops/pending">
              <Button variant={stats.inactive > 0 ? "default" : "outline"}>
                <Clock className="h-4 w-4 mr-2" />
                Aprovações Pendentes {stats.inactive > 0 && `(${stats.inactive})`}
              </Button>
            </Link>
            <Link href="/admin/workshops">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Oficina
              </Button>
            </Link>
            <Link href="/mapa">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Ver Mapa Público
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Oficinas"
            value={stats.total}
            icon={Building2}
            color="blue"
            description="Todas as oficinas cadastradas"
          />
          <StatCard
            title="Oficinas Ativas"
            value={stats.active}
            icon={CheckCircle}
            color="green"
            description="Oficinas disponíveis no mapa"
          />
          <StatCard
            title="Oficinas Inativas"
            value={stats.inactive}
            icon={XCircle}
            color="red"
            description="Oficinas desativadas"
          />
          <StatCard
            title="Estados Cobertos"
            value={Object.keys(stats.byState).length}
            icon={MapPin}
            color="purple"
            description="Distribuição geográfica"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top States */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estados com Mais Oficinas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getTopStates().map(([state, count], index) => (
                  <div key={state} className="flex items-center justify-between hover:bg-accent rounded-md px-2 py-1 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <span className="font-medium text-foreground">{state}</span>
                    </div>
                    <Badge variant="secondary">{count} oficinas</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Workshops */}
          <Card>
            <CardHeader>
              <CardTitle>Oficinas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentlyAdded.length > 0 ? (
                  stats.recentlyAdded.map((workshop) => (
                    <div key={workshop.id} className="flex items-center justify-between hover:bg-accent rounded-md px-2 py-1 transition-colors">
                      <div>
                        <p className="font-medium text-sm text-foreground">{workshop.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {workshop.city}, {workshop.state}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={workshop.active ? "default" : "secondary"}
                        >
                          {workshop.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma oficina recente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Usuários
                </Button>
              </Link>
              <Link href="/admin/workshops">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  Gerenciar Oficinas
                </Button>
              </Link>
              <Link href="/mapa">
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Ver Mapa Público
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={loadDashboardData}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Atualizar Dados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Sistema funcionando normalmente. Última atualização: {new Date().toLocaleString('pt-BR')}
            </AlertDescription>
          </Alert>
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              {stats.active} oficinas ativas disponíveis no mapa público
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </AdminLayout>
  );
}