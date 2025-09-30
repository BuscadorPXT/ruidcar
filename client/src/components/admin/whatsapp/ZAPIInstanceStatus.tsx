import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Smartphone,
  Wifi,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Signal
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface InstanceStatus {
  connected: boolean;
  phone?: string;
  battery?: number;
  instanceId: string;
  lastSeen?: string;
  qrCode?: string;
}

export default function ZAPIInstanceStatus() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['zapi-instance-status'],
    queryFn: async (): Promise<InstanceStatus> => {
      const response = await fetch('/api/whatsapp/instances');
      if (!response.ok) {
        throw new Error('Failed to fetch instance status');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Status da Instância Z-API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Verificando status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = status?.connected;
  const statusColor = isConnected ? 'green' : 'red';
  const statusText = isConnected ? 'Conectado' : 'Desconectado';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Status da Instância Z-API
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Monitoramento em tempo real da conexão WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-${statusColor}-100`}>
              {isConnected ? (
                <CheckCircle className={`h-5 w-5 text-${statusColor}-600`} />
              ) : (
                <AlertCircle className={`h-5 w-5 text-${statusColor}-600`} />
              )}
            </div>
            <div>
              <p className="font-medium">Conexão WhatsApp</p>
              <p className="text-sm text-gray-600">
                {isConnected ? 'Instância ativa e funcionando' : 'Instância desconectada'}
              </p>
            </div>
          </div>
          <Badge
            variant={isConnected ? 'default' : 'destructive'}
            className={`${isConnected ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
          >
            {statusText}
          </Badge>
        </div>

        {/* Instance Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Instance ID:</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              {status?.instanceId || '3E3EFBCA3E13C17E04F83E61E96978DB'}
            </code>
          </div>

          {status?.phone && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Número conectado:</span>
              <span className="font-mono">{status.phone}</span>
            </div>
          )}

          {status?.battery && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Bateria:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      status.battery > 50 ? 'bg-green-500' :
                      status.battery > 20 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${status.battery}%` }}
                  />
                </div>
                <span className="text-xs">{status.battery}%</span>
              </div>
            </div>
          )}

          {status?.lastSeen && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Última atividade:</span>
              <span className="text-xs">
                {new Date(status.lastSeen).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {/* Connection Health */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Signal className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Saúde da conexão:</span>
            <Badge variant="outline" className="text-xs">
              {isConnected ? 'Excelente' : 'Sem conexão'}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" size="sm" className="flex-1">
            <Wifi className="h-4 w-4 mr-2" />
            Testar Conexão
          </Button>
          {!isConnected && (
            <Button variant="default" size="sm" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Reconectar
            </Button>
          )}
        </div>

        {/* QR Code if needed */}
        {status?.qrCode && !isConnected && (
          <div className="pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Escaneie o QR Code com seu WhatsApp:
              </p>
              <div className="flex justify-center">
                <img
                  src={status.qrCode}
                  alt="QR Code para conexão WhatsApp"
                  className="w-48 h-48 border rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}