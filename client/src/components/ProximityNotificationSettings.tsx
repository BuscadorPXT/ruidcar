import { useState } from 'react';
import { Bell, BellOff, Settings, MapPin, Clock, Hash, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useProximityNotifications } from '@/hooks/use-proximity-notifications';

interface ProximityNotificationSettingsProps {
  workshops?: any[];
  className?: string;
}

export default function ProximityNotificationSettings({
  workshops = [],
  className = ''
}: ProximityNotificationSettingsProps) {
  const { toast } = useToast();
  const {
    isEnabled,
    isWatching,
    hasPermission,
    settings,
    status,
    initialize,
    startWatching,
    stopWatching,
    updateSettings,
    clearHistory
  } = useProximityNotifications();

  const [isInitializing, setIsInitializing] = useState(false);

  // Handle toggle do serviço
  const handleToggleService = async (enabled: boolean) => {
    if (enabled && !hasPermission) {
      setIsInitializing(true);
      const initialized = await initialize();
      setIsInitializing(false);

      if (!initialized) {
        toast({
          title: '⚠️ Permissão negada',
          description: 'Não foi possível ativar as notificações. Verifique as permissões do navegador.',
          variant: 'destructive'
        });
        return;
      }
    }

    updateSettings({ enabled });

    if (enabled && workshops.length > 0) {
      const watching = await startWatching(workshops);
      if (watching) {
        toast({
          title: '🔔 Notificações ativadas',
          description: 'Você será notificado quando estiver próximo a oficinas RuidCar.'
        });
      }
    } else if (!enabled) {
      stopWatching();
      toast({
        title: '🔕 Notificações desativadas',
        description: 'Você não receberá mais notificações de proximidade.'
      });
    }
  };

  // Handle mudança de raio
  const handleRadiusChange = (value: number[]) => {
    updateSettings({ radiusKm: value[0] });
  };

  // Handle mudança de limite de notificações
  const handleNotificationLimitChange = (value: number[]) => {
    updateSettings({ maxNotificationsPerDay: value[0] });
  };

  // Handle limpeza de histórico
  const handleClearHistory = () => {
    clearHistory();
    toast({
      title: '🗑️ Histórico limpo',
      description: 'O histórico de notificações foi removido.'
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-400" />
          )}
          Notificações de Proximidade
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status geral */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">
              Ativar notificações de proximidade
            </Label>
            <p className="text-sm text-muted-foreground">
              Receba alertas quando estiver próximo a oficinas RuidCar
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggleService}
            disabled={isInitializing}
          />
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={hasPermission ? "default" : "destructive"}>
            {hasPermission ? "✅ Permissão concedida" : "❌ Sem permissão"}
          </Badge>
          <Badge variant={isWatching ? "default" : "secondary"}>
            {isWatching ? "📍 Monitorando" : "⏸️ Pausado"}
          </Badge>
          <Badge variant="outline">
            📊 {status.todayCount || 0}/{settings?.maxNotificationsPerDay || 5} hoje
          </Badge>
        </div>

        {/* Configurações avançadas - só mostrar se ativado */}
        {isEnabled && (
          <div className="space-y-4 pt-4 border-t">
            {/* Raio de proximidade */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Label className="font-medium">
                  Raio de proximidade: {settings?.radiusKm || 2}km
                </Label>
              </div>
              <Slider
                value={[settings?.radiusKm || 2]}
                onValueChange={handleRadiusChange}
                max={5}
                min={0.5}
                step={0.5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Distância mínima para receber notificações
              </p>
            </div>

            {/* Limite de notificações por dia */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                <Label className="font-medium">
                  Máximo por dia: {settings?.maxNotificationsPerDay || 5}
                </Label>
              </div>
              <Slider
                value={[settings?.maxNotificationsPerDay || 5]}
                onValueChange={handleNotificationLimitChange}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Evita spam de notificações
              </p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {status.notificationCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total de notificações</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {status.todayCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">Hoje</p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                className="flex-1"
                disabled={!status.notificationCount}
              >
                <Trash className="h-4 w-4 mr-2" />
                Limpar histórico
              </Button>
            </div>
          </div>
        )}

        {/* Aviso sobre permissões */}
        {!hasPermission && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Permissões necessárias</p>
                <p className="text-yellow-700 mt-1">
                  Para receber notificações de proximidade, você precisa:
                </p>
                <ul className="list-disc list-inside mt-2 text-yellow-700 space-y-1">
                  <li>Permitir notificações do navegador</li>
                  <li>Permitir acesso à localização</li>
                  <li>Manter a aba/app aberto em background</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Debug info (só em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Debug Info
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}