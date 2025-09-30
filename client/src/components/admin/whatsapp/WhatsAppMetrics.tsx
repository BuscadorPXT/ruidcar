import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  MessageSquare,
  Clock,
  Target,
  BarChart3,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface WhatsAppMetrics {
  today: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  thisWeek: {
    sent: number;
    delivered: number;
    responseRate: number;
  };
  avgResponseTime: number; // in minutes
  topTemplate: {
    name: string;
    usage: number;
  };
}

export default function WhatsAppMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['whatsapp-metrics'],
    queryFn: async (): Promise<WhatsAppMetrics> => {
      const response = await fetch('/api/whatsapp/metrics');
      if (!response.ok) {
        // Return mock data for now
        return {
          today: { sent: 0, delivered: 0, read: 0, failed: 0 },
          thisWeek: { sent: 0, delivered: 0, responseRate: 0 },
          avgResponseTime: 0,
          topTemplate: { name: 'Nenhum template usado ainda', usage: 0 }
        };
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Métricas WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const deliveryRate = metrics?.today.sent > 0
    ? ((metrics.today.delivered / metrics.today.sent) * 100).toFixed(1)
    : '0.0';

  const readRate = metrics?.today.delivered > 0
    ? ((metrics.today.read / metrics.today.delivered) * 100).toFixed(1)
    : '0.0';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Métricas WhatsApp
        </CardTitle>
        <CardDescription>
          Estatísticas de desempenho das mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Stats */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Estatísticas de Hoje
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {metrics?.today.sent || 0}
              </p>
              <p className="text-xs text-blue-700">Enviadas</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {metrics?.today.delivered || 0}
              </p>
              <p className="text-xs text-green-700">Entregues</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {metrics?.today.read || 0}
              </p>
              <p className="text-xs text-purple-700">Lidas</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {metrics?.today.failed || 0}
              </p>
              <p className="text-xs text-red-700">Falhas</p>
            </div>
          </div>
        </div>

        {/* Performance Rates */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Taxa de Performance
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taxa de Entrega:</span>
              <Badge variant="outline" className={
                parseFloat(deliveryRate) > 90 ? 'bg-green-50 text-green-700 border-green-200' :
                parseFloat(deliveryRate) > 75 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-red-50 text-red-700 border-red-200'
              }>
                {deliveryRate}%
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taxa de Leitura:</span>
              <Badge variant="outline" className={
                parseFloat(readRate) > 70 ? 'bg-green-50 text-green-700 border-green-200' :
                parseFloat(readRate) > 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-red-50 text-red-700 border-red-200'
              }>
                {readRate}%
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tempo Médio de Resposta:</span>
              <Badge variant="outline">
                {metrics?.avgResponseTime ? `${metrics.avgResponseTime}min` : 'N/A'}
              </Badge>
            </div>
          </div>
        </div>

        {/* This Week Summary */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Esta Semana
          </h4>

          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mensagens enviadas:</span>
              <span className="font-medium">{metrics?.thisWeek.sent || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa de resposta:</span>
              <span className="font-medium">
                {metrics?.thisWeek.responseRate ? `${metrics.thisWeek.responseRate}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Template */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Template Mais Usado
          </h4>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-sm">{metrics?.topTemplate.name}</p>
            <p className="text-xs text-gray-600">
              {metrics?.topTemplate.usage} usos {metrics?.topTemplate.usage > 0 ? 'esta semana' : ''}
            </p>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm text-gray-700 mb-2">💡 Insights</h4>
          <div className="text-xs text-gray-600 space-y-1">
            {metrics?.today.sent === 0 ? (
              <p>• Nenhuma mensagem enviada hoje. Que tal testar um template?</p>
            ) : (
              <>
                {parseFloat(deliveryRate) > 90 && (
                  <p>• Excelente taxa de entrega! Continue assim.</p>
                )}
                {parseFloat(readRate) < 50 && metrics?.today.delivered > 0 && (
                  <p>• Taxa de leitura baixa. Considere melhorar os títulos das mensagens.</p>
                )}
                {metrics?.today.failed > 0 && (
                  <p>• Algumas mensagens falharam. Verifique os números de telefone.</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}