import { useState, useEffect } from 'react';
import {
  Settings2,
  Clock,
  Calendar,
  Bell,
  AlertCircle,
  Check,
  Info,
  Shield,
  Timer,
  Ban
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface DiagnosticSettings {
  id?: number;
  workshopId: number;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  cancellationHours: number;
  noShowTolerance: number;
  autoConfirm: boolean;
  sendReminders: boolean;
  reminderHours: number;
  requirePaymentConfirmation: boolean;
  allowReschedule: boolean;
  rescheduleHours: number;
  maxReschedules: number;
  blockRepeatedNoShows: boolean;
  noShowLimit: number;
  requireConsent: boolean;
  updatedAt?: string;
}

interface GeneralSettingsProps {
  workshopId: number;
}

export default function GeneralSettings({ workshopId }: GeneralSettingsProps) {
  const [formData, setFormData] = useState<DiagnosticSettings>({
    workshopId,
    minAdvanceHours: 2,
    maxAdvanceDays: 30,
    cancellationHours: 24,
    noShowTolerance: 15,
    autoConfirm: false,
    sendReminders: true,
    reminderHours: 24,
    requirePaymentConfirmation: false,
    allowReschedule: true,
    rescheduleHours: 12,
    maxReschedules: 2,
    blockRepeatedNoShows: true,
    noShowLimit: 3,
    requireConsent: true
  });

  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar configurações
  const { data: settings, isLoading } = useQuery({
    queryKey: ['diagnostic-settings', workshopId],
    queryFn: async () => {
      const response = await fetch('/api/workshop/diagnostic/settings', {
        headers: {
          'x-workshop-id': workshopId.toString()
        }
      });

      if (!response.ok) {
        // Se não existir configurações, retorna valores padrão
        if (response.status === 404) {
          return formData;
        }
        throw new Error('Erro ao buscar configurações');
      }

      const result = await response.json();
      return result.data as DiagnosticSettings;
    }
  });

  // Atualizar o formulário quando os dados chegarem
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Detectar mudanças
  useEffect(() => {
    if (settings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(formData);
      setHasChanges(changed);
    }
  }, [formData, settings]);

  // Salvar configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: DiagnosticSettings) => {
      const response = await fetch('/api/workshop/diagnostic/settings', {
        method: settings?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workshop-id': workshopId.toString()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar configurações');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-settings'] });
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso'
      });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  const handleReset = () => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botões de ação */}
      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Você tem alterações não salvas</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
              >
                Descartar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saveSettingsMutation.isPending}
              >
                Salvar Alterações
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Configurações de Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configurações de Agendamento
          </CardTitle>
          <CardDescription>
            Defina as regras para criação de agendamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Antecedência Mínima */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4" />
              Antecedência Mínima (horas)
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.minAdvanceHours]}
                onValueChange={(value) => setFormData({ ...formData, minAdvanceHours: value[0] })}
                max={48}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="w-16 text-right font-medium">
                {formData.minAdvanceHours}h
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Clientes devem agendar com pelo menos {formData.minAdvanceHours} horas de antecedência
            </p>
          </div>

          {/* Antecedência Máxima */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              Antecedência Máxima (dias)
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.maxAdvanceDays]}
                onValueChange={(value) => setFormData({ ...formData, maxAdvanceDays: value[0] })}
                max={90}
                min={7}
                step={1}
                className="flex-1"
              />
              <span className="w-16 text-right font-medium">
                {formData.maxAdvanceDays} dias
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Clientes podem agendar até {formData.maxAdvanceDays} dias no futuro
            </p>
          </div>

          {/* Auto-confirmação */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Confirmação Automática
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Confirmar agendamentos automaticamente sem revisão manual
              </p>
            </div>
            <Switch
              checked={formData.autoConfirm}
              onCheckedChange={(checked) => setFormData({ ...formData, autoConfirm: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Cancelamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Políticas de Cancelamento
          </CardTitle>
          <CardDescription>
            Configure as regras para cancelamentos e reagendamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prazo de Cancelamento */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              Prazo para Cancelamento (horas)
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.cancellationHours]}
                onValueChange={(value) => setFormData({ ...formData, cancellationHours: value[0] })}
                max={72}
                min={2}
                step={1}
                className="flex-1"
              />
              <span className="w-16 text-right font-medium">
                {formData.cancellationHours}h
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Clientes podem cancelar até {formData.cancellationHours} horas antes do agendamento
            </p>
          </div>

          {/* Permitir Reagendamento */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Permitir Reagendamento
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Clientes podem reagendar seus compromissos
              </p>
            </div>
            <Switch
              checked={formData.allowReschedule}
              onCheckedChange={(checked) => setFormData({ ...formData, allowReschedule: checked })}
            />
          </div>

          {formData.allowReschedule && (
            <>
              {/* Prazo para Reagendamento */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Timer className="h-4 w-4" />
                  Prazo para Reagendamento (horas)
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[formData.rescheduleHours]}
                    onValueChange={(value) => setFormData({ ...formData, rescheduleHours: value[0] })}
                    max={48}
                    min={2}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-16 text-right font-medium">
                    {formData.rescheduleHours}h
                  </span>
                </div>
              </div>

              {/* Máximo de Reagendamentos */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Máximo de Reagendamentos
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={formData.maxReschedules}
                    onChange={(e) => setFormData({ ...formData, maxReschedules: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="5"
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">
                    vezes por agendamento
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações e Lembretes
          </CardTitle>
          <CardDescription>
            Configure as notificações para clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enviar Lembretes */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Enviar Lembretes
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Enviar lembretes automáticos antes do agendamento
              </p>
            </div>
            <Switch
              checked={formData.sendReminders}
              onCheckedChange={(checked) => setFormData({ ...formData, sendReminders: checked })}
            />
          </div>

          {formData.sendReminders && (
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                Antecedência do Lembrete (horas)
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[formData.reminderHours]}
                  onValueChange={(value) => setFormData({ ...formData, reminderHours: value[0] })}
                  max={72}
                  min={2}
                  step={1}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">
                  {formData.reminderHours}h
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Lembrete será enviado {formData.reminderHours} horas antes do agendamento
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações de No-Show */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Proteção contra No-Show
          </CardTitle>
          <CardDescription>
            Configure as regras para clientes que não comparecem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tolerância de No-Show */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4" />
              Tolerância de Atraso (minutos)
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.noShowTolerance]}
                onValueChange={(value) => setFormData({ ...formData, noShowTolerance: value[0] })}
                max={30}
                min={5}
                step={5}
                className="flex-1"
              />
              <span className="w-16 text-right font-medium">
                {formData.noShowTolerance} min
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Cliente será marcado como no-show após {formData.noShowTolerance} minutos de atraso
            </p>
          </div>

          {/* Bloquear No-Shows Repetidos */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label className="flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Bloquear No-Shows Repetidos
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Bloquear clientes com múltiplos no-shows
              </p>
            </div>
            <Switch
              checked={formData.blockRepeatedNoShows}
              onCheckedChange={(checked) => setFormData({ ...formData, blockRepeatedNoShows: checked })}
            />
          </div>

          {formData.blockRepeatedNoShows && (
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Ban className="h-4 w-4" />
                Limite de No-Shows
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={formData.noShowLimit}
                  onChange={(e) => setFormData({ ...formData, noShowLimit: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="10"
                  className="w-24"
                />
                <span className="text-sm text-gray-500">
                  no-shows para bloquear
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Cliente será bloqueado após {formData.noShowLimit} no-shows
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LGPD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Conformidade LGPD
          </CardTitle>
          <CardDescription>
            Configurações de privacidade e proteção de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Requer Consentimento */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Exigir Consentimento de Dados
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Cliente deve aceitar os termos de uso de dados pessoais
              </p>
            </div>
            <Switch
              checked={formData.requireConsent}
              onCheckedChange={(checked) => setFormData({ ...formData, requireConsent: checked })}
            />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              O sistema armazena apenas dados essenciais para o agendamento e segue todas
              as diretrizes da LGPD para proteção de dados pessoais.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-2 pb-4">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || saveSettingsMutation.isPending}
        >
          Descartar Alterações
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saveSettingsMutation.isPending}
        >
          <Check className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}