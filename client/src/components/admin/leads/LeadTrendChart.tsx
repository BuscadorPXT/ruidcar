import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TrendData {
  historical?: Array<{
    date: string;
    leads: number;
    conversions: number;
    avgResponseTime: number;
    conversionRate: number;
  }>;
  forecast?: Array<{
    date: string;
    predicted: number;
    upperBound: number;
    lowerBound: number;
  }>;
  summary?: {
    trend: 'up' | 'down' | 'stable';
    percentChange: number;
    avgGrowthRate: number;
    seasonality: string;
  };
}

interface LeadTrendChartProps {
  data?: TrendData;
  detailed?: boolean;
}

export default function LeadTrendChart({ data, detailed = false }: LeadTrendChartProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">
                {entry.dataKey === 'conversionRate' ? `${entry.value}%` :
                 entry.dataKey === 'avgResponseTime' ? `${entry.value}h` :
                 entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = () => {
    if (!data.summary) return null;

    if (data.summary.trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (data.summary.trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Activity className="h-4 w-4 text-yellow-600" />;
  };

  const getTrendColor = () => {
    if (!data.summary) return 'secondary';
    if (data.summary.trend === 'up') return 'default';
    if (data.summary.trend === 'down') return 'destructive';
    return 'secondary';
  };

  // Combine historical and forecast data for continuous chart
  const combinedData = [
    ...(data.historical || []),
    ...(data.forecast?.map(f => ({
      date: f.date,
      predicted: f.predicted,
      upperBound: f.upperBound,
      lowerBound: f.lowerBound
    })) || [])
  ];

  return (
    <>
      {/* Main trend chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tendências e Análise Temporal</CardTitle>
              <CardDescription>
                Evolução histórica e previsões
              </CardDescription>
            </div>
            {data.summary && (
              <div className="flex items-center gap-2">
                {getTrendIcon()}
                <Badge variant={getTrendColor()}>
                  {data.summary.percentChange > 0 ? '+' : ''}{data.summary.percentChange.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.historical && data.historical.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.historical}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  name="Conversões"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                {detailed && (
                  <Line
                    type="monotone"
                    dataKey="conversionRate"
                    name="Taxa de Conversão"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    yAxisId="right"
                  />
                )}
                {detailed && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Sem dados para exibir
            </div>
          )}

          {/* Summary statistics */}
          {data.summary && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Tendência</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon()}
                  <span className="text-sm font-medium capitalize">
                    {data.summary.trend === 'up' ? 'Crescente' :
                     data.summary.trend === 'down' ? 'Decrescente' : 'Estável'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa de Crescimento</p>
                <p className="text-sm font-medium mt-1">
                  {data.summary.avgGrowthRate > 0 ? '+' : ''}{data.summary.avgGrowthRate.toFixed(1)}% ao mês
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sazonalidade</p>
                <p className="text-sm font-medium mt-1">{data.summary.seasonality}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast chart - shown only in detailed view */}
      {detailed && data.forecast && data.forecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previsão de Leads</CardTitle>
            <CardDescription>
              Projeção para os próximos períodos com intervalo de confiança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.forecast}>
                <defs>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {/* Confidence interval */}
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stackId="1"
                  stroke="none"
                  fill="#e0e7ff"
                  fillOpacity={0.3}
                  name="Limite Superior"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stackId="2"
                  stroke="none"
                  fill="#e0e7ff"
                  fillOpacity={0.3}
                  name="Limite Inferior"
                />

                {/* Main prediction line */}
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPredicted)"
                  name="Previsão"
                />

                {/* Reference line for today */}
                <ReferenceLine
                  x={data.historical?.[data.historical.length - 1]?.date}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label="Hoje"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Response time trends - shown only in detailed view */}
      {detailed && data.historical && data.historical.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tempo de Resposta</CardTitle>
            <CardDescription>
              Evolução do tempo médio de resposta aos leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.historical}>
                <defs>
                  <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="avgResponseTime"
                  stroke="#14b8a6"
                  fillOpacity={1}
                  fill="url(#colorResponse)"
                  name="Tempo de Resposta (h)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}