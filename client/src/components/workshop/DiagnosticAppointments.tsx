import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Download,
  Eye,
  MessageSquare,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, startOfDay, endOfDay, addDays, isSameDay, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: number;
  workshopId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleCategory: 'popular' | 'medium' | 'luxury';
  vehiclePlate?: string;
  problemDescription?: string;
  preferredDate: string;
  preferredTime: string;
  actualDate?: string;
  actualTime?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  finalPrice: number;
  checkInTime?: string;
  checkOutTime?: string;
  serviceNotes?: string;
  serviceRating?: number;
  createdAt: string;
}

interface DiagnosticAppointmentsProps {
  workshopId: number;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-500',
    icon: AlertCircle
  },
  confirmed: {
    label: 'Confirmado',
    color: 'bg-blue-500',
    icon: CheckCircle
  },
  in_progress: {
    label: 'Em Atendimento',
    color: 'bg-purple-500',
    icon: Clock
  },
  completed: {
    label: 'Concluído',
    color: 'bg-green-500',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-gray-500',
    icon: XCircle
  },
  no_show: {
    label: 'Não Compareceu',
    color: 'bg-red-500',
    icon: XCircle
  }
};

const CATEGORY_LABELS = {
  popular: 'Popular',
  medium: 'Médio/SUV',
  luxury: 'Luxo/Premium'
};

export default function DiagnosticAppointments({ workshopId }: DiagnosticAppointmentsProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar agendamentos
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['diagnostic-appointments', workshopId, selectedDate, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('date', selectedDate);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/workshop/diagnostic/appointments?${params}`, {
        headers: {
          'x-workshop-id': workshopId.toString()
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar agendamentos');

      const result = await response.json();
      return result.data as Appointment[];
    }
  });

  // Estatísticas do dia
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  // Atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number; status: string }) => {
      const response = await fetch(`/api/workshop/diagnostic/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-workshop-id': workshopId.toString()
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Erro ao atualizar status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-appointments'] });
      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso'
      });
    }
  });

  // Check-in
  const checkInMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const response = await fetch(`/api/workshop/diagnostic/appointments/${appointmentId}/check-in`, {
        method: 'POST',
        headers: {
          'x-workshop-id': workshopId.toString()
        }
      });

      if (!response.ok) throw new Error('Erro ao fazer check-in');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-appointments'] });
      toast({
        title: 'Check-in realizado',
        description: 'Cliente marcado como presente'
      });
    }
  });

  // Check-out
  const checkOutMutation = useMutation({
    mutationFn: async ({ appointmentId, notes }: { appointmentId: number; notes: string }) => {
      const response = await fetch(`/api/workshop/diagnostic/appointments/${appointmentId}/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workshop-id': workshopId.toString()
        },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) throw new Error('Erro ao fazer check-out');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-appointments'] });
      toast({
        title: 'Check-out realizado',
        description: 'Atendimento concluído com sucesso'
      });
      setNotesModalOpen(false);
    }
  });

  const handleStatusChange = (appointment: Appointment, newStatus: string) => {
    updateStatusMutation.mutate({
      appointmentId: appointment.id,
      status: newStatus
    });
  };

  const handleCheckIn = (appointment: Appointment) => {
    checkInMutation.mutate(appointment.id);
  };

  const handleCheckOut = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNotesModalOpen(true);
  };

  const confirmCheckOut = () => {
    if (selectedAppointment) {
      checkOutMutation.mutate({
        appointmentId: selectedAppointment.id,
        notes
      });
    }
  };

  const handleExport = () => {
    // TODO: Implementar exportação para CSV/Excel
    toast({
      title: 'Em desenvolvimento',
      description: 'Funcionalidade de exportação em breve'
    });
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        appointment.customerName.toLowerCase().includes(search) ||
        appointment.customerPhone.includes(search) ||
        appointment.vehicleModel.toLowerCase().includes(search) ||
        appointment.vehiclePlate?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getDateLabel = (date: string) => {
    const d = parseISO(date);
    if (isToday(d)) return 'Hoje';
    if (isTomorrow(d)) return 'Amanhã';
    return format(d, "d 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), -1), 'yyyy-MM-dd'))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-500">Agendamentos</p>
              <p className="font-semibold">{getDateLabel(selectedDate)}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="in_progress">Em Atendimento</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-gray-500">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <p className="text-sm text-gray-500">Confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-sm text-gray-500">Concluídos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
            <p className="text-sm text-gray-500">Cancelados</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nome, telefone, veículo ou placa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de agendamentos */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum agendamento encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => {
            const StatusIcon = STATUS_CONFIG[appointment.status].icon;
            return (
              <Card key={appointment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <Badge className={`${STATUS_CONFIG[appointment.status].color} text-white`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {STATUS_CONFIG[appointment.status].label}
                          </Badge>
                        </div>

                        <div className="flex-1 grid md:grid-cols-3 gap-4">
                          {/* Dados do Cliente */}
                          <div>
                            <p className="font-semibold flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {appointment.customerName}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {appointment.customerPhone}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {appointment.customerEmail}
                            </p>
                          </div>

                          {/* Dados do Veículo */}
                          <div>
                            <p className="text-sm flex items-center gap-1">
                              <Car className="h-4 w-4" />
                              {appointment.vehicleModel} {appointment.vehicleYear}
                            </p>
                            <p className="text-sm text-gray-600">
                              Placa: {appointment.vehiclePlate || 'Não informada'}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {CATEGORY_LABELS[appointment.vehicleCategory]}
                            </Badge>
                          </div>

                          {/* Horário e Valor */}
                          <div>
                            <p className="text-sm flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.preferredTime}
                            </p>
                            <p className="text-lg font-bold text-primary">
                              R$ {(appointment.finalPrice / 100).toFixed(2).replace('.', ',')}
                            </p>
                            {appointment.checkInTime && (
                              <p className="text-xs text-green-600">
                                Check-in: {format(parseISO(appointment.checkInTime), 'HH:mm')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {appointment.problemDescription && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                          <p className="font-medium mb-1">Descrição do problema:</p>
                          <p>{appointment.problemDescription}</p>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedAppointment(appointment);
                          setDetailsModalOpen(true);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>

                        {appointment.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(appointment, 'confirmed')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(appointment, 'cancelled')}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          </>
                        )}

                        {appointment.status === 'confirmed' && !appointment.checkInTime && (
                          <DropdownMenuItem onClick={() => handleCheckIn(appointment)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Fazer Check-in
                          </DropdownMenuItem>
                        )}

                        {appointment.checkInTime && appointment.status === 'in_progress' && (
                          <DropdownMenuItem onClick={() => handleCheckOut(appointment)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Fazer Check-out
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Enviar Mensagem
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Visualize todas as informações do agendamento de diagnóstico selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <p className="font-medium">{selectedAppointment.customerName}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={`${STATUS_CONFIG[selectedAppointment.status].color} text-white`}>
                    {STATUS_CONFIG[selectedAppointment.status].label}
                  </Badge>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <p>{selectedAppointment.customerPhone}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p>{selectedAppointment.customerEmail}</p>
                </div>
                <div>
                  <Label>Veículo</Label>
                  <p>{selectedAppointment.vehicleModel} {selectedAppointment.vehicleYear}</p>
                </div>
                <div>
                  <Label>Placa</Label>
                  <p>{selectedAppointment.vehiclePlate || 'Não informada'}</p>
                </div>
                <div>
                  <Label>Data/Hora</Label>
                  <p>{format(parseISO(selectedAppointment.preferredDate), 'dd/MM/yyyy')} às {selectedAppointment.preferredTime}</p>
                </div>
                <div>
                  <Label>Valor</Label>
                  <p className="font-bold text-primary">
                    R$ {(selectedAppointment.finalPrice / 100).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {selectedAppointment.problemDescription && (
                <div>
                  <Label>Descrição do Problema</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded">{selectedAppointment.problemDescription}</p>
                </div>
              )}

              {selectedAppointment.serviceNotes && (
                <div>
                  <Label>Observações do Atendimento</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded">{selectedAppointment.serviceNotes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Check-out */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Atendimento</DialogTitle>
            <DialogDescription>
              Adicione observações sobre o atendimento realizado
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Observações do Serviço</Label>
            <Textarea
              placeholder="Descreva o que foi identificado e realizado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmCheckOut}>
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}