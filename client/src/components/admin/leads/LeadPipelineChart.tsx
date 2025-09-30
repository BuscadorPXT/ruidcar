import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

interface PipelineData {
  stages?: Array<{
    name: string;
    count: number;
    value: number;
    percentage: number;
    color: string;
  }>;
  funnel?: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  distribution?: {
    total: number;
    byStage: Record<string, number>;
  };
}

interface LeadPipelineChartProps {
  data?: PipelineData;
  detailed?: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  'Novo': '#3b82f6',
  'Contactado': '#f59e0b',
  'Qualificado': '#8b5cf6',
  'Proposta': '#f97316',
  'Negociação': '#6366f1',
  'Ganho': '#10b981',
  'Perdido': '#ef4444',
  'Nutrição': '#6b7280'
};

export default function LeadPipelineChart({ data, detailed = false }: LeadPipelineChartProps) {
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
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLabel = (props: any) => {
    const { x, y, width, height, value, name } = props;
    return (
      <g>
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          fill="#fff"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm font-medium"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          fill="#fff"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs"
        >
          {value} leads
        </text>
      </g>
    );
  };

  return (
    <>
      {/* Main pipeline chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pipeline de Vendas</CardTitle>
              <CardDescription>
                Distribuição de leads por etapa do funil
              </CardDescription>
            </div>
            {data.distribution && (
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {data.distribution.total} leads ativos
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.stages && data.stages.length > 0 ? (
            <div className="space-y-4">
              {/* Bar chart view */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data.stages}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                    {data.stages.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || STAGE_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Progress indicators */}
              <div className="space-y-3">
                {data.stages.map((stage) => (
                  <div key={stage.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color || STAGE_COLORS[stage.name] }}
                      />
                      <span className="text-sm font-medium">{stage.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${stage.percentage}%`,
                            backgroundColor: stage.color || STAGE_COLORS[stage.name]
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {stage.count}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        ({stage.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Sem dados para exibir
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funnel visualization - shown only in detailed view */}
      {detailed && data.funnel && data.funnel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>
              Visualização em funil das etapas do processo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <FunnelChart>
                <Tooltip content={<CustomTooltip />} />
                <Funnel
                  dataKey="value"
                  data={data.funnel}
                  isAnimationActive
                  labelLine={false}
                  label={<CustomLabel />}
                >
                  {data.funnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pie chart distribution - shown only in detailed view */}
      {detailed && data.stages && data.stages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Percentual</CardTitle>
            <CardDescription>
              Proporção de leads em cada etapa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.stages}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.stages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || STAGE_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}