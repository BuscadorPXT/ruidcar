import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhatsAppMessage {
  id: number;
  leadId: number;
  leadName: string;
  leadCompany?: string;
  phoneNumber: string;
  messageContent: string;
  templateName?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
  createdAt: string;
  createdBy: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sent: 'bg-blue-100 text-blue-800 border-blue-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  read: 'bg-purple-100 text-purple-800 border-purple-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = {
  pending: 'Pendente',
  sent: 'Enviada',
  delivered: 'Entregue',
  read: 'Lida',
  failed: 'Falhada',
};

export default function WhatsAppHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: messagesData, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-messages', page, searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/whatsapp/messages?${params}`);

      if (!response.ok) {
        // Return mock data for now
        return {
          messages: [
            {
              id: 1,
              leadId: 101,
              leadName: 'João Silva',
              leadCompany: 'Auto Center Silva',
              phoneNumber: '+5511999999999',
              messageContent: 'Olá João! Vi que você se interessou pelos nossos equipamentos de isolamento acústico para Auto Center Silva...',
              templateName: 'Primeiro Contato',
              status: 'delivered',
              sentAt: '2024-01-20T10:30:00Z',
              deliveredAt: '2024-01-20T10:31:00Z',
              createdAt: '2024-01-20T10:25:00Z',
              createdBy: 'Admin Sistema'
            },
            {
              id: 2,
              leadId: 102,
              leadName: 'Maria Santos',
              leadCompany: 'Oficina Santos',
              phoneNumber: '+5511888888888',
              messageContent: 'Oi Maria, tudo bem? Notei que você demonstrou interesse em nossos produtos para Oficina Santos...',
              templateName: 'Follow-up Qualificado',
              status: 'read',
              sentAt: '2024-01-20T09:15:00Z',
              deliveredAt: '2024-01-20T09:16:00Z',
              readAt: '2024-01-20T09:20:00Z',
              createdAt: '2024-01-20T09:10:00Z',
              createdBy: 'Admin Sistema'
            },
            {
              id: 3,
              leadId: 103,
              leadName: 'Carlos Oliveira',
              phoneNumber: '+5511777777777',
              messageContent: 'Mensagem personalizada sobre produtos específicos...',
              status: 'failed',
              errorMessage: 'Número inválido ou bloqueado',
              createdAt: '2024-01-20T08:45:00Z',
              createdBy: 'Admin Sistema'
            }
          ] as WhatsAppMessage[],
          total: 3,
          totalPages: 1
        };
      }

      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    refetch();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'read':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Carregando histórico...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { messages = [], total = 0, totalPages = 1 } = messagesData || {};

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Mensagens
            </CardTitle>
            <CardDescription>
              Visualize todas as mensagens enviadas via WhatsApp
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, empresa ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="sent">Enviadas</SelectItem>
              <SelectItem value="delivered">Entregues</SelectItem>
              <SelectItem value="read">Lidas</SelectItem>
              <SelectItem value="failed">Falhadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages Table */}
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Nenhuma mensagem encontrada</p>
            <p className="text-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece enviando mensagens WhatsApp para seus leads'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Enviada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(message.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{message.leadName}</p>
                        {message.leadCompany && (
                          <p className="text-sm text-gray-600">{message.leadCompany}</p>
                        )}
                        <p className="text-xs text-gray-500">{message.phoneNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {message.templateName ? (
                        <Badge variant="outline">{message.templateName}</Badge>
                      ) : (
                        <span className="text-sm text-gray-500">Personalizada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm truncate max-w-xs">
                        {message.messageContent.length > 60
                          ? message.messageContent.substring(0, 60) + '...'
                          : message.messageContent}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(message.createdAt)}
                        </div>
                        {message.sentAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Enviada: {formatDateTime(message.sentAt)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className={statusColors[message.status]}
                        >
                          {statusLabels[message.status]}
                        </Badge>
                        {message.status === 'delivered' && message.deliveredAt && (
                          <p className="text-xs text-green-600">
                            {formatDateTime(message.deliveredAt)}
                          </p>
                        )}
                        {message.status === 'read' && message.readAt && (
                          <p className="text-xs text-purple-600">
                            Lida: {formatDateTime(message.readAt)}
                          </p>
                        )}
                        {message.status === 'failed' && message.errorMessage && (
                          <p className="text-xs text-red-600" title={message.errorMessage}>
                            {message.errorMessage.length > 20
                              ? message.errorMessage.substring(0, 20) + '...'
                              : message.errorMessage}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-gray-600">
              Mostrando {messages.length} de {total} mensagens
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="px-3 py-2 text-sm">
                {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}