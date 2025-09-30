import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import LeadStatusBadge from './LeadStatusBadge';
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  MessageSquare,
  Clock,
  Hash,
  Send,
  UserPlus,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadDetailProps {
  leadId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

interface Interaction {
  id: number;
  type: string;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface StatusHistory {
  id: number;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  changedBy: {
    id: number;
    name: string;
    email: string;
  };
}

interface LeadDetailData {
  id: number;
  fullName: string;
  company: string | null;
  email: string;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  businessType: string | null;
  message: string;
  status: string;
  leadScore: number | null;
  tags: string[] | null;
  createdAt: string;
  lastInteraction: string | null;
  interactionCount: number;
  internalNotes: string | null;
  assignedUser: {
    id: number;
    name: string;
    email: string;
  } | null;
  interactions: Interaction[];
  statusHistory: StatusHistory[];
}

export default function LeadDetail({ leadId, open, onOpenChange, onUpdate }: LeadDetailProps) {
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch lead details
  const { data: lead, isLoading } = useQuery<{ success: boolean; data: LeadDetailData }>({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch lead details');
      }
      return response.json();
    },
    enabled: open && !!leadId
  });

  // Fetch users for assignment
  const { data: users } = useQuery<any[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });

  // Garantir que users é sempre um array antes de usar map
  const safeUsersList = Array.isArray(users) ? users : [];

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ newStatus, reason }: { newStatus: string; reason?: string }) => {
      const response = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ newStatus, reason })
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Status atualizado',
        description: 'O status do lead foi atualizado com sucesso'
      });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      if (onUpdate) onUpdate();
      setNewStatus('');
      setStatusReason('');
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status',
        variant: 'destructive'
      });
    }
  });

  // Add interaction mutation
  const addInteractionMutation = useMutation({
    mutationFn: async ({ type, content }: { type: string; content: string }) => {
      const response = await fetch(`/api/admin/leads/${leadId}/interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ type, content })
      });
      if (!response.ok) {
        throw new Error('Failed to add interaction');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Nota adicionada',
        description: 'A nota foi adicionada com sucesso'
      });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      setNewNote('');
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar nota',
        variant: 'destructive'
      });
    }
  });

  // Assign lead mutation
  const assignLeadMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/leads/${leadId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ userId, notifyUser: true })
      });
      if (!response.ok) {
        throw new Error('Failed to assign lead');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Lead atribuído',
        description: 'O lead foi atribuído com sucesso'
      });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      if (onUpdate) onUpdate();
      setSelectedUserId('');
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao atribuir lead',
        variant: 'destructive'
      });
    }
  });

  if (!lead?.data) return null;

  const leadData = lead.data;

  // Arrays defensivos para evitar TypeError em .map
  const interactionsList = Array.isArray(leadData.interactions) ? leadData.interactions : [];
  const statusHistoryList = Array.isArray(leadData.statusHistory) ? leadData.statusHistory : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalhes do Lead</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="space-y-6 p-1">
            {/* Lead Info Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{leadData.fullName}</h2>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {leadData.company && (
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      <span className="text-sm">{leadData.company}</span>
                    </div>
                  )}
                  {leadData.city && leadData.state && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{leadData.city}, {leadData.state}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <LeadStatusBadge status={leadData.status} />
                {leadData.leadScore && (
                  <Badge variant="outline">
                    Score: {leadData.leadScore}
                  </Badge>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="interactions">
                  Interações ({interactionsList.length})
                </TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="actions">Ações</TabsTrigger>
              </TabsList>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações de Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${leadData.email}`} className="text-sm hover:underline">
                        {leadData.email}
                      </a>
                    </div>
                    {leadData.whatsapp && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`https://wa.me/${leadData.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:underline"
                        >
                          {leadData.whatsapp}
                        </a>
                      </div>
                    )}
                    {leadData.businessType && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{leadData.businessType}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Criado em {format(new Date(leadData.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mensagem Original</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {leadData.message}
                    </p>
                  </CardContent>
                </Card>

                {leadData.assignedUser && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Responsável</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{leadData.assignedUser.name}</span>
                        <span className="text-sm text-muted-foreground">({leadData.assignedUser.email})</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Interactions Tab */}
              <TabsContent value="interactions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Adicionar Nota</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Digite sua nota..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button
                      onClick={() => {
                        if (newNote.trim()) {
                          addInteractionMutation.mutate({ type: 'note', content: newNote });
                        }
                      }}
                      disabled={!newNote.trim() || addInteractionMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Adicionar Nota
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  {interactionsList.map((interaction) => (
                    <Card key={interaction.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {interaction.type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {interaction.user.name}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(interaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{interaction.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-3">
                {statusHistoryList.map((history) => (
                  <Card key={history.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {history.oldStatus && (
                            <>
                              <LeadStatusBadge status={history.oldStatus} />
                              <span>→</span>
                            </>
                          )}
                          <LeadStatusBadge status={history.newStatus} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(history.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Por {history.changedBy.name}
                      </p>
                      {history.reason && (
                        <p className="text-sm mt-2">
                          <strong>Motivo:</strong> {history.reason}
                        </p>
                      )}
                      {history.notes && (
                        <p className="text-sm mt-1">
                          <strong>Notas:</strong> {history.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Alterar Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o novo status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Novo</SelectItem>
                        <SelectItem value="contacted">Contactado</SelectItem>
                        <SelectItem value="qualified">Qualificado</SelectItem>
                        <SelectItem value="proposal">Proposta</SelectItem>
                        <SelectItem value="negotiation">Negociação</SelectItem>
                        <SelectItem value="closed_won">Fechado (Ganho)</SelectItem>
                        <SelectItem value="closed_lost">Fechado (Perdido)</SelectItem>
                        <SelectItem value="nurturing">Nutrição</SelectItem>
                      </SelectContent>
                    </Select>
                    {(newStatus === 'closed_lost' || newStatus === 'closed_won') && (
                      <Textarea
                        placeholder="Motivo (opcional)"
                        value={statusReason}
                        onChange={(e) => setStatusReason(e.target.value)}
                      />
                    )}
                    <Button
                      onClick={() => {
                        if (newStatus) {
                          updateStatusMutation.mutate({ newStatus, reason: statusReason });
                        }
                      }}
                      disabled={!newStatus || updateStatusMutation.isPending}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Alterar Status
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Atribuir Lead</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {safeUsersList.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        if (selectedUserId) {
                          assignLeadMutation.mutate(parseInt(selectedUserId));
                        }
                      }}
                      disabled={!selectedUserId || assignLeadMutation.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Atribuir Lead
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(`https://wa.me/${leadData.whatsapp?.replace(/\D/g, '')}`, '_blank')}
                      disabled={!leadData.whatsapp}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Enviar WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.location.href = `mailto:${leadData.email}`}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar Email
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}