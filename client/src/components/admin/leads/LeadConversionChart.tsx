import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ConversionData {
  daily?: Array<{
    date: string;
    leads: number;
    conversions: number;
    rate: number;
  }>;
  summary?: {
    totalLeads: number;
    totalConversions: number;
    overallRate: number;
    trend: number;
  };
  bySource?: Array<{
    source: string;
    leads: number;
    conversions: number;
    rate: number;
  }>;
}

interface LeadConversionChartProps {
  data?: ConversionData;
  detailed?: boolean;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function LeadConversionChart({ data, detailed = false }: LeadConversionChartProps) {
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
                {entry.name.includes('Taxa') ? `${entry.value}%` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Main conversion chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Taxa de Conversão</CardTitle>
              <CardDescription>
                Evolução das conversões ao longo do tempo
              </CardDescription>
            </div>
            {data.summary && (
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {data.summary.overallRate.toFixed(1)}%
                  </span>
                  {data.summary.trend !== 0 && (
                    <Badge variant={data.summary.trend > 0 ? 'default' : 'destructive'}>
                      {data.summary.trend > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(data.summary.trend).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.totalConversions} de {data.summary.totalLeads} leads
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.daily && data.daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.daily}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorLeads)"
                />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  name="Conversões"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorConversions)"
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Taxa %"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  yAxisId="right"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Sem dados para exibir
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion by source - shown only in detailed view */}
      {detailed && data.bySource && data.bySource.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversão por Fonte</CardTitle>
            <CardDescription>
              Taxa de conversão segmentada por origem do lead
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.bySource}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="source"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="leads" name="Leads" fill="#3b82f6" />
                <Bar dataKey="conversions" name="Conversões" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>

            {/* Conversion rates by source */}
            <div className="mt-4 space-y-2">
              {data.bySource.map((source) => (
                <div key={source.source} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{source.source}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${source.rate}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {source.rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}