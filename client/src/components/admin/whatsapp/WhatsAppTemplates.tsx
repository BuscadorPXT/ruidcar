import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit3,
  Eye,
  Trash2,
  MessageCircle,
  Copy,
  Users
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppTemplate {
  id: number;
  name: string;
  content: string;
  variables: string[];
  business_type?: string;
  lead_status: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export default function WhatsAppTemplates() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    business_type: '',
    lead_status: [] as string[]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async (): Promise<WhatsAppTemplate[]> => {
      const response = await fetch('/api/whatsapp/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      // Backend returns { success: true, templates: [...] }
      return data.templates || [];
    },
    refetchInterval: 30000,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      setIsCreateDialogOpen(false);
      setNewTemplate({ name: '', content: '', business_type: '', lead_status: [] });
      toast({
        title: 'Template criado!',
        description: 'O template foi criado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o template.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e conteúdo são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    // Extract variables from template content
    const variableMatches = newTemplate.content.match(/\{(\w+)\}/g) || [];
    const variables = variableMatches.map(match => match.replace(/[{}]/g, ''));

    createTemplateMutation.mutate({
      ...newTemplate,
      variables,
    });
  };

  const handlePreview = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast({
      title: 'Copiado!',
      description: 'Template copiado para a área de transferência.',
    });
  };

  const replaceTemplateVariables = (content: string) => {
    return content
      .replace('{nome}', 'João Silva')
      .replace('{empresa}', 'Auto Center Silva')
      .replace('{cidade}', 'São Paulo')
      .replace('{businessType}', 'Auto Center')
      .replace('{vendedor}', 'Carlos Santos');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Templates WhatsApp
              </CardTitle>
              <CardDescription>
                Gerencie templates de mensagens para automação
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!templates || templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Nenhum template encontrado</p>
              <p className="text-sm mb-4">Crie seu primeiro template para começar a automação</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.content.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handlePreview(template)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(template.content)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                    </Badge>
                    {template.business_type && (
                      <Badge variant="secondary">
                        {template.business_type}
                      </Badge>
                    )}
                    {template.lead_status && template.lead_status.map(status => (
                      <Badge key={status} variant="outline">
                        {status}
                      </Badge>
                    ))}
                  </div>

                  {template.variables.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Variáveis:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <code key={variable} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {'{' + variable + '}'}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Template</DialogTitle>
            <DialogDescription>
              Crie um template personalizado para envio automático
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Template</label>
              <Input
                placeholder="Ex: Primeiro Contato"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Conteúdo da Mensagem</label>
              <Textarea
                placeholder="Digite a mensagem... Use {variavel} para campos dinâmicos como {nome}, {empresa}, {cidade}"
                rows={8}
                value={newTemplate.content}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Variáveis disponíveis: {'{nome}'}, {'{empresa}'}, {'{cidade}'}, {'{businessType}'}, {'{vendedor}'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Negócio (Opcional)</label>
              <Select onValueChange={(value) => setNewTemplate(prev => ({ ...prev, business_type: value === 'all' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de negócio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Montadora">Montadora</SelectItem>
                  <SelectItem value="Auto Center">Auto Center</SelectItem>
                  <SelectItem value="Oficina Mecânica">Oficina Mecânica</SelectItem>
                  <SelectItem value="Concessionária">Concessionária</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTemplate} disabled={createTemplateMutation.isPending}>
              {createTemplateMutation.isPending ? 'Criando...' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Visualize como a mensagem ficará para o lead
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Conteúdo Original:</label>
              <div className="bg-gray-50 p-3 rounded border text-sm font-mono whitespace-pre-wrap">
                {selectedTemplate?.content}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Preview com dados de exemplo:</label>
              <div className="bg-blue-50 p-3 rounded border text-sm whitespace-pre-wrap">
                {selectedTemplate && replaceTemplateVariables(selectedTemplate.content)}
              </div>
            </div>

            {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Variáveis utilizadas:</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map(variable => (
                    <Badge key={variable} variant="outline">
                      {'{' + variable + '}'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => selectedTemplate && handleCopy(selectedTemplate.content)}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}