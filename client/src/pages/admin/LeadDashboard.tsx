import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeadMetrics from '@/components/admin/leads/LeadMetrics';
import LeadConversionChart from '@/components/admin/leads/LeadConversionChart';
import LeadPipelineChart from '@/components/admin/leads/LeadPipelineChart';
import LeadTrendChart from '@/components/admin/leads/LeadTrendChart';
import LeadSourceChart from '@/components/admin/leads/LeadSourceChart';
import TopPerformers from '@/components/admin/leads/TopPerformers';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Users
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function LeadDashboard() {
  const [dateRange, setDateRange] = useState('30');
  const [comparison, setComparison] = useState(false);
  const { toast } = useToast();

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    switch(dateRange) {
      case '7':
        start = subDays(end, 7);
        break;
      case '30':
        start = subDays(end, 30);
        break;
      case '90':
        start = subDays(end, 90);
        break;
      case 'month':
        start = startOfMonth(new Date());
        break;
      case 'all':
        start = new Date('2024-01-01');
        break;
      default:
        start = subDays(end, 30);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['lead-dashboard', dateRange, comparison],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const params = new URLSearchParams({
        startDate,
        endDate,
        comparison: comparison.toString()
      });

      const response = await fetch(`/api/admin/leads/dashboard?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      return response.json();
    }
  });

  // Export dashboard report
  const handleExport = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const params = new URLSearchParams({
        startDate,
        endDate,
        format: 'csv'
      });

      const response = await fetch(`/api/admin/leads/export?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-report-${startDate}-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Relatório exportado',
        description: 'O arquivo foi baixado com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o relatório',
        variant: 'destructive'
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard de Leads</h1>
            <p className="text-muted-foreground mt-1">
              Análise completa do pipeline de vendas
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={comparison ? 'default' : 'outline'}
              onClick={() => setComparison(!comparison)}
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Comparar períodos
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
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
        ) : (
          <>
            {/* Key Metrics */}
            <LeadMetrics data={dashboardData?.metrics} comparison={comparison} />

            {/* Charts Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="conversion">Conversão</TabsTrigger>
                <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                <TabsTrigger value="trends">Tendências</TabsTrigger>
                <TabsTrigger value="team">Equipe</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <LeadConversionChart data={dashboardData?.conversion} />
                  <LeadPipelineChart data={dashboardData?.pipeline} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <LeadSourceChart data={dashboardData?.sources} />
                  <LeadTrendChart data={dashboardData?.trends} />
                </div>
              </TabsContent>

              <TabsContent value="conversion" className="space-y-4">
                <LeadConversionChart
                  data={dashboardData?.conversion}
                  detailed={true}
                />
                {/* Conversion funnel details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Funil de Conversão Detalhado</CardTitle>
                    <CardDescription>
                      Taxa de conversão entre cada etapa do pipeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.funnel && (
                      <div className="space-y-4">
                        {dashboardData.funnel.map((stage: any, index: number) => (
                          <div key={stage.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <span className="font-medium">{stage.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">{stage.count} leads</Badge>
                              {index > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  {stage.conversionRate}% conversão
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pipeline" className="space-y-4">
                <LeadPipelineChart
                  data={dashboardData?.pipeline}
                  detailed={true}
                />
                {/* Pipeline velocity metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Velocidade do Pipeline</CardTitle>
                    <CardDescription>
                      Tempo médio em cada etapa do processo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.velocity && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(dashboardData.velocity).map(([stage, data]: [string, any]) => (
                          <div key={stage} className="space-y-1">
                            <p className="text-sm font-medium">{stage}</p>
                            <p className="text-2xl font-bold">{data.avgDays} dias</p>
                            <p className="text-xs text-muted-foreground">
                              {data.trend > 0 ? '↑' : '↓'} {Math.abs(data.trend)}% vs período anterior
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                <LeadTrendChart
                  data={dashboardData?.trends}
                  detailed={true}
                />
                {/* Predictions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Previsões</CardTitle>
                    <CardDescription>
                      Projeções baseadas em tendências históricas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.predictions && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Leads esperados (próx. 30 dias)</p>
                          <p className="text-2xl font-bold">{dashboardData.predictions.expectedLeads}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Conversões esperadas</p>
                          <p className="text-2xl font-bold">{dashboardData.predictions.expectedConversions}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Receita projetada</p>
                          <p className="text-2xl font-bold">
                            R$ {dashboardData.predictions.expectedRevenue.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <TopPerformers data={dashboardData?.team} />
                {/* Team performance details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Individual</CardTitle>
                    <CardDescription>
                      Métricas detalhadas por membro da equipe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.teamDetails && (
                      <div className="space-y-4">
                        {dashboardData.teamDetails.map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground">Leads</p>
                                <p className="font-bold">{member.totalLeads}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Conversão</p>
                                <p className="font-bold">{member.conversionRate}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Tempo médio</p>
                                <p className="font-bold">{member.avgResponseTime}h</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Score</p>
                                <Badge variant={member.score >= 80 ? 'default' : 'secondary'}>
                                  {member.score}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}