import { useState } from 'react';
import {
  CalendarOff,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  MapPin,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentException {
  id?: number;
  workshopId: number;
  date: string;
  type: 'holiday' | 'vacation' | 'maintenance' | 'other';
  reason: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  affectedSlots?: number;
  createdAt?: string;
}

interface ExceptionsManagementProps {
  workshopId: number;
}

const EXCEPTION_TYPES = {
  holiday: {
    label: 'Feriado',
    color: 'bg-blue-500',
    icon: Calendar
  },
  vacation: {
    label: 'Férias',
    color: 'bg-purple-500',
    icon: MapPin
  },
  maintenance: {
    label: 'Manutenção',
    color: 'bg-orange-500',
    icon: Clock
  },
  other: {
    label: 'Outro',
    color: 'bg-gray-500',
    icon: Info
  }
};

export default function ExceptionsManagement({ workshopId }: ExceptionsManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingException, setEditingException] = useState<AppointmentException | null>(null);
  const [formData, setFormData] = useState<AppointmentException>({
    workshopId,
    date: '',
    type: 'holiday',
    reason: '',
    isFullDay: true,
    startTime: '08:00',
    endTime: '18:00'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar exceções
  const { data: exceptions = [], isLoading } = useQuery({
    queryKey: ['diagnostic-exceptions', workshopId],
    queryFn: async () => {
      const response = await fetch('/api/workshop/diagnostic/exceptions', {
        headers: {
          'x-workshop-id': workshopId.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar exceções');
      }

      const result = await response.json();
      return result.data as AppointmentException[];
    }
  });

  // Criar exceção
  const createExceptionMutation = useMutation({
    mutationFn: async (data: AppointmentException) => {
      const response = await fetch('/api/workshop/diagnostic/exceptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workshop-id': workshopId.toString()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar exceção');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-exceptions'] });
      toast({
        title: 'Sucesso',
        description: 'Exceção adicionada com sucesso'
      });
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Deletar exceção
  const deleteExceptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/workshop/diagnostic/exceptions/${id}`, {
        method: 'DELETE',
        headers: {
          'x-workshop-id': workshopId.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao remover exceção');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-exceptions'] });
      toast({
        title: 'Sucesso',
        description: 'Exceção removida com sucesso'
      });
    }
  });

  const handleOpenModal = (exception?: AppointmentException) => {
    if (exception) {
      setEditingException(exception);
      setFormData(exception);
    } else {
      setEditingException(null);
      setFormData({
        workshopId,
        date: '',
        type: 'holiday',
        reason: '',
        isFullDay: true,
        startTime: '08:00',
        endTime: '18:00'
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingException(null);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    } else {
      const selectedDate = parseISO(formData.date);
      const today = startOfDay(new Date());

      if (isBefore(selectedDate, today)) {
        newErrors.date = 'Data deve ser futura';
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Motivo é obrigatório';
    }

    if (!formData.isFullDay) {
      if (!formData.startTime || !formData.endTime) {
        newErrors.time = 'Horários são obrigatórios para exceções parciais';
      } else if (formData.startTime >= formData.endTime) {
        newErrors.time = 'Horário de início deve ser anterior ao horário de fim';
      }
    }

    // Verificar conflito com outras exceções
    const conflictingException = exceptions.find(exc => {
      if (editingException && exc.id === editingException.id) return false;
      return exc.date === formData.date;
    });

    if (conflictingException) {
      newErrors.conflict = 'Já existe uma exceção para esta data';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    createExceptionMutation.mutate(formData);
  };

  const handleDelete = (exception: AppointmentException) => {
    if (!exception.id) return;

    const exceptionDate = format(parseISO(exception.date), "d 'de' MMMM", { locale: ptBR });
    if (confirm(`Deseja remover a exceção do dia ${exceptionDate}?`)) {
      deleteExceptionMutation.mutate(exception.id);
    }
  };

  // Agrupar exceções por mês
  const groupedExceptions = exceptions.reduce((acc, exception) => {
    const monthYear = format(parseISO(exception.date), 'yyyy-MM');
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(exception);
    return acc;
  }, {} as Record<string, AppointmentException[]>);

  // Ordenar exceções futuras primeiro
  const futureExceptions = exceptions.filter(exc =>
    isAfter(parseISO(exc.date), new Date())
  );

  const pastExceptions = exceptions.filter(exc =>
    isBefore(parseISO(exc.date), new Date())
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Exceções de Agenda</h3>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Exceção
          </Button>
        </div>

        {exceptions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CalendarOff className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma exceção configurada</p>
              <p className="text-sm text-gray-400 mt-1">
                Adicione feriados, férias ou outros dias especiais
              </p>
              <Button
                onClick={() => handleOpenModal()}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Configurar Primeira Exceção
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Exceções Futuras */}
            {futureExceptions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Próximas Exceções</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {futureExceptions.map((exception) => {
                    const ExceptionIcon = EXCEPTION_TYPES[exception.type].icon;
                    return (
                      <Card key={exception.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <ExceptionIcon className="h-4 w-4 text-gray-500" />
                                <Badge className={`${EXCEPTION_TYPES[exception.type].color} text-white text-xs`}>
                                  {EXCEPTION_TYPES[exception.type].label}
                                </Badge>
                              </div>
                              <p className="font-medium">
                                {format(parseISO(exception.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{exception.reason}</p>
                              {!exception.isFullDay && (
                                <p className="text-xs text-gray-500 mt-1">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {exception.startTime} - {exception.endTime}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(exception)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Exceções Passadas */}
            {pastExceptions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Exceções Passadas</h4>
                <div className="space-y-2 opacity-60">
                  {pastExceptions.slice(0, 3).map((exception) => (
                    <div key={exception.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {EXCEPTION_TYPES[exception.type].label}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {format(parseISO(exception.date), "d 'de' MMM", { locale: ptBR })}
                        </span>
                        <span className="text-sm text-gray-500">- {exception.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Exceções bloqueiam agendamentos nas datas configuradas. Clientes não poderão
            agendar diagnósticos nos dias marcados como exceção.
          </AlertDescription>
        </Alert>
      </div>

      {/* Modal de Adicionar/Editar Exceção */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingException ? 'Editar Exceção' : 'Adicionar Nova Exceção'}
            </DialogTitle>
            <DialogDescription>
              Configure dias em que o serviço não estará disponível
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Data */}
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              {errors.date && (
                <p className="text-sm text-red-500 mt-1">{errors.date}</p>
              )}
            </div>

            {/* Tipo */}
            <div>
              <Label>Tipo de Exceção</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXCEPTION_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${config.color} text-white text-xs`}>
                          {config.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Motivo */}
            <div>
              <Label>Motivo</Label>
              <Textarea
                placeholder="Ex: Feriado Nacional - Proclamação da República"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={2}
              />
              {errors.reason && (
                <p className="text-sm text-red-500 mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Dia Inteiro */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fullDay"
                checked={formData.isFullDay}
                onChange={(e) => setFormData({ ...formData, isFullDay: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="fullDay">Dia inteiro</Label>
            </div>

            {/* Horários (se não for dia inteiro) */}
            {!formData.isFullDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horário Inicial</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Horário Final</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
                {errors.time && (
                  <p className="text-sm text-red-500 col-span-2">{errors.time}</p>
                )}
              </div>
            )}

            {errors.conflict && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.conflict}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createExceptionMutation.isPending}
            >
              {editingException ? 'Salvar Alterações' : 'Adicionar Exceção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}