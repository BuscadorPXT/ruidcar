import { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Users,
  Calendar,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AppointmentSlot {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  bufferMinutes: number;
  isActive: boolean;
}

interface SlotManagementProps {
  slots: AppointmentSlot[];
  workshopId: number;
}

const WEEKDAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export default function SlotManagement({ slots, workshopId }: SlotManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AppointmentSlot | null>(null);
  const [formData, setFormData] = useState<AppointmentSlot>({
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '18:00',
    capacity: 1,
    bufferMinutes: 15,
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutations
  const createSlotMutation = useMutation({
    mutationFn: async (data: AppointmentSlot) => {
      const response = await fetch('/api/workshop/diagnostic/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workshop-id': workshopId.toString()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar slot');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-slots'] });
      toast({
        title: 'Sucesso',
        description: 'Horário adicionado com sucesso'
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

  const updateSlotMutation = useMutation({
    mutationFn: async (data: AppointmentSlot) => {
      const response = await fetch(`/api/workshop/diagnostic/slots/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-workshop-id': workshopId.toString()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar slot');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-slots'] });
      toast({
        title: 'Sucesso',
        description: 'Horário atualizado com sucesso'
      });
      handleCloseModal();
    }
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/workshop/diagnostic/slots/${id}`, {
        method: 'DELETE',
        headers: {
          'x-workshop-id': workshopId.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao remover slot');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-slots'] });
      toast({
        title: 'Sucesso',
        description: 'Horário removido com sucesso'
      });
    }
  });

  const handleOpenModal = (slot?: AppointmentSlot) => {
    if (slot) {
      setEditingSlot(slot);
      setFormData(slot);
    } else {
      setEditingSlot(null);
      setFormData({
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '18:00',
        capacity: 1,
        bufferMinutes: 15,
        isActive: true
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSlot(null);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.startTime >= formData.endTime) {
      newErrors.time = 'Horário de início deve ser anterior ao horário de fim';
    }

    if (formData.capacity < 1 || formData.capacity > 10) {
      newErrors.capacity = 'Capacidade deve ser entre 1 e 10';
    }

    if (formData.bufferMinutes < 0 || formData.bufferMinutes > 60) {
      newErrors.buffer = 'Buffer deve ser entre 0 e 60 minutos';
    }

    // Verificar conflito com outros slots
    const conflictingSlot = slots.find(slot => {
      if (editingSlot && slot.id === editingSlot.id) return false;
      if (slot.dayOfWeek !== formData.dayOfWeek) return false;

      return (
        (formData.startTime >= slot.startTime && formData.startTime < slot.endTime) ||
        (formData.endTime > slot.startTime && formData.endTime <= slot.endTime) ||
        (formData.startTime <= slot.startTime && formData.endTime >= slot.endTime)
      );
    });

    if (conflictingSlot) {
      newErrors.conflict = 'Horário conflita com outro slot existente';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingSlot) {
      updateSlotMutation.mutate({ ...formData, id: editingSlot.id });
    } else {
      createSlotMutation.mutate(formData);
    }
  };

  const handleDelete = (slot: AppointmentSlot) => {
    if (!slot.id) return;

    if (confirm(`Deseja remover o horário de ${WEEKDAYS[slot.dayOfWeek]}?`)) {
      deleteSlotMutation.mutate(slot.id);
    }
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    const day = slot.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {} as Record<number, AppointmentSlot[]>);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Horários de Disponibilidade</h3>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Horário
          </Button>
        </div>

        {slots.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum horário configurado</p>
              <p className="text-sm text-gray-400 mt-1">
                Configure os horários disponíveis para agendamento
              </p>
              <Button
                onClick={() => handleOpenModal()}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Configurar Primeiro Horário
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groupedSlots).map(([day, daySlots]) => (
              <Card key={day}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {WEEKDAYS[parseInt(day)]}
                    <Badge variant="outline" className="ml-2">
                      {daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-sm font-medium">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {slot.capacity} {slot.capacity === 1 ? 'vaga' : 'vagas'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            Buffer: {slot.bufferMinutes}min
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenModal(slot)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(slot)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Configure horários recorrentes por dia da semana. Os agendamentos serão
            disponibilizados automaticamente nos horários configurados, respeitando a
            capacidade e o tempo de buffer entre atendimentos.
          </AlertDescription>
        </Alert>
      </div>

      {/* Modal de Adicionar/Editar Slot */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? 'Editar Horário' : 'Adicionar Novo Horário'}
            </DialogTitle>
            <DialogDescription>
              Configure um horário recorrente de disponibilidade
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Dia da Semana */}
            <div>
              <Label>Dia da Semana</Label>
              <Select
                value={formData.dayOfWeek.toString()}
                onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Horário Inicial</Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(value) => setFormData({ ...formData, startTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.slice(0, -1).map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Horário Final</Label>
                <Select
                  value={formData.endTime}
                  onValueChange={(value) => setFormData({ ...formData, endTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.slice(1).map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {errors.time && (
              <p className="text-sm text-red-500">{errors.time}</p>
            )}

            {/* Capacidade e Buffer */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacidade (vagas simultâneas)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                />
                {errors.capacity && (
                  <p className="text-sm text-red-500">{errors.capacity}</p>
                )}
              </div>

              <div>
                <Label>Buffer entre atendimentos (min)</Label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.bufferMinutes}
                  onChange={(e) => setFormData({ ...formData, bufferMinutes: parseInt(e.target.value) || 0 })}
                />
                {errors.buffer && (
                  <p className="text-sm text-red-500">{errors.buffer}</p>
                )}
              </div>
            </div>

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
              disabled={createSlotMutation.isPending || updateSlotMutation.isPending}
            >
              {editingSlot ? 'Salvar Alterações' : 'Adicionar Horário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}