import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  MapPin,
  Phone,
  Star,
  Activity,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import WorkshopLayout from '@/components/workshop/WorkshopLayout';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  monthlyRevenue: number;
  averageRating: number;
  activeServices: number;
}

interface RecentAppointment {
  id: number;
  customerName: string;
  vehicleModel: string;
  scheduledDate: string;
  status: string;
  estimatedPrice?: number;
}

export default function WorkshopDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    activeServices: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Carregar dados das oficinas do localStorage
      const workshopsData = localStorage.getItem('workshop-workshops');
      if (workshopsData) {
        const parsedWorkshops = JSON.parse(workshopsData);
        setWorkshops(parsedWorkshops || []);
        setSelectedWorkshop(parsedWorkshops[0] || null);
      }

      // Aqui você implementaria as chamadas para a API para buscar:
      // - Estatísticas dos agendamentos
      // - Agendamentos recentes
      // - Dados de receita
      // Por enquanto, vamos usar dados mock

      // Simular dados mock
      setTimeout(() => {
        setStats({
          totalAppointments: 42,
          pendingAppointments: 8,
          completedAppointments: 34,
          monthlyRevenue: 12500,
          averageRating: 4.8,
          activeServices: 6
        });

        setRecentAppointments([
          {
            id: 1,
            customerName: 'João Silva',
            vehicleModel: 'Honda Civic 2020',
            scheduledDate: '2024-01-15T10:00:00',
            status: 'pending',
            estimatedPrice: 15000
          },
          {
            id: 2,
            customerName: 'Maria Santos',
            vehicleModel: 'Toyota Corolla 2019',
            scheduledDate: '2024-01-15T14:00:00',
            status: 'confirmed',
            estimatedPrice: 12000
          },
          {
            id: 3,
            customerName: 'Carlos Oliveira',
            vehicleModel: 'Volkswagen Jetta 2021',
            scheduledDate: '2024-01-14T09:00:00',
            status: 'completed',
            estimatedPrice: 18000
          }
        ]);

        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do dashboard',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmado</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  if (loading) {
    return (
      <WorkshopLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Carregando dashboard...</p>
          </div>
        </div>
      </WorkshopLayout>
    );
  }

  return (
    <WorkshopLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Welcome section */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bem-vindo ao seu painel!
              </h1>
              <p className="text-gray-600 mt-1">
                Acompanhe o desempenho da sua oficina e gerencie seus agendamentos
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-4">
              {workshops.length > 1 && (
                <Select
                  value={selectedWorkshop?.id?.toString()}
                  onValueChange={(value) => {
                    const workshop = workshops.find(w => w.id.toString() === value);
                    setSelectedWorkshop(workshop);
                  }}
                >
                  <SelectTrigger className="w-[250px]">
                    <Building2 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Selecione uma oficina" />
                  </SelectTrigger>
                  <SelectContent>
                    {workshops.map((workshop) => (
                      <SelectItem key={workshop.id} value={workshop.id.toString()}>
                        {workshop.name || `Oficina #${workshop.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Badge variant="outline" className="text-sm">
                <Activity className="w-4 h-4 mr-1" />
                Última atualização: {new Date().toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Workshop status alert */}
        {selectedWorkshop && !selectedWorkshop.active && (
          <motion.div variants={itemVariants}>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta oficina está aguardando aprovação. Você receberá um email quando for aprovada e
                poderá começar a receber agendamentos.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Agendamentos Totais
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  Este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pendentes
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  Aguardando confirmação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Mensal
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% do mês anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avaliação Média
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageRating}</div>
                <p className="text-xs text-muted-foreground">
                  De 5 estrelas
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Recent Appointments and Quick Actions */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Appointments */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Agendamentos Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum agendamento encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium">{appointment.customerName}</p>
                                <p className="text-sm text-gray-600">{appointment.vehicleModel}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(appointment.scheduledDate)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {appointment.estimatedPrice && (
                              <span className="text-sm font-medium">
                                {formatCurrency(appointment.estimatedPrice)}
                              </span>
                            )}
                            {getStatusBadge(appointment.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ver Agendamentos
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Configurar Preços
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Building2 className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Relatórios
                  </Button>
                </CardContent>
              </Card>

              {/* Workshop Info */}
              {selectedWorkshop && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {workshops.length > 1 ? 'Oficina Selecionada' : 'Sua Oficina'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">{selectedWorkshop.name || `Oficina #${selectedWorkshop.id}`}</p>
                          <p className="text-sm text-gray-600">{selectedWorkshop.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedWorkshop.city}, {selectedWorkshop.state}</span>
                      </div>
                      {selectedWorkshop.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedWorkshop.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Diagnóstico: {selectedWorkshop.diagnosisPrice ?
                            formatCurrency(selectedWorkshop.diagnosisPrice) :
                            'Não definido'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </WorkshopLayout>
  );
}