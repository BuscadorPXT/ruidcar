import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  AlertCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkshopAdmin {
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface PendingWorkshop {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  uniqueCode: string;
  latitude: number;
  longitude: number;
  active: boolean;
  createdAt: string;
  admin: WorkshopAdmin | null;
  daysSinceCreation: number;
}

export default function AdminPendingWorkshops() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [workshops, setWorkshops] = useState<PendingWorkshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<PendingWorkshop | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingWorkshops();
  }, []);

  const fetchPendingWorkshops = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/workshops/pending', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar oficinas pendentes');
      }

      const data = await response.json();
      setWorkshops(data.workshops);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as oficinas pendentes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (workshop: PendingWorkshop) => {
    setProcessingId(workshop.id);
    try {
      const response = await fetch(`/api/admin/workshops/${workshop.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao aprovar oficina');
      }

      toast({
        title: 'Sucesso',
        description: `Oficina "${workshop.name}" aprovada com sucesso!`,
      });

      // Remover da lista
      setWorkshops(workshops.filter(w => w.id !== workshop.id));
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar a oficina',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedWorkshop) return;

    setProcessingId(selectedWorkshop.id);
    try {
      const response = await fetch(`/api/admin/workshops/${selectedWorkshop.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        throw new Error('Erro ao rejeitar oficina');
      }

      toast({
        title: 'Oficina rejeitada',
        description: `Oficina "${selectedWorkshop.name}" foi rejeitada`,
      });

      // Remover da lista
      setWorkshops(workshops.filter(w => w.id !== selectedWorkshop.id));
      setShowRejectDialog(false);
      setSelectedWorkshop(null);
      setRejectReason('');
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar a oficina',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (workshop: PendingWorkshop) => {
    setSelectedWorkshop(workshop);
    setShowRejectDialog(true);
  };

  const getStatusColor = (days: number) => {
    if (days <= 1) return 'text-green-600';
    if (days <= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (days: number) => {
    if (days <= 1) return <Badge className="bg-green-100 text-green-800">Novo</Badge>;
    if (days <= 3) return <Badge className="bg-yellow-100 text-yellow-800">Recente</Badge>;
    return <Badge className="bg-red-100 text-red-800">Pendente há {days} dias</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Oficinas Pendentes de Aprovação</CardTitle>
                <CardDescription>
                  Gerencie as solicitações de cadastro de oficinas
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold">{workshops.length}</span>
                <span className="text-muted-foreground">pendentes</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : workshops.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Tudo em dia!</AlertTitle>
                <AlertDescription>
                  Não há oficinas pendentes de aprovação no momento.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {workshops.map((workshop) => (
                  <Card key={workshop.id} className="relative overflow-hidden">
                    <div className="absolute top-0 right-0">
                      {getStatusBadge(workshop.daysSinceCreation)}
                    </div>
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-primary" />
                              {workshop.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Código: {workshop.uniqueCode}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                              <div className="text-sm">
                                <p>{workshop.address}</p>
                                <p>{workshop.city} - {workshop.state}</p>
                              </div>
                            </div>

                            {workshop.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{workshop.phone}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                Cadastrada em {format(new Date(workshop.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {workshop.admin ? (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Administrador
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">{workshop.admin.name}</p>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {workshop.admin.email}
                                </div>
                                {workshop.admin.phone && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {workshop.admin.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Nenhum administrador associado
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(workshop)}
                              disabled={processingId === workshop.id}
                              className="flex-1"
                            >
                              {processingId === workshop.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Aprovar
                            </Button>
                            <Button
                              onClick={() => openRejectDialog(workshop)}
                              disabled={processingId === workshop.id}
                              variant="destructive"
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Oficina</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja rejeitar a oficina "{selectedWorkshop?.name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Motivo da rejeição (opcional)</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Informe o motivo da rejeição..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingId !== null}
            >
              {processingId !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}