import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Power,
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  Save,
  Check,
  X,
  Plus,
  Edit2,
  Trash2,
  Info,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WorkshopLayout from '@/components/workshop/WorkshopLayout';
import SlotManagement from '@/components/workshop/SlotManagement';
import ExceptionsManagement from '@/components/workshop/ExceptionsManagement';
import GeneralSettings from '@/components/workshop/GeneralSettings';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Tipos
interface DiagnosticServiceConfig {
  id: number;
  workshopId: number;
  isActive: boolean;
  status: 'disabled' | 'configuring' | 'active' | 'suspended';
  suspensionReason?: string;
  validation?: {
    canActivate: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface VehiclePricing {
  id?: number;
  category: 'popular' | 'medium' | 'luxury';
  price: number;
  estimatedDuration: number;
}

interface AppointmentSlot {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  bufferMinutes: number;
  isActive: boolean;
}

interface AppointmentSettings {
  minAdvanceHours: number;
  maxAdvanceDays: number;
  cancellationHours: number;
  noShowTolerance: number;
  autoConfirm: boolean;
  sendReminders: boolean;
  reminderHours: number;
}

// Constantes
const CATEGORY_LABELS = {
  popular: 'Popular / Linha Leve',
  medium: 'Linha Média / SUV / Picape',
  luxury: 'Luxo / Premium'
};

const WEEKDAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

const STATUS_CONFIG = {
  disabled: {
    label: 'Desativado',
    color: 'bg-gray-500',
    description: 'O serviço não está disponível para agendamentos'
  },
  configuring: {
    label: 'Em Configuração',
    color: 'bg-yellow-500',
    description: 'Complete a configuração para ativar o serviço'
  },
  active: {
    label: 'Ativo',
    color: 'bg-green-500',
    description: 'O serviço está disponível para agendamentos'
  },
  suspended: {
    label: 'Suspenso',
    color: 'bg-red-500',
    description: 'O serviço está temporariamente suspenso'
  }
};

export default function DiagnosticConfig() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simular workshop ID (em produção, vir do contexto de auth)
  const workshopId = 1;

  // ========== QUERIES ==========

  // Buscar configuração do serviço
  const { data: serviceConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ['diagnostic-config', workshopId],
    queryFn: async () => {
      const response = await fetch(`/api/workshop/diagnostic/status`, {
        headers: {
          'x-workshop-id': workshopId.toString()
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar configuração');
      const result = await response.json();
      return result.data as DiagnosticServiceConfig;
    }
  });

  // Buscar preços
  const { data: pricing = [], isLoading: loadingPricing } = useQuery({
    queryKey: ['diagnostic-pricing', workshopId],
    queryFn: async () => {
      const response = await fetch(`/api/workshop/diagnostic/pricing`, {
        headers: {
          'x-workshop-id': workshopId.toString()
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar preços');
      const result = await response.json();
      return result.data as VehiclePricing[];
    }
  });

  // Buscar slots
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['diagnostic-slots', workshopId],
    queryFn: async () => {
      const response = await fetch(`/api/workshop/diagnostic/slots`, {
        headers: {
          'x-workshop-id': workshopId.toString()
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar disponibilidade');
      const result = await response.json();
      return result.data as AppointmentSlot[];
    }
  });

  // Buscar configurações gerais
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['diagnostic-settings', workshopId],
    queryFn: async () => {
      // Retornar valores padrão se não existir
      return {
        minAdvanceHours: 2,
        maxAdvanceDays: 30,
        cancellationHours: 24,
        noShowTolerance: 15,
        autoConfirm: false,
        sendReminders: true,
        reminderHours: 24
      } as AppointmentSettings;
    }
  });

  // ========== MUTATIONS ==========

  // Toggle do serviço
  const toggleServiceMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      const response = await fetch(`/api/workshop/diagnostic/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workshop-id': workshopId.toString()
        },
        body: JSON.stringify({ activate })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao alterar serviço');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-config'] });
      toast({
        title: 'Sucesso',
        description: data.message
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Atualizar preço
  const updatePricingMutation = useMutation({
    mutationFn: async (pricingData: VehiclePricing) => {
      const response = await fetch(`/api/workshop/diagnostic/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-workshop-id': workshopId.toString()
        },
        body: JSON.stringify(pricingData)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar preço');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostic-config'] });
      toast({
        title: 'Sucesso',
        description: 'Preço atualizado com sucesso'
      });
    }
  });

  // ========== COMPONENTES ==========

  // Componente de Status do Serviço
  const ServiceStatusCard = () => {
    const status = serviceConfig?.status || 'disabled';
    const config = STATUS_CONFIG[status];

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status do Serviço</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
            <Badge className={`${config.color} text-white`}>
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle de Ativação */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Power className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">Serviço de Diagnóstico</p>
                <p className="text-sm text-gray-500">
                  {serviceConfig?.isActive ? 'Ativo' : 'Desativado'}
                </p>
              </div>
            </div>
            <Switch
              checked={serviceConfig?.isActive || false}
              onCheckedChange={(checked) => toggleServiceMutation.mutate(checked)}
              disabled={toggleServiceMutation.isPending}
            />
          </div>

          {/* Validações */}
          {serviceConfig?.validation && !serviceConfig.validation.canActivate && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Não é possível ativar o serviço:</p>
                <ul className="list-disc list-inside space-y-1">
                  {serviceConfig.validation.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {serviceConfig?.validation?.warnings && serviceConfig.validation.warnings.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {serviceConfig.validation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  // Componente de Configuração de Preços
  const PricingConfig = () => {
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [priceForm, setPriceForm] = useState<VehiclePricing>({
      category: 'popular',
      price: 0,
      estimatedDuration: 60
    });

    const categories: Array<'popular' | 'medium' | 'luxury'> = ['popular', 'medium', 'luxury'];

    const handleSavePrice = () => {
      // Converter preço para centavos
      const dataToSave = {
        ...priceForm,
        price: Math.round(priceForm.price * 100)
      };

      updatePricingMutation.mutate(dataToSave);
      setEditingCategory(null);
    };

    const getPriceForCategory = (category: string) => {
      const price = pricing.find(p => p.category === category);
      return price ? price.price / 100 : 0;
    };

    const getDurationForCategory = (category: string) => {
      const price = pricing.find(p => p.category === category);
      return price ? price.estimatedDuration : 60;
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Preços por Categoria</h3>
          <Badge variant="outline">
            {pricing.length}/3 categorias configuradas
          </Badge>
        </div>

        <div className="grid gap-4">
          {categories.map(category => {
            const isEditing = editingCategory === category;
            const currentPrice = getPriceForCategory(category);
            const currentDuration = getDurationForCategory(category);
            const hasPrice = currentPrice > 0;

            return (
              <Card key={category} className={!hasPrice ? 'border-orange-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{CATEGORY_LABELS[category]}</h4>
                      {!isEditing ? (
                        <div className="mt-2 flex items-center gap-4">
                          {hasPrice ? (
                            <>
                              <span className="text-2xl font-bold">
                                R$ {currentPrice.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-sm text-gray-500">
                                {currentDuration} minutos
                              </span>
                            </>
                          ) : (
                            <span className="text-red-500">Não configurado</span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Preço (R$)"
                              className="px-3 py-2 border rounded-md flex-1"
                              value={priceForm.price}
                              onChange={(e) => setPriceForm({
                                ...priceForm,
                                category,
                                price: parseFloat(e.target.value) || 0
                              })}
                            />
                            <input
                              type="number"
                              placeholder="Duração (min)"
                              className="px-3 py-2 border rounded-md w-32"
                              value={priceForm.estimatedDuration}
                              onChange={(e) => setPriceForm({
                                ...priceForm,
                                estimatedDuration: parseInt(e.target.value) || 60
                              })}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSavePrice}
                              disabled={updatePricingMutation.isPending}
                            >
                              {updatePricingMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCategory(null)}
                            >
                              <X className="h-4 w-4" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCategory(category);
                          setPriceForm({
                            category,
                            price: currentPrice,
                            estimatedDuration: currentDuration
                          });
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Configure preços para todas as categorias antes de ativar o serviço.
            Os valores devem refletir o custo do diagnóstico completo.
          </AlertDescription>
        </Alert>
      </div>
    );
  };


  // Loading state
  if (loadingConfig) {
    return (
      <WorkshopLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </WorkshopLayout>
    );
  }

  return (
    <WorkshopLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configuração do Diagnóstico RuidCar
          </h1>
          <p className="text-gray-600 mt-1">
            Configure e gerencie o serviço de diagnóstico da sua oficina
          </p>
        </div>

        {/* Status Card */}
        <ServiceStatusCard />

        {/* Tabs de Configuração */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="pricing">Preços</TabsTrigger>
            <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0%</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardContent className="p-6">
                <PricingConfig />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <SlotManagement slots={slots} workshopId={workshopId} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <ExceptionsManagement workshopId={workshopId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <GeneralSettings workshopId={workshopId} />
          </TabsContent>
        </Tabs>
      </div>
    </WorkshopLayout>
  );
}