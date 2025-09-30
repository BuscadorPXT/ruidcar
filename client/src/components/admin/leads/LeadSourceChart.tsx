import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Globe, Phone, Mail, MessageSquare, Users, Megaphone } from 'lucide-react';

interface SourceData {
  sources?: Array<{
    name: string;
    value: number;
    percentage: number;
    icon?: string;
    quality: number; // Lead quality score 0-100
  }>;
  performance?: Array<{
    source: string;
    leads: number;
    conversions: number;
    avgScore: number;
    avgTime: number;
    roi: number;
  }>;
}

interface LeadSourceChartProps {
  data?: SourceData;
  detailed?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6b7280'];

const SOURCE_ICONS: Record<string, any> = {
  'Website': Globe,
  'WhatsApp': MessageSquare,
  'Telefone': Phone,
  'Email': Mail,
  'Indicação': Users,
  'Marketing': Megaphone,
};

export default function LeadSourceChart({ data, detailed = false }: LeadSourceChartProps) {
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          {payload.map((entry: any, index: number) => (
            <div key={index}>
              <p className="font-medium">{entry.name || entry.payload.name}</p>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.fill || entry.color }}
                />
                <span className="text-muted-foreground">Leads:</span>
                <span className="font-medium">{entry.value}</span>
              </div>
              {entry.payload.percentage && (
                <div className="text-sm text-muted-foreground">
                  {entry.payload.percentage.toFixed(1)}% do total
                </div>
              )}
              {entry.payload.quality !== undefined && (
                <div className="text-sm text-muted-foreground">
                  Qualidade: {entry.payload.quality}/100
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <>
      {/* Main source distribution chart */}
      <Card>
        <CardHeader>
          <CardTitle>Origem dos Leads</CardTitle>
          <CardDescription>
            Distribuição por canal de aquisição
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.sources && data.sources.length > 0 ? (
            <div className="space-y-4">
              {/* Pie chart */}
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.sources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.sources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Source list with icons */}
              <div className="space-y-2">
                {data.sources.map((source, index) => {
                  const Icon = SOURCE_ICONS[source.name] || Globe;
                  return (
                    <div key={source.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{source.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{source.value}</Badge>
                        <span className="text-xs text-muted-foreground">
                          ({source.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Sem dados para exibir
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source quality radar chart - shown only in detailed view */}
      {detailed && data.sources && data.sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Qualidade por Fonte</CardTitle>
            <CardDescription>
              Score de qualidade dos leads por origem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={data.sources}>
                <PolarGrid strokeDasharray="3 3" className="stroke-muted" />
                <PolarAngleAxis dataKey="name" className="text-xs" />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <Radar
                  name="Qualidade"
                  dataKey="quality"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance comparison - shown only in detailed view */}
      {detailed && data.performance && data.performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance por Fonte</CardTitle>
            <CardDescription>
              Métricas comparativas de desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.performance}>
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
                <Bar dataKey="avgScore" name="Score Médio" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>

            {/* ROI indicators */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {data.performance.map((source) => (
                <div key={source.source} className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">{source.source}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">ROI:</span>
                      <span className="font-medium">
                        {source.roi > 0 ? '+' : ''}{source.roi.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tempo médio:</span>
                      <span className="font-medium">{source.avgTime}h</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Conversão:</span>
                      <span className="font-medium">
                        {((source.conversions / source.leads) * 100).toFixed(1)}%
                      </span>
                    </div>
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