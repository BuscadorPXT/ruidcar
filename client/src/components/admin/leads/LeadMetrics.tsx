import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricData {
  totalLeads: number;
  newLeads: number;
  conversions: number;
  conversionRate: number;
  avgResponseTime: number;
  avgDealSize: number;
  totalRevenue: number;
  leadVelocity: number;
  comparison?: {
    totalLeads: number;
    newLeads: number;
    conversions: number;
    conversionRate: number;
    avgResponseTime: number;
    avgDealSize: number;
    totalRevenue: number;
    leadVelocity: number;
  };
}

interface LeadMetricsProps {
  data?: MetricData;
  comparison?: boolean;
}

export default function LeadMetrics({ data, comparison }: LeadMetricsProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatChange = (change: number) => {
    const isPositive = change > 0;
    return {
      value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-green-600' : 'text-red-600'
    };
  };

  const metrics = [
    {
      title: 'Total de Leads',
      value: data.totalLeads,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      format: (v: number) => v.toLocaleString('pt-BR'),
      change: comparison ? calculateChange(data.totalLeads, data.comparison?.totalLeads) : null
    },
    {
      title: 'Novos Leads',
      value: data.newLeads,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      format: (v: number) => v.toLocaleString('pt-BR'),
      change: comparison ? calculateChange(data.newLeads, data.comparison?.newLeads) : null
    },
    {
      title: 'Conversões',
      value: data.conversions,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      format: (v: number) => v.toLocaleString('pt-BR'),
      change: comparison ? calculateChange(data.conversions, data.comparison?.conversions) : null
    },
    {
      title: 'Taxa de Conversão',
      value: data.conversionRate,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      format: (v: number) => `${v.toFixed(1)}%`,
      change: comparison ? calculateChange(data.conversionRate, data.comparison?.conversionRate) : null
    },
    {
      title: 'Tempo de Resposta',
      value: data.avgResponseTime,
      icon: Clock,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      format: (v: number) => `${v.toFixed(0)}h`,
      change: comparison ? calculateChange(data.avgResponseTime, data.comparison?.avgResponseTime) : null,
      invertChange: true // Lower is better
    },
    {
      title: 'Ticket Médio',
      value: data.avgDealSize,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: comparison ? calculateChange(data.avgDealSize, data.comparison?.avgDealSize) : null
    },
    {
      title: 'Receita Total',
      value: data.totalRevenue,
      icon: DollarSign,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: comparison ? calculateChange(data.totalRevenue, data.comparison?.totalRevenue) : null
    },
    {
      title: 'Velocidade de Leads',
      value: data.leadVelocity,
      icon: Activity,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      format: (v: number) => `${v.toFixed(1)}/dia`,
      change: comparison ? calculateChange(data.leadVelocity, data.comparison?.leadVelocity) : null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        let changeInfo = null;

        if (metric.change !== null) {
          const change = metric.invertChange ? -metric.change : metric.change;
          changeInfo = formatChange(change);
        }

        return (
          <Card key={metric.title} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-2 rounded-lg', metric.bgColor)}>
                  <Icon className={cn('h-5 w-5', metric.color)} />
                </div>
                {changeInfo && (
                  <div className="flex items-center gap-1">
                    <changeInfo.icon className={cn('h-4 w-4', changeInfo.color)} />
                    <span className={cn('text-sm font-medium', changeInfo.color)}>
                      {changeInfo.value}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <p className="text-2xl font-bold tracking-tight">
                  {metric.format(metric.value)}
                </p>
              </div>

              {comparison && data.comparison && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Período anterior: {metric.format(
                      data.comparison[metric.title === 'Total de Leads' ? 'totalLeads' :
                        metric.title === 'Novos Leads' ? 'newLeads' :
                        metric.title === 'Conversões' ? 'conversions' :
                        metric.title === 'Taxa de Conversão' ? 'conversionRate' :
                        metric.title === 'Tempo de Resposta' ? 'avgResponseTime' :
                        metric.title === 'Ticket Médio' ? 'avgDealSize' :
                        metric.title === 'Receita Total' ? 'totalRevenue' :
                        'leadVelocity']
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}