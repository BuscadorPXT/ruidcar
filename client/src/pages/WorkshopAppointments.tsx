import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  Building2,
  DollarSign,
  FileText,
  Eye,
  CheckCheck,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkshopLayout from '@/components/workshop/WorkshopLayout';
import DiagnosticAppointments from '@/components/workshop/DiagnosticAppointments';
import { useToast } from '@/hooks/use-toast';
import { Stethoscope } from 'lucide-react';

interface Appointment {
  id: number;
  fullName: string;
  email: string;
  whatsapp?: string;
  company?: string;
  message: string;
  vehicleModel?: string;
  vehicleYear?: string;
  problemDescription?: string;
  preferredDate?: string;
  preferredTime?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: string;
  respondedAt?: string;
  workshopNotes?: string;
  estimatedPrice?: number;
}

interface AppointmentStats {
  total: number;
  pending: number;
  accepted: number;
  completed: number;
  cancelled: number;
  todayAppointments: number;
  weekAppointments: number;
}

export default function WorkshopAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    cancelled: 0,
    todayAppointments: 0,
    weekAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseForm, setResponseForm] = useState({
    status: 'accepted' as 'accepted' | 'rejected',
    notes: '',
    estimatedPrice: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  const loadAppointments = async () => {
    try {
      // Mock data - substituir por chamada real à API
      const mockAppointments: Appointment[] = [
        {
          id: 1,
          fullName: 'João Silva',
          email: 'joao.silva@email.com',
          whatsapp: '11999999999',
          company: 'Empresa ABC',
          message: 'Preciso fazer diagnóstico de ruído no meu veículo',
          vehicleModel: 'Honda Civic',
          vehicleYear: '2020',
          problemDescription: 'Ruído vindo da suspensão dianteira ao passar em lombadas',
          preferredDate: '2024-01-20',
          preferredTime: '14:00',
          status: 'pending',
          createdAt: '2024-01-15T10:00:00',
        },
        {
          id: 2,
          fullName: 'Maria Santos',
          email: 'maria.santos@email.com',
          whatsapp: '11888888888',
          message: 'Agendamento para diagnóstico completo',
          vehicleModel: 'Toyota Corolla',
          vehicleYear: '2019',
          problemDescription: 'Barulho no motor quando acelera',
          preferredDate: '2024-01-18',
          preferredTime: '10:00',
          status: 'accepted',
          createdAt: '2024-01-14T15:00:00',
          respondedAt: '2024-01-14T16:00:00',
          workshopNotes: 'Cliente confirmado para o horário solicitado',
          estimatedPrice: 15000
        },
        {
          id: 3,
          fullName: 'Carlos Oliveira',
          email: 'carlos@email.com',
          whatsapp: '11777777777',
          message: 'Verificar ruído na direção',
          vehicleModel: 'Volkswagen Jetta',
          vehicleYear: '2021',
          problemDescription: 'Rangido ao virar o volante',
          preferredDate: '2024-01-17',
          preferredTime: '09:00',
          status: 'completed',
          createdAt: '2024-01-10T09:00:00',
          respondedAt: '2024-01-10T10:00:00',
          workshopNotes: 'Diagnóstico realizado - problema identificado na coluna de direção',
          estimatedPrice: 20000
        }
      ];

      setAppointments(mockAppointments);

      // Calcular estatísticas
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const newStats: AppointmentStats = {
        total: mockAppointments.length,
        pending: mockAppointments.filter(a => a.status === 'pending').length,
        accepted: mockAppointments.filter(a => a.status === 'accepted').length,
        completed: mockAppointments.filter(a => a.status === 'completed').length,
        cancelled: mockAppointments.filter(a => a.status === 'cancelled' || a.status === 'rejected').length,
        todayAppointments: mockAppointments.filter(a => a.preferredDate === today).length,
        weekAppointments: mockAppointments.filter(a => {
          const appointmentDate = new Date(a.createdAt);
          return appointmentDate >= weekAgo;
        }).length
      };

      setStats(newStats);
      setLoading(false);

    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar agendamentos',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.fullName.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        a.vehicleModel?.toLowerCase().includes(term) ||
        a.whatsapp?.includes(term)
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    // Filtro por data
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(a => a.preferredDate === today);
          break;
        case 'week':
          filtered = filtered.filter(a => {
            const date = new Date(a.createdAt);
            return date >= weekAgo;
          });
          break;
        case 'month':
          filtered = filtered.filter(a => {
            const date = new Date(a.createdAt);
            return date >= monthAgo;
          });
          break;
      }
    }

    setFilteredAppointments(filtered);
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleRespond = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setResponseForm({
      status: 'accepted',
      notes: '',
      estimatedPrice: ''
    });
    setIsResponseModalOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedAppointment) return;

    try {
      // Aqui seria a chamada real à API
      console.log('Respondendo agendamento:', {
        appointmentId: selectedAppointment.id,
        ...responseForm
      });

      toast({
        title: 'Sucesso',
        description: `Agendamento ${responseForm.status === 'accepted' ? 'aceito' : 'recusado'} com sucesso`,
      });

      // Atualizar lista local
      const updatedAppointments = appointments.map(a => {
        if (a.id === selectedAppointment.id) {
          return {
            ...a,
            status: responseForm.status,
            respondedAt: new Date().toISOString(),
            workshopNotes: responseForm.notes,
            estimatedPrice: responseForm.estimatedPrice ? parseInt(responseForm.estimatedPrice) : undefined
          };
        }
        return a;
      });

      setAppointments(updatedAppointments);
      setIsResponseModalOpen(false);
      setSelectedAppointment(null);

    } catch (error) {
      console.error('Erro ao responder agendamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao responder agendamento',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsCompleted = async (appointment: Appointment) => {
    try {
      // Aqui seria a chamada real à API
      toast({
        title: 'Sucesso',
        description: 'Agendamento marcado como concluído',
      });

      const updatedAppointments = appointments.map(a => {
        if (a.id === appointment.id) {
          return { ...a, status: 'completed' as const };
        }
        return a;
      });

      setAppointments(updatedAppointments);
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar agendamento',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'accepted':
        return <Badge variant="default">Aceito</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Recusado</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <WorkshopLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Carregando agendamentos...</p>
          </div>
        </div>
      </WorkshopLayout>
    );
  }

  return (
    <WorkshopLayout>
      <div className="space-y-6">
        {/* Header com estatísticas */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os agendamentos da sua oficina</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">
              <Calendar className="h-4 w-4 mr-2" />
              Agendamentos Gerais
            </TabsTrigger>
            <TabsTrigger value="diagnostic">
              <Stethoscope className="h-4 w-4 mr-2" />
              Diagnóstico RuidCar
            </TabsTrigger>
          </TabsList>

          {/* Tab de Agendamentos Gerais */}
          <TabsContent value="general" className="space-y-6">

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Aceitos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accepted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Cancelados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, email, telefone ou veículo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="accepted">Aceitos</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="rejected">Recusados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de agendamentos */}
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum agendamento encontrado</p>
              <p className="text-sm text-gray-400 mt-1">
                Tente ajustar os filtros para ver mais resultados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{appointment.fullName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(appointment.status)}
                              <span className="text-xs text-gray-500">
                                Solicitado em {formatDate(appointment.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{appointment.email}</span>
                          </div>

                          {appointment.whatsapp && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{appointment.whatsapp}</span>
                            </div>
                          )}

                          {appointment.vehicleModel && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Car className="h-4 w-4" />
                              <span>
                                {appointment.vehicleModel} {appointment.vehicleYear && `(${appointment.vehicleYear})`}
                              </span>
                            </div>
                          )}

                          {appointment.preferredDate && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(appointment.preferredDate).toLocaleDateString('pt-BR')}
                                {appointment.preferredTime && ` às ${appointment.preferredTime}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {appointment.problemDescription && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Problema:</span> {appointment.problemDescription}
                            </p>
                          </div>
                        )}

                        {appointment.estimatedPrice && (
                          <div className="mt-2">
                            <Badge variant="outline">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Orçamento: {formatCurrency(appointment.estimatedPrice)}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(appointment)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver detalhes
                        </Button>

                        {appointment.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleRespond(appointment)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Responder
                          </Button>
                        )}

                        {appointment.status === 'accepted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleMarkAsCompleted(appointment)}
                          >
                            <CheckCheck className="h-4 w-4 mr-1" />
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal de detalhes */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
              <DialogDescription>
                Visualize todas as informações do agendamento selecionado
              </DialogDescription>
            </DialogHeader>

            {selectedAppointment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Cliente</Label>
                    <p className="font-medium">{selectedAppointment.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <p>{selectedAppointment.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">WhatsApp</Label>
                    <p>{selectedAppointment.whatsapp || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Veículo</Label>
                    <p>
                      {selectedAppointment.vehicleModel || 'Não informado'}
                      {selectedAppointment.vehicleYear && ` (${selectedAppointment.vehicleYear})`}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Data Preferida</Label>
                    <p>
                      {selectedAppointment.preferredDate
                        ? new Date(selectedAppointment.preferredDate).toLocaleDateString('pt-BR')
                        : 'Não informado'}
                      {selectedAppointment.preferredTime && ` às ${selectedAppointment.preferredTime}`}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Mensagem do Cliente</Label>
                  <p className="mt-1 text-sm">{selectedAppointment.message}</p>
                </div>

                {selectedAppointment.problemDescription && (
                  <div>
                    <Label className="text-gray-600">Descrição do Problema</Label>
                    <p className="mt-1 text-sm">{selectedAppointment.problemDescription}</p>
                  </div>
                )}

                {selectedAppointment.workshopNotes && (
                  <div>
                    <Label className="text-gray-600">Notas da Oficina</Label>
                    <p className="mt-1 text-sm">{selectedAppointment.workshopNotes}</p>
                  </div>
                )}

                {selectedAppointment.estimatedPrice && (
                  <div>
                    <Label className="text-gray-600">Orçamento</Label>
                    <p className="mt-1 font-semibold text-lg">
                      {formatCurrency(selectedAppointment.estimatedPrice)}
                    </p>
                  </div>
                )}

                <div className="flex justify-between text-xs text-gray-500">
                  <span>Criado em: {formatDate(selectedAppointment.createdAt)}</span>
                  {selectedAppointment.respondedAt && (
                    <span>Respondido em: {formatDate(selectedAppointment.respondedAt)}</span>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de resposta */}
        <Dialog open={isResponseModalOpen} onOpenChange={setIsResponseModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Responder Agendamento</DialogTitle>
              <DialogDescription>
                Responda ao agendamento de {selectedAppointment?.fullName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Ação</Label>
                <Select
                  value={responseForm.status}
                  onValueChange={(value) => setResponseForm({ ...responseForm, status: value as 'accepted' | 'rejected' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accepted">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Aceitar agendamento
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 mr-2 text-red-600" />
                        Recusar agendamento
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {responseForm.status === 'accepted' && (
                <div>
                  <Label>Valor estimado (opcional)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 150.00"
                    value={responseForm.estimatedPrice}
                    onChange={(e) => setResponseForm({ ...responseForm, estimatedPrice: e.target.value })}
                  />
                </div>
              )}

              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Adicione observações sobre o agendamento..."
                  value={responseForm.notes}
                  onChange={(e) => setResponseForm({ ...responseForm, notes: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResponseModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitResponse}>
                {responseForm.status === 'accepted' ? 'Aceitar' : 'Recusar'} Agendamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </TabsContent>

          {/* Tab de Diagnóstico RuidCar */}
          <TabsContent value="diagnostic">
            <DiagnosticAppointments workshopId={1} />
          </TabsContent>
        </Tabs>
      </div>
    </WorkshopLayout>
  );
}