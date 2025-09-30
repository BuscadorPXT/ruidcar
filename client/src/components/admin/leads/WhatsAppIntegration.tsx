import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  Send,
  Loader2,
  Users,
  CheckCircle,
  AlertCircle,
  Eye,
  Clock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: number;
  fullName: string;
  company?: string;
  email: string;
  whatsapp?: string;
  city?: string;
  state?: string;
  status: string;
}

interface WhatsAppTemplate {
  id: number;
  name: string;
  content: string;
  variables: string[];
  businessType?: string;
}

interface WhatsAppIntegrationProps {
  selectedLeads: Lead[];
  onSendComplete?: () => void;
}

interface BulkMessageData {
  messages: Array<{
    leadId: number;
    phone: string;
    message: string;
  }>;
  templateId?: number;
}

export default function WhatsAppIntegration({ selectedLeads, onSendComplete }: WhatsAppIntegrationProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [sendingMode, setSendingMode] = useState<'template' | 'custom'>('template');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewMessages, setPreviewMessages] = useState<Array<{lead: Lead, message: string}>>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async (): Promise<WhatsAppTemplate[]> => {
      const response = await fetch('/api/whatsapp/templates');
      if (!response.ok) {
        // Return mock data for now
        return [
          {
            id: 1,
            name: 'Primeiro Contato',
            content: 'Olá {nome}! 👋\n\nVi que você se interessou pelos nossos equipamentos de isolamento acústico para {empresa}.\n\nComo especialistas no segmento automotivo em {cidade}, temos soluções específicas para sua empresa.\n\nGostaria de agendar uma conversa de 15 minutos para entender melhor suas necessidades?\n\nAtenciosamente,\nEquipe RuidCar',
            variables: ['nome', 'empresa', 'cidade']
          },
          {
            id: 2,
            name: 'Follow-up Qualificado',
            content: 'Oi {nome}, tudo bem?\n\nNotei que você demonstrou interesse em nossos produtos para {empresa}.\n\nPreparei uma proposta específica que pode reduzir em até 70% o ruído em seus projetos.\n\nQuando seria um bom momento para conversarmos? Posso ligar hoje mesmo!\n\nAbraços,\nEquipe RuidCar',
            variables: ['nome', 'empresa']
          }
        ];
      }
      const data = await response.json();
      // Garantir que sempre retorne um array
      return Array.isArray(data) ? data : (data?.templates || data?.data || []);
    },
  });

  // Send messages mutation
  const sendMessagesMutation = useMutation({
    mutationFn: async (data: BulkMessageData) => {
      const response = await fetch('/api/whatsapp/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Tentar pegar a resposta JSON primeiro
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        // Se não for JSON, tentar texto
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to send messages');
      }

      // Se a resposta não foi ok mas temos JSON, retornar os dados mesmo assim
      // para permitir processamento parcial
      if (!response.ok && responseData) {
        console.error('WhatsApp bulk send error:', responseData);
        // Se houver algum resultado parcial, retornar para processamento
        if (responseData.results && Array.isArray(responseData.results)) {
          return responseData;
        }
        throw new Error(responseData.error || 'Failed to send messages');
      }

      return responseData;
    },
    onSuccess: (result) => {
      // Verificar se a resposta tem a estrutura esperada
      if (!result || !result.success) {
        toast({
          title: 'Erro ao processar resposta',
          description: 'A resposta do servidor não está no formato esperado',
          variant: 'destructive',
        });
        return;
      }

      // Processar estatísticas da resposta
      const successful = result.stats?.sent || result.results?.filter((r: any) => r.status === 'sent').length || 0;
      const failed = result.stats?.failed || result.results?.filter((r: any) => r.status === 'failed').length || 0;

      // Exibir toast com informações detalhadas
      if (successful > 0) {
        toast({
          title: 'Mensagens enviadas!',
          description: `${successful} mensagens enviadas com sucesso${failed > 0 ? `, ${failed} falharam` : ''} via Z-API. Status atualizado para "contato efetuado".`,
        });
      } else {
        toast({
          title: 'Nenhuma mensagem foi enviada',
          description: `${failed} mensagens falharam. Verifique os números de WhatsApp e tente novamente.`,
          variant: 'destructive',
        });
      }

      // Invalidar queries para atualizar o Kanban e listas de leads
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });

      if (onSendComplete) {
        onSendComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar mensagens',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Replace template variables
  const replaceTemplateVariables = (content: string, lead: Lead): string => {
    return content
      .replace(/{nome}/g, lead.fullName)
      .replace(/{empresa}/g, lead.company || 'sua empresa')
      .replace(/{cidade}/g, lead.city || '')
      .replace(/{estado}/g, lead.state || '')
      .replace(/{email}/g, lead.email);
  };

  // Filter leads with WhatsApp
  const leadsWithWhatsApp = selectedLeads.filter(lead => lead.whatsapp);
  const leadsWithoutWhatsApp = selectedLeads.length - leadsWithWhatsApp.length;

  // Handle send messages
  const handleSendMessages = () => {
    if (leadsWithWhatsApp.length === 0) {
      toast({
        title: 'Nenhum lead válido',
        description: 'Nenhum lead selecionado possui número de WhatsApp',
        variant: 'destructive',
      });
      return;
    }

    if (sendingMode === 'template' && !selectedTemplate) {
      toast({
        title: 'Template obrigatório',
        description: 'Selecione um template para continuar',
        variant: 'destructive',
      });
      return;
    }

    if (sendingMode === 'custom' && !customMessage.trim()) {
      toast({
        title: 'Mensagem obrigatória',
        description: 'Digite uma mensagem personalizada',
        variant: 'destructive',
      });
      return;
    }

    const messages = leadsWithWhatsApp.map(lead => ({
      leadId: lead.id,
      phone: lead.whatsapp!,
      message: sendingMode === 'template'
        ? replaceTemplateVariables(selectedTemplate!.content, lead)
        : customMessage
    }));

    sendMessagesMutation.mutate({
      messages,
      templateId: selectedTemplate?.id
    });
  };

  // Handle preview
  const handlePreview = () => {
    const messages = leadsWithWhatsApp.map(lead => ({
      lead,
      message: sendingMode === 'template'
        ? replaceTemplateVariables(selectedTemplate!.content, lead)
        : customMessage
    }));

    setPreviewMessages(messages);
    setShowPreviewDialog(true);
  };

  if (selectedLeads.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <MessageCircle className="h-5 w-5" />
            Envio via WhatsApp (Z-API)
          </CardTitle>
          <CardDescription className="text-green-700">
            Envie mensagens automáticas para os leads selecionados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selection Summary */}
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
              <Users className="h-3 w-3 mr-1" />
              {selectedLeads.length} selecionados
            </Badge>
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              {leadsWithWhatsApp.length} com WhatsApp
            </Badge>
            {leadsWithoutWhatsApp > 0 && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                {leadsWithoutWhatsApp} sem WhatsApp
              </Badge>
            )}
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              Sem limites diários
            </Badge>
          </div>

          {/* Message Type Selection */}
          <div className="flex gap-2">
            <Button
              variant={sendingMode === 'template' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSendingMode('template')}
              className={sendingMode === 'template' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Template
            </Button>
            <Button
              variant={sendingMode === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSendingMode('custom')}
              className={sendingMode === 'custom' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Mensagem Personalizada
            </Button>
          </div>

          {/* Template Selection */}
          {sendingMode === 'template' && (
            <div className="space-y-3">
              <Select
                onValueChange={(value) => {
                  const template = Array.isArray(templates) ?
                    templates.find(t => t.id === parseInt(value)) :
                    undefined;
                  setSelectedTemplate(template || null);
                }}
                disabled={templatesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={templatesLoading ? "Carregando templates..." : "Selecione um template"} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(templates) && templates.map(template => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                  {(!Array.isArray(templates) || templates.length === 0) && (
                    <SelectItem value="no-templates" disabled>
                      Nenhum template disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {selectedTemplate && (
                <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                  <strong className="text-green-800">Preview do template:</strong><br />
                  <div className="mt-2 whitespace-pre-wrap text-gray-700">
                    {replaceTemplateVariables(selectedTemplate.content, selectedLeads[0])}
                  </div>
                  {selectedTemplate.variables && Array.isArray(selectedTemplate.variables) && selectedTemplate.variables.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <span className="text-xs text-gray-500">Variáveis: </span>
                      {selectedTemplate.variables.map(variable => (
                        <code key={variable} className="bg-gray-100 px-1 py-0.5 rounded text-xs mr-1">
                          {'{' + variable + '}'}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Custom Message */}
          {sendingMode === 'custom' && (
            <div className="space-y-3">
              <Textarea
                placeholder="Digite sua mensagem personalizada para todos os leads selecionados..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-600">
                A mesma mensagem será enviada para todos os leads selecionados
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handlePreview}
              variant="outline"
              size="sm"
              disabled={
                (sendingMode === 'template' && !selectedTemplate) ||
                (sendingMode === 'custom' && !customMessage.trim()) ||
                leadsWithWhatsApp.length === 0
              }
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar Mensagens
            </Button>
            <Button
              onClick={handleSendMessages}
              disabled={
                (sendingMode === 'template' && !selectedTemplate) ||
                (sendingMode === 'custom' && !customMessage.trim()) ||
                sendMessagesMutation.isPending ||
                leadsWithWhatsApp.length === 0
              }
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {sendMessagesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar para {leadsWithWhatsApp.length} leads
            </Button>
          </div>

          {/* Warnings */}
          {leadsWithoutWhatsApp > 0 && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              {leadsWithoutWhatsApp} lead(s) não possuem número de WhatsApp e serão ignorados
            </div>
          )}

          {leadsWithWhatsApp.length > 0 && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
              <Clock className="h-3 w-3 inline mr-1" />
              Mensagens serão enviadas com intervalo de 0.5s entre cada uma para garantir entrega
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview das Mensagens</DialogTitle>
            <DialogDescription>
              Visualize como as mensagens ficarão para cada lead antes de enviar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-auto">
            {previewMessages.map(({ lead, message }) => (
              <div key={lead.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{lead.fullName}</h4>
                    <p className="text-sm text-gray-600">{lead.company}</p>
                    <p className="text-xs text-gray-500">{lead.whatsapp}</p>
                  </div>
                  <Badge variant="outline">{lead.status}</Badge>
                </div>
                <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                  {message}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendMessages} disabled={sendMessagesMutation.isPending}>
              {sendMessagesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Confirmar e Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}