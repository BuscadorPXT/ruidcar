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
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Building,
  MapPin,
  Hash,
  Clock,
  TrendingUp,
  AlertCircle,
  Check
} from 'lucide-react';
import LeadDetail from '@/components/admin/leads/LeadDetail';
import LeadFilters, { LeadFiltersType } from '@/components/admin/leads/LeadFilters';
import LeadStatusBadge from '@/components/admin/leads/LeadStatusBadge';
import LeadKanban from '@/components/admin/leads/LeadKanban';
import WhatsAppIntegration from '@/components/admin/leads/WhatsAppIntegration';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLeadSocket } from '@/hooks/useLeadSocket';

interface Lead {
  id: number;
  fullName: string;
  company: string | null;
  email: string;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  status: string;
  leadScore: number | null;
  assignedTo: number | null;
  assignedUser?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  lastInteraction: string | null;
  interactionCount: number;
  tags: string[] | null;
  message: string;
  businessType: string | null;
}

interface LeadListResponse {
  success: boolean;
  data: {
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function LeadManagement() {
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [filters, setFilters] = useState<LeadFiltersType>({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    assignedTo: '',
    minScore: '',
    maxScore: '',
    tags: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket real-time updates
  const { isConnected, leadStats: realtimeStats, newLeadsCount } = useLeadSocket();

  // Build query params
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(filters.search && { search: filters.search }),
    ...(filters.status && { status: filters.status }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
    ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
    ...(filters.minScore && { minScore: filters.minScore }),
    ...(filters.maxScore && { maxScore: filters.maxScore }),
    ...(filters.tags && { tags: filters.tags }),
  }).toString();

  // Fetch leads
  const { data, isLoading, error } = useQuery<LeadListResponse>({
    queryKey: ['leads', queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/admin/leads?${queryParams}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      return response.json();
    }
  });

  // Lead statistics - use realtime stats if available, otherwise fallback to query data
  // Debug: Log what we're getting from the API
  if (data) {
    console.log('[LeadManagement] API Response:', data);
    console.log('[LeadManagement] data.data:', data.data);
    console.log('[LeadManagement] data.data.leads type:', typeof data?.data?.leads);
    console.log('[LeadManagement] Is array?:', Array.isArray(data?.data?.leads));
  }

  const safeLeads = data?.data?.leads && Array.isArray(data.data.leads) ? data.data.leads : [];

  // Extra safety check - ensure safeLeads is always an array
  if (!Array.isArray(safeLeads)) {
    console.error('[LeadManagement] CRITICAL: safeLeads is not an array!', safeLeads);
  }

  const leadStats = {
    total: realtimeStats?.total || data?.data?.total || 0,
    new: realtimeStats?.new_count || (Array.isArray(safeLeads) ? safeLeads.filter(l => l.status === 'new').length : 0) || 0,
    contacted: realtimeStats?.contacted_count || (Array.isArray(safeLeads) ? safeLeads.filter(l => l.status === 'contacted').length : 0) || 0,
    qualified: realtimeStats?.qualified_count || (Array.isArray(safeLeads) ? safeLeads.filter(l => l.status === 'qualified').length : 0) || 0,
    won: realtimeStats?.won_count || (Array.isArray(safeLeads) ? safeLeads.filter(l => l.status === 'closed_won').length : 0) || 0,
  };

  // Handle lead click
  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailDialog(true);
  };

  // Handle filter change
  const handleFilterChange = (key: keyof LeadFiltersType, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      startDate: '',
      endDate: '',
      assignedTo: '',
      minScore: '',
      maxScore: '',
      tags: ''
    });
    setPage(1);
  };

  // Handle lead selection
  const handleLeadSelection = (lead: Lead, isSelected: boolean) => {
    if (isSelected) {
      setSelectedLeads(prev => [...prev, lead]);
    } else {
      setSelectedLeads(prev => prev.filter(l => l.id !== lead.id));
    }
  };

  // Handle select all leads
  const handleSelectAllLeads = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedLeads(safeLeads);
    } else {
      setSelectedLeads([]);
    }
  };

  // Check if lead is selected
  const isLeadSelected = (leadId: number) => {
    return selectedLeads.some(lead => lead.id === leadId);
  };

  // Export leads
  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: 'Exportação',
      description: 'Funcionalidade em desenvolvimento'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Leads</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Gerencie e acompanhe seus leads em um só lugar
              {isConnected && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  Tempo real ativo
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{leadStats.total}</p>
                </div>
                <Hash className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Novos</p>
                  <p className="text-2xl font-bold text-blue-600">{leadStats.new}</p>
                </div>
                <Plus className="h-8 w-8 text-blue-600/20" />
              </div>
              {newLeadsCount > 0 && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-red-500 text-white animate-pulse">
                    {newLeadsCount} novo{newLeadsCount > 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contactados</p>
                  <p className="text-2xl font-bold text-yellow-600">{leadStats.contacted}</p>
                </div>
                <Phone className="h-8 w-8 text-yellow-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Qualificados</p>
                  <p className="text-2xl font-bold text-purple-600">{leadStats.qualified}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fechados</p>
                  <p className="text-2xl font-bold text-green-600">{leadStats.won}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-green-600/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <LeadFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
        />

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'kanban')}>
          <TabsList>
            <TabsTrigger value="table">Tabela</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-4">
            {/* WhatsApp Integration */}
            {selectedLeads.length > 0 && (
              <div className="mb-6">
                <WhatsAppIntegration
                  selectedLeads={selectedLeads}
                  onSendComplete={() => {
                    setSelectedLeads([]);
                    queryClient.invalidateQueries({ queryKey: ['leads'] });
                  }}
                />
              </div>
            )}

            {/* Leads Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedLeads.length === safeLeads.length && selectedLeads.length > 0}
                          onChange={(e) => handleSelectAllLeads(e.target.checked)}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Lead</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Interações</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-red-500">
                          Erro ao carregar leads
                        </TableCell>
                      </TableRow>
                    ) : !Array.isArray(safeLeads) || safeLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          Nenhum lead encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      Array.isArray(safeLeads) && safeLeads.map((lead) => (
                        <TableRow
                          key={lead.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isLeadSelected(lead.id)}
                              onChange={(e) => handleLeadSelection(lead, e.target.checked)}
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell
                            className="cursor-pointer"
                            onClick={() => handleLeadClick(lead)}
                          >
                            <div>
                              <p className="font-medium">{lead.fullName}</p>
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {lead.company && (
                                <p className="text-sm">{lead.company}</p>
                              )}
                              {lead.city && lead.state && (
                                <p className="text-xs text-muted-foreground">
                                  {lead.city}, {lead.state}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <LeadStatusBadge status={lead.status} />
                          </TableCell>
                          <TableCell>
                            {lead.leadScore ? (
                              <Badge variant={lead.leadScore >= 70 ? 'default' : lead.leadScore >= 40 ? 'secondary' : 'outline'}>
                                {lead.leadScore}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {lead.assignedUser ? (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="text-sm">{lead.assignedUser.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Não atribuído</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span className="text-sm">{lead.interactionCount || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {format(new Date(lead.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(lead.createdAt), 'HH:mm', { locale: ptBR })}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://wa.me/${lead.whatsapp?.replace(/\D/g, '')}`, '_blank');
                                }}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `mailto:${lead.email}`;
                                }}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {data && data.data.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((page - 1) * 20) + 1} a {Math.min(page * 20, data.data.total)} de {data.data.total} leads
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === data.data.totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kanban" className="mt-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-4">
                  <p className="text-center text-muted-foreground py-8">
                    Carregando...
                  </p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="p-4">
                  <p className="text-center text-red-500 py-8">
                    Erro ao carregar leads
                  </p>
                </CardContent>
              </Card>
            ) : (
              <LeadKanban
                leads={safeLeads}
                onLeadClick={handleLeadClick}
                onRefresh={() => {
                  queryClient.invalidateQueries({ queryKey: ['leads'] });
                }}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Lead Detail Dialog */}
        {selectedLead && (
          <LeadDetail
            leadId={selectedLead.id}
            open={showDetailDialog}
            onOpenChange={setShowDetailDialog}
            onUpdate={() => {
              queryClient.invalidateQueries({ queryKey: ['leads'] });
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}