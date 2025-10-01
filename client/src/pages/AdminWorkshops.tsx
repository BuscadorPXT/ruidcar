import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Globe,
  MoreHorizontal,
  RefreshCw,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/admin/AdminLayout';
import WorkshopForm from '@/components/admin/WorkshopForm';
import { useToast } from '@/hooks/use-toast';
import { type Workshop } from '@shared/schema';
import { BRAZILIAN_STATES, STATE_NAMES } from '@shared/constants';
import { WorkshopListLoading } from '@/components/ui/loading';

interface WorkshopsResponse {
  workshops: Workshop[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminWorkshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workshopToDelete, setWorkshopToDelete] = useState<Workshop | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [workshopToEdit, setWorkshopToEdit] = useState<Workshop | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const { toast } = useToast();

  // Todos os estados brasileiros disponíveis
  const states = BRAZILIAN_STATES;

  useEffect(() => {
    loadWorkshops();
  }, [search, stateFilter, statusFilter, pagination.page]);

  const loadWorkshops = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (search) params.append('search', search);
      if (stateFilter !== 'all') params.append('state', stateFilter);
      if (statusFilter !== 'all') params.append('active', statusFilter);

      console.log('📊 Carregando oficinas...', params.toString());
      const response = await fetch(`/api/admin/workshops?${params}`, {
        credentials: 'include'
      });

      const data = await response.json();
      console.log('📋 Oficinas carregadas:', data);

      if (response.ok) {
        const typed: WorkshopsResponse = data;
        setWorkshops(typed.workshops);
        setPagination(typed.pagination);
      } else {
        const message = (data && typeof data === 'object' && 'message' in data) ? (data.message as string) : 'Erro ao carregar oficinas';
        throw new Error(message);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar oficinas:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      toast({
        title: 'Erro ao carregar oficinas',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workshop: Workshop) => {
    try {
      console.log('🗑️ Desativando oficina:', workshop.id);
      const response = await fetch(`/api/admin/workshops/${workshop.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Oficina desativada',
          description: result.message
        });
        loadWorkshops(); // Recarregar lista
      } else {
        throw new Error(result.message || 'Erro ao desativar oficina');
      }
    } catch (error) {
      console.error('❌ Erro ao desativar oficina:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao desativar oficina',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setWorkshopToDelete(null);
    }
  };

  const handleToggleStatus = async (workshop: Workshop) => {
    try {
      const endpoint = workshop.active
        ? `/api/admin/workshops/${workshop.id}`
        : `/api/admin/workshops/${workshop.id}/activate`;

      const method = workshop.active ? 'DELETE' : 'POST';

      console.log(`🔄 Alternando status da oficina ${workshop.id}:`, method);
      const response = await fetch(endpoint, {
        method,
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: workshop.active ? 'Oficina desativada' : 'Oficina reativada',
          description: result.message
        });
        loadWorkshops();
      } else {
        throw new Error(result.message || 'Erro ao alterar status');
      }
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao alterar status',
        description: message,
        variant: 'destructive'
      });
    }
  };

  const openDeleteDialog = (workshop: Workshop) => {
    setWorkshopToDelete(workshop);
    setDeleteDialogOpen(true);
  };

  const openAddForm = () => {
    setWorkshopToEdit(null);
    setFormOpen(true);
  };

  const openEditForm = (workshop: Workshop) => {
    setWorkshopToEdit(workshop);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setWorkshopToEdit(null);
  };

  const handleFormSuccess = () => {
    loadWorkshops(); // Recarrega a lista
  };

  if (loading && workshops.length === 0) {
    return (
      <AdminLayout>
        <WorkshopListLoading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Oficinas</h1>
            <p className="text-gray-600">
              {pagination.total} oficinas encontradas
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadWorkshops} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={openAddForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Oficina
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar oficina..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {states.map(state => (
                    <SelectItem key={state} value={state}>
                      {state} - {STATE_NAMES[state]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Ativas</SelectItem>
                  <SelectItem value="false">Inativas</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStateFilter('all');
                  setStatusFilter('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workshops.map((workshop) => (
                  <TableRow key={workshop.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{workshop.name}</p>
                        <p className="text-sm text-gray-500">ID: {workshop.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">
                          {workshop.uniqueCode || '-'}
                        </span>
                        {workshop.uniqueCode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(workshop.uniqueCode as string);
                                toast({ title: 'Copiado!', description: 'Código da oficina copiado.' });
                              } catch (e) {
                                toast({ title: 'Falha ao copiar', description: String(e), variant: 'destructive' });
                              }
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm">{workshop.address}</p>
                          {workshop.city && workshop.state && (
                            <p className="text-xs text-gray-500">
                              {workshop.city}, {workshop.state}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {workshop.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {workshop.phone}
                          </div>
                        )}
                        {workshop.website && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-3 w-3" />
                            {workshop.website}
                          </div>
                        )}
                        {!workshop.phone && !workshop.website && (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={workshop.active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleStatus(workshop)}
                      >
                        {workshop.active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativa
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativa
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditForm(workshop)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(workshop)}
                          >
                            {workshop.active ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Reativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => openDeleteDialog(workshop)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {workshops.length === 0 && !loading && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma oficina encontrada</h3>
                <p className="text-gray-500 mb-4">
                  {search || stateFilter !== 'all' || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros ou busca'
                    : 'Comece criando sua primeira oficina'
                  }
                </p>
                {!search && stateFilter === 'all' && statusFilter === 'all' && (
                  <Button onClick={openAddForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Oficina
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      {/* Workshop Form Modal */}
      <WorkshopForm
        isOpen={formOpen}
        onClose={closeForm}
        workshop={workshopToEdit}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar oficina?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a desativar "{workshopToDelete?.name}".
              A oficina não aparecerá mais no mapa público, mas os dados serão preservados.
              Você pode reativá-la a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => workshopToDelete && handleDelete(workshopToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}