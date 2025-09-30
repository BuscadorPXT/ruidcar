import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  MapPin,
  Globe,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Map,
  Thermometer,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  ChevronRight,
  Download,
  RefreshCw,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface LeadWithAI {
  id: number;
  fullName: string;
  email: string;
  whatsapp?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  ddd?: string;
  ddi?: string;
  estado?: string;
  pais?: string;
  continente?: string;
  regiao?: string;
  leadScore?: number;
  leadTemperature?: 'hot' | 'warm' | 'cold';
  aiAnalysis?: any;
  aiSuggestions?: string[];
  predictedConversionRate?: number;
  lastAiAnalysis?: string;
  createdAt: string;
  status: string;
}

interface GeographicStats {
  byState: Record<string, number>;
  byCountry: Record<string, number>;
  byRegion: Record<string, number>;
}

interface AIStats {
  totalAnalyzed: number;
  averageScore: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  averageConversionRate: number;
}

const temperatureColors = {
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#3b82f6'
};

const temperatureLabels = {
  hot: 'Quente',
  warm: 'Morno',
  cold: 'Frio'
};

const regionColors: Record<string, string> = {
  'Norte': '#10b981',
  'Nordeste': '#f59e0b',
  'Centro-Oeste': '#8b5cf6',
  'Sudeste': '#3b82f6',
  'Sul': '#ef4444'
};

export default function LeadIntelligence() {
  const [selectedLead, setSelectedLead] = useState<LeadWithAI | null>(null);
  const [filters, setFilters] = useState({
    state: '',
    country: '',
    temperature: '',
    scoreMin: 0,
    scoreMax: 100
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Busca leads com dados de IA
  const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['leads-intelligence', filters, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.state) params.append('state', filters.state);
      if (filters.country) params.append('country', filters.country);
      if (filters.temperature) params.append('temperature', filters.temperature);
      params.append('scoreMin', filters.scoreMin.toString());
      params.append('scoreMax', filters.scoreMax.toString());
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/leads/intelligence?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao buscar leads');
      return response.json();
    }
  });

  // Busca estatísticas geográficas
  const { data: geoStats } = useQuery({
    queryKey: ['geographic-stats'],
    queryFn: async () => {
      const response = await fetch('/api/leads/geographic-stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao buscar estatísticas');
      return response.json();
    }
  });

  // Busca estatísticas de IA
  const { data: aiStats } = useQuery({
    queryKey: ['ai-stats'],
    queryFn: async () => {
      const response = await fetch('/api/leads/ai-stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao buscar estatísticas de IA');
      return response.json();
    }
  });

  // Mutation para analisar lead com IA
  const analyzeLead = useMutation({
    mutationFn: async (leadId: number) => {
      const response = await fetch('/api/leads/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leadId, includeAI: true })
      });
      if (!response.ok) throw new Error('Erro ao analisar lead');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Análise concluída',
        description: `Lead analisado com sucesso. Score: ${data.leadScore}/100`
      });
      queryClient.invalidateQueries({ queryKey: ['leads-intelligence'] });
    },
    onError: () => {
      toast({
        title: 'Erro na análise',
        description: 'Não foi possível analisar o lead',
        variant: 'destructive'
      });
    }
  });

  // Mutation para análise em lote
  const analyzeBatch = useMutation({
    mutationFn: async (leadIds: number[]) => {
      setIsAnalyzing(true);
      const response = await fetch('/api/leads/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leadIds })
      });
      if (!response.ok) throw new Error('Erro na análise em lote');
      return response.json();
    },
    onSuccess: (data) => {
      setIsAnalyzing(false);
      toast({
        title: 'Análise em lote concluída',
        description: `${data.analyzed} leads analisados com sucesso`
      });
      refetchLeads();
      queryClient.invalidateQueries();
    },
    onError: () => {
      setIsAnalyzing(false);
      toast({
        title: 'Erro na análise',
        description: 'Não foi possível analisar os leads',
        variant: 'destructive'
      });
    }
  });

  const handleAnalyzeAll = () => {
    const unanalyzedLeads = leadsData?.leads.filter((l: LeadWithAI) => !l.leadScore).map((l: LeadWithAI) => l.id);
    if (unanalyzedLeads?.length > 0) {
      analyzeBatch.mutate(unanalyzedLeads);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    try {
      const response = await fetch(`/api/leads/export-intelligent?format=${format}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-intelligence-${format}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar os dados',
        variant: 'destructive'
      });
    }
  };

  // Prepara dados para gráficos
  const stateChartData = geoStats?.byState
    ? Object.entries(geoStats.byState).map(([state, count]) => ({
        name: state,
        value: count as number
      }))
    : [];

  const temperatureData = aiStats
    ? [
        { name: 'Quente', value: aiStats.hotLeads, color: temperatureColors.hot },
        { name: 'Morno', value: aiStats.warmLeads, color: temperatureColors.warm },
        { name: 'Frio', value: aiStats.coldLeads, color: temperatureColors.cold }
      ]
    : [];

  const regionData = geoStats?.byRegion
    ? Object.entries(geoStats.byRegion).map(([region, count]) => ({
        name: region,
        value: count as number,
        color: regionColors[region] || '#6b7280'
      }))
    : [];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              Central de Inteligência de Leads
            </h1>
            <p className="text-muted-foreground mt-1">
              Análise avançada com IA e geolocalização
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetchLeads()}
              disabled={leadsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${leadsLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <Button
              onClick={handleAnalyzeAll}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analisar Todos com IA
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadsData?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {aiStats?.totalAnalyzed || 0} analisados com IA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiStats?.averageScore?.toFixed(1) || 0}/100</div>
              <Progress value={aiStats?.averageScore || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão Prevista</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((aiStats?.averageConversionRate || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Média prevista pela IA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Quentes</CardTitle>
              <Thermometer className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{aiStats?.hotLeads || 0}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-orange-500">
                  {aiStats?.warmLeads || 0} mornos
                </Badge>
                <Badge variant="outline" className="text-blue-500">
                  {aiStats?.coldLeads || 0} frios
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Visualização */}
        <Tabs defaultValue="map" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="map">
              <Map className="h-4 w-4 mr-2" />
              Mapa
            </TabsTrigger>
            <TabsTrigger value="charts">
              <BarChart3 className="h-4 w-4 mr-2" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="table">
              <Table className="h-4 w-4 mr-2" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <Target className="h-4 w-4 mr-2" />
              Kanban
            </TabsTrigger>
          </TabsList>

          {/* Tab: Mapa */}
          <TabsContent value="map" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Mapa do Brasil por Estado */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Estado</CardTitle>
                  <CardDescription>Leads distribuídos pelos estados brasileiros</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center space-y-4">
                      <MapPin className="h-16 w-16 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-semibold">Mapa Interativo</p>
                        <p className="text-sm text-muted-foreground">Em desenvolvimento</p>
                      </div>
                      {/* Lista de estados com contagem */}
                      <div className="mt-4 max-h-[250px] overflow-y-auto">
                        {stateChartData.map((state) => (
                          <div key={state.name} className="flex justify-between items-center py-1 px-2 hover:bg-muted">
                            <span className="font-medium">{state.name}</span>
                            <Badge variant="secondary">{state.value}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por Região */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Região</CardTitle>
                  <CardDescription>Análise regional dos leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RePieChart>
                      <Pie
                        data={regionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {regionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Gráficos */}
          <TabsContent value="charts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico de Temperatura */}
              <Card>
                <CardHeader>
                  <CardTitle>Temperatura dos Leads</CardTitle>
                  <CardDescription>Classificação por potencial de conversão</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={temperatureData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8">
                        {temperatureData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Estados */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Estados</CardTitle>
                  <CardDescription>Estados com mais leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stateChartData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Score</CardTitle>
                <CardDescription>Análise da qualidade dos leads por pontuação</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={[
                      { range: '0-20', count: 15 },
                      { range: '21-40', count: 35 },
                      { range: '41-60', count: 45 },
                      { range: '61-80', count: 65 },
                      { range: '81-100', count: 25 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Tabela */}
          <TabsContent value="table" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros Inteligentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="text-sm font-medium">Estado</label>
                    <Select value={filters.state} onValueChange={(v) => setFilters({...filters, state: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {Object.keys(geoStats?.byState || {}).map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Temperatura</label>
                    <Select value={filters.temperature} onValueChange={(v) => setFilters({...filters, temperature: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        <SelectItem value="hot">Quente</SelectItem>
                        <SelectItem value="warm">Morno</SelectItem>
                        <SelectItem value="cold">Frio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Score Mínimo</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.scoreMin}
                      onChange={(e) => setFilters({...filters, scoreMin: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Score Máximo</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.scoreMax}
                      onChange={(e) => setFilters({...filters, scoreMax: parseInt(e.target.value) || 100})}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Buscar</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nome, email, empresa..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Leads */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Leads com Análise de IA</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                    <Download className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Score IA</TableHead>
                      <TableHead>Temperatura</TableHead>
                      <TableHead>Conversão</TableHead>
                      <TableHead>Sugestões IA</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadsData?.leads?.map((lead: LeadWithAI) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.fullName}</p>
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                            {lead.company && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {lead.company}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {lead.estado && (
                              <Badge variant="outline" className="text-xs">
                                {lead.estado} - {lead.cidade}
                              </Badge>
                            )}
                            {lead.pais && lead.pais !== 'Brasil' && (
                              <Badge variant="outline" className="text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                {lead.pais}
                              </Badge>
                            )}
                            {lead.ddd && (
                              <Badge variant="secondary" className="text-xs">
                                DDD {lead.ddd}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {lead.leadScore ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{lead.leadScore}</span>
                                <span className="text-sm text-muted-foreground">/100</span>
                              </div>
                              <Progress value={lead.leadScore} className="h-2" />
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Não analisado
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {lead.leadTemperature && (
                            <Badge
                              style={{ backgroundColor: temperatureColors[lead.leadTemperature] }}
                              className="text-white"
                            >
                              <Thermometer className="h-3 w-3 mr-1" />
                              {temperatureLabels[lead.leadTemperature]}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {lead.predictedConversionRate ? (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-green-500" />
                              <span className="font-medium">
                                {(lead.predictedConversionRate * 100).toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>

                        <TableCell className="max-w-[300px]">
                          {lead.aiSuggestions && lead.aiSuggestions.length > 0 ? (
                            <div className="space-y-1">
                              {lead.aiSuggestions.slice(0, 2).map((suggestion, idx) => (
                                <p key={idx} className="text-xs text-muted-foreground truncate">
                                  • {suggestion}
                                </p>
                              ))}
                              {lead.aiSuggestions.length > 2 && (
                                <p className="text-xs text-primary cursor-pointer">
                                  +{lead.aiSuggestions.length - 2} mais...
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-2">
                            {!lead.leadScore && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => analyzeLead.mutate(lead.id)}
                              >
                                <Brain className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {(!leadsData?.leads || leadsData.leads.length === 0) && (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum lead encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Kanban */}
          <TabsContent value="kanban">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Inteligente</CardTitle>
                <CardDescription>Visualização Kanban com insights de IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Coluna Hot */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Leads Quentes</span>
                      <Badge variant="destructive">{aiStats?.hotLeads || 0}</Badge>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {leadsData?.leads
                        ?.filter((l: LeadWithAI) => l.leadTemperature === 'hot')
                        .map((lead: LeadWithAI) => (
                          <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-3">
                              <p className="font-medium text-sm">{lead.fullName}</p>
                              <p className="text-xs text-muted-foreground">{lead.company}</p>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Score: {lead.leadScore}
                                </Badge>
                                <span className="text-xs text-green-600">
                                  {((lead.predictedConversionRate || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>

                  {/* Coluna Warm */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Leads Mornos</span>
                      <Badge className="bg-orange-500">{aiStats?.warmLeads || 0}</Badge>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {leadsData?.leads
                        ?.filter((l: LeadWithAI) => l.leadTemperature === 'warm')
                        .map((lead: LeadWithAI) => (
                          <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-3">
                              <p className="font-medium text-sm">{lead.fullName}</p>
                              <p className="text-xs text-muted-foreground">{lead.company}</p>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Score: {lead.leadScore}
                                </Badge>
                                <span className="text-xs text-yellow-600">
                                  {((lead.predictedConversionRate || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>

                  {/* Coluna Cold */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                      <Thermometer className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Leads Frios</span>
                      <Badge className="bg-blue-500">{aiStats?.coldLeads || 0}</Badge>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {leadsData?.leads
                        ?.filter((l: LeadWithAI) => l.leadTemperature === 'cold')
                        .map((lead: LeadWithAI) => (
                          <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-3">
                              <p className="font-medium text-sm">{lead.fullName}</p>
                              <p className="text-xs text-muted-foreground">{lead.company}</p>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Score: {lead.leadScore}
                                </Badge>
                                <span className="text-xs text-blue-600">
                                  {((lead.predictedConversionRate || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Detalhes do Lead */}
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Análise Detalhada do Lead</DialogTitle>
            </DialogHeader>

            {selectedLead && (
              <div className="space-y-4">
                {/* Informações Básicas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Lead</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{selectedLead.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedLead.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">WhatsApp</p>
                        <p className="font-medium">{selectedLead.whatsapp || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Empresa</p>
                        <p className="font-medium">{selectedLead.company || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Análise Geográfica */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Análise Geográfica
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <p className="font-medium">{selectedLead.estado || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cidade</p>
                        <p className="font-medium">{selectedLead.cidade || selectedLead.city || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">País</p>
                        <p className="font-medium">{selectedLead.pais || selectedLead.country || 'Brasil'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Região</p>
                        <p className="font-medium">{selectedLead.regiao || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">DDD</p>
                        <p className="font-medium">{selectedLead.ddd || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">DDI</p>
                        <p className="font-medium">{selectedLead.ddi || '+55'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Análise de IA */}
                {selectedLead.aiAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Análise de Inteligência Artificial
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Score de Qualidade</p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{selectedLead.leadScore}</span>
                            <span className="text-sm">/100</span>
                          </div>
                          <Progress value={selectedLead.leadScore || 0} className="mt-2" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Temperatura</p>
                          <Badge
                            className="mt-2"
                            style={{
                              backgroundColor: selectedLead.leadTemperature ? temperatureColors[selectedLead.leadTemperature] : '#6b7280',
                              color: 'white'
                            }}
                          >
                            {selectedLead.leadTemperature ? temperatureLabels[selectedLead.leadTemperature] : 'Não classificado'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Conversão Prevista</p>
                          <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-2xl font-bold">
                              {((selectedLead.predictedConversionRate || 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sugestões da IA */}
                      {selectedLead.aiSuggestions && selectedLead.aiSuggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Sugestões de Ação
                          </h4>
                          <div className="space-y-2">
                            {selectedLead.aiSuggestions.map((suggestion, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <p className="text-sm">{suggestion}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detalhes da Análise */}
                      {selectedLead.aiAnalysis && (
                        <div>
                          <h4 className="font-medium mb-2">Detalhes da Análise</h4>
                          <div className="p-3 bg-muted rounded-lg">
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(selectedLead.aiAnalysis, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {selectedLead.lastAiAnalysis && (
                        <p className="text-xs text-muted-foreground">
                          Última análise: {format(new Date(selectedLead.lastAiAnalysis), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Ações */}
                <div className="flex justify-end gap-2">
                  {!selectedLead.leadScore && (
                    <Button
                      onClick={() => {
                        analyzeLead.mutate(selectedLead.id);
                        setSelectedLead(null);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Analisar com IA
                    </Button>
                  )}
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Enviar WhatsApp
                  </Button>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Email
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}