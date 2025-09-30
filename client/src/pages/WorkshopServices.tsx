import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  Clock,
  Tag,
  Settings,
  CheckCircle,
  Package,
  Calculator,
  TrendingUp,
  Percent,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkshopLayout from '@/components/workshop/WorkshopLayout';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  estimatedTime: number; // em minutos
  isActive: boolean;
  requiresDiagnosis: boolean;
  popularityScore?: number;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  services: string[]; // IDs dos serviços incluídos
  price: number;
  discount: number; // percentual
  isActive: boolean;
}

interface PricingRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  condition: string;
  isActive: boolean;
}

const serviceCategories = [
  'Diagnóstico',
  'Suspensão',
  'Freios',
  'Motor',
  'Transmissão',
  'Elétrica',
  'Ar Condicionado',
  'Alinhamento e Balanceamento',
  'Manutenção Preventiva',
  'Outros'
];

export default function WorkshopServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [serviceForm, setServiceForm] = useState<Partial<Service>>({
    name: '',
    description: '',
    category: 'Diagnóstico',
    basePrice: 0,
    estimatedTime: 60,
    isActive: true,
    requiresDiagnosis: false
  });

  const [packageForm, setPackageForm] = useState<Partial<ServicePackage>>({
    name: '',
    description: '',
    services: [],
    price: 0,
    discount: 0,
    isActive: true
  });

  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      // Mock data - substituir por chamada real à API
      const mockServices: Service[] = [
        {
          id: '1',
          name: 'Diagnóstico RuidCar',
          description: 'Diagnóstico completo de ruídos com equipamento especializado',
          category: 'Diagnóstico',
          basePrice: 15000,
          estimatedTime: 60,
          isActive: true,
          requiresDiagnosis: false,
          popularityScore: 95
        },
        {
          id: '2',
          name: 'Troca de Pastilhas de Freio',
          description: 'Substituição das pastilhas de freio dianteiras ou traseiras',
          category: 'Freios',
          basePrice: 25000,
          estimatedTime: 90,
          isActive: true,
          requiresDiagnosis: true,
          popularityScore: 85
        },
        {
          id: '3',
          name: 'Alinhamento 3D',
          description: 'Alinhamento computadorizado com tecnologia 3D',
          category: 'Alinhamento e Balanceamento',
          basePrice: 12000,
          estimatedTime: 45,
          isActive: true,
          requiresDiagnosis: false,
          popularityScore: 90
        },
        {
          id: '4',
          name: 'Troca de Óleo e Filtro',
          description: 'Troca de óleo do motor e filtro de óleo',
          category: 'Manutenção Preventiva',
          basePrice: 18000,
          estimatedTime: 30,
          isActive: true,
          requiresDiagnosis: false,
          popularityScore: 88
        }
      ];

      const mockPackages: ServicePackage[] = [
        {
          id: '1',
          name: 'Revisão Completa',
          description: 'Pacote completo de manutenção preventiva',
          services: ['1', '4'],
          price: 30000,
          discount: 10,
          isActive: true
        },
        {
          id: '2',
          name: 'Combo Segurança',
          description: 'Diagnóstico + Freios + Alinhamento',
          services: ['1', '2', '3'],
          price: 48000,
          discount: 15,
          isActive: true
        }
      ];

      setServices(mockServices);
      setPackages(mockPackages);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar serviços',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Aqui seria a chamada real à API
      console.log('Salvando serviços:', { services, packages, pricingRules });

      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Sucesso',
        description: 'Serviços atualizados com sucesso',
      });

      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar serviços:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar serviços',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      description: '',
      category: 'Diagnóstico',
      basePrice: 0,
      estimatedTime: 60,
      isActive: true,
      requiresDiagnosis: false
    });
    setIsServiceModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = () => {
    if (!serviceForm.name || !serviceForm.basePrice) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    if (editingService) {
      // Editar serviço existente
      setServices(services.map(s =>
        s.id === editingService.id
          ? { ...s, ...serviceForm } as Service
          : s
      ));
    } else {
      // Adicionar novo serviço
      const newService: Service = {
        id: Date.now().toString(),
        name: serviceForm.name!,
        description: serviceForm.description || '',
        category: serviceForm.category || 'Outros',
        basePrice: serviceForm.basePrice!,
        estimatedTime: serviceForm.estimatedTime || 60,
        isActive: serviceForm.isActive !== false,
        requiresDiagnosis: serviceForm.requiresDiagnosis || false
      };
      setServices([...services, newService]);
    }

    setIsServiceModalOpen(false);
    setHasChanges(true);
    toast({
      title: 'Sucesso',
      description: editingService ? 'Serviço atualizado' : 'Serviço adicionado',
    });
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
    setHasChanges(true);
    toast({
      title: 'Sucesso',
      description: 'Serviço removido',
    });
  };

  const handleToggleServiceStatus = (id: string) => {
    setServices(services.map(s =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
    setHasChanges(true);
  };

  const handleAddPackage = () => {
    setEditingPackage(null);
    setPackageForm({
      name: '',
      description: '',
      services: [],
      price: 0,
      discount: 0,
      isActive: true
    });
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = () => {
    if (!packageForm.name || !packageForm.price || packageForm.services?.length === 0) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    if (editingPackage) {
      setPackages(packages.map(p =>
        p.id === editingPackage.id
          ? { ...p, ...packageForm } as ServicePackage
          : p
      ));
    } else {
      const newPackage: ServicePackage = {
        id: Date.now().toString(),
        name: packageForm.name!,
        description: packageForm.description || '',
        services: packageForm.services!,
        price: packageForm.price!,
        discount: packageForm.discount || 0,
        isActive: packageForm.isActive !== false
      };
      setPackages([...packages, newPackage]);
    }

    setIsPackageModalOpen(false);
    setHasChanges(true);
    toast({
      title: 'Sucesso',
      description: editingPackage ? 'Pacote atualizado' : 'Pacote adicionado',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const calculatePackageOriginalPrice = (pkg: ServicePackage) => {
    return pkg.services.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.basePrice || 0);
    }, 0);
  };

  const getServicesByCategory = (category: string) => {
    return services.filter(s => s.category === category);
  };

  if (loading) {
    return (
      <WorkshopLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Carregando serviços...</p>
          </div>
        </div>
      </WorkshopLayout>
    );
  }

  return (
    <WorkshopLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Serviços e Preços</h1>
            <p className="text-gray-600 mt-1">Configure os serviços e pacotes da sua oficina</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline">
              {services.filter(s => s.isActive).length} serviços ativos
            </Badge>
            <Badge variant="outline">
              {packages.filter(p => p.isActive).length} pacotes ativos
            </Badge>
          </div>
        </div>

        {/* Alert sobre alterações */}
        {hasChanges && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicá-las.
            </AlertDescription>
          </Alert>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  services.reduce((sum, s) => sum + s.basePrice, 0) / services.length || 0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tempo Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(
                  Math.round(services.reduce((sum, s) => sum + s.estimatedTime, 0) / services.length || 0)
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pacotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packages.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="packages">Pacotes</TabsTrigger>
            <TabsTrigger value="pricing">Precificação</TabsTrigger>
          </TabsList>

          {/* Tab: Serviços */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Catálogo de Serviços</CardTitle>
                    <CardDescription>
                      Gerencie todos os serviços oferecidos pela sua oficina
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddService}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Serviço
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {serviceCategories.map(category => {
                    const categoryServices = getServicesByCategory(category);
                    if (categoryServices.length === 0) return null;

                    return (
                      <div key={category}>
                        <h3 className="font-semibold text-sm text-gray-700 mb-3">{category}</h3>
                        <div className="space-y-2">
                          {categoryServices.map(service => (
                            <motion.div
                              key={service.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <Wrench className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="font-medium">{service.name}</p>
                                    <p className="text-sm text-gray-600">{service.description}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        {formatCurrency(service.basePrice)}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(service.estimatedTime)}
                                      </span>
                                      {service.requiresDiagnosis && (
                                        <Badge variant="outline" className="text-xs">
                                          Requer diagnóstico
                                        </Badge>
                                      )}
                                      {service.popularityScore && service.popularityScore > 80 && (
                                        <Badge className="bg-green-500 text-xs">
                                          Popular
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={service.isActive}
                                  onCheckedChange={() => handleToggleServiceStatus(service.id)}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditService(service)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteService(service.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Pacotes */}
          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Pacotes de Serviços</CardTitle>
                    <CardDescription>
                      Crie combos com desconto para aumentar o ticket médio
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddPackage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Pacote
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {packages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum pacote criado</p>
                    <p className="text-sm mt-1">Crie pacotes para oferecer combos com desconto</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packages.map(pkg => {
                      const originalPrice = calculatePackageOriginalPrice(pkg);
                      const finalPrice = pkg.price;
                      const savings = originalPrice - finalPrice;

                      return (
                        <Card key={pkg.id} className="relative">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                                <CardDescription>{pkg.description}</CardDescription>
                              </div>
                              <Badge className={pkg.isActive ? 'bg-green-500' : 'bg-gray-400'}>
                                {pkg.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-2">Serviços incluídos:</p>
                                <div className="space-y-1">
                                  {pkg.services.map(serviceId => {
                                    const service = services.find(s => s.id === serviceId);
                                    return service ? (
                                      <div key={serviceId} className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3 text-green-500" />
                                          {service.name}
                                        </span>
                                        <span className="text-gray-500">
                                          {formatCurrency(service.basePrice)}
                                        </span>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Valor original:</span>
                                  <span className="line-through text-gray-400">
                                    {formatCurrency(originalPrice)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Desconto:</span>
                                  <span className="text-red-500">
                                    {pkg.discount}% ({formatCurrency(savings)})
                                  </span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                  <span>Valor do pacote:</span>
                                  <span className="text-lg text-green-600">
                                    {formatCurrency(finalPrice)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Precificação */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estratégias de Precificação</CardTitle>
                <CardDescription>
                  Configure regras de desconto e ajustes de preço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Diagnóstico RuidCar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Preço do Diagnóstico</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              placeholder="150.00"
                              className="pl-10"
                            />
                          </div>
                          <Button variant="outline">Atualizar</Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Desconto para cliente recorrente</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Percent className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              placeholder="10"
                              className="pl-10"
                            />
                          </div>
                          <Button variant="outline">Aplicar</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Análise de Margem</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Margem Média</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">42%</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Serviço + Lucrativo</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold">Diagnóstico RuidCar</div>
                          <p className="text-sm text-gray-600">Margem: 65%</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">ROI Médio</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">3.2x</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Alert>
                    <Calculator className="h-4 w-4" />
                    <AlertDescription>
                      Dica: Ofereça pacotes com 10-15% de desconto para aumentar o ticket médio mantendo boa margem.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de ação */}
        <Card>
          <CardContent className="flex justify-end gap-3 p-4">
            <Button
              variant="outline"
              onClick={loadServices}
              disabled={saving}
            >
              Cancelar Alterações
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Modal de Serviço */}
        <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Serviço' : 'Adicionar Serviço'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do serviço
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="serviceName">Nome do Serviço *</Label>
                <Input
                  id="serviceName"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="Ex: Diagnóstico de Suspensão"
                />
              </div>

              <div>
                <Label htmlFor="serviceDescription">Descrição</Label>
                <Textarea
                  id="serviceDescription"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Descreva o serviço..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceCategory">Categoria</Label>
                  <Select
                    value={serviceForm.category}
                    onValueChange={(value) => setServiceForm({ ...serviceForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="servicePrice">Preço (R$) *</Label>
                  <Input
                    id="servicePrice"
                    type="number"
                    value={serviceForm.basePrice ? (serviceForm.basePrice / 100).toFixed(2) : ''}
                    onChange={(e) => setServiceForm({
                      ...serviceForm,
                      basePrice: Math.round(parseFloat(e.target.value) * 100)
                    })}
                    placeholder="150.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceTime">Tempo Estimado (minutos)</Label>
                  <Input
                    id="serviceTime"
                    type="number"
                    value={serviceForm.estimatedTime}
                    onChange={(e) => setServiceForm({
                      ...serviceForm,
                      estimatedTime: parseInt(e.target.value)
                    })}
                    placeholder="60"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={serviceForm.requiresDiagnosis}
                      onCheckedChange={(checked) => setServiceForm({
                        ...serviceForm,
                        requiresDiagnosis: checked
                      })}
                    />
                    <Label className="cursor-pointer">Requer diagnóstico prévio</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={serviceForm.isActive}
                      onCheckedChange={(checked) => setServiceForm({
                        ...serviceForm,
                        isActive: checked
                      })}
                    />
                    <Label className="cursor-pointer">Serviço ativo</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsServiceModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveService}>
                {editingService ? 'Salvar Alterações' : 'Adicionar Serviço'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Pacote */}
        <Dialog open={isPackageModalOpen} onOpenChange={setIsPackageModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? 'Editar Pacote' : 'Criar Pacote'}
              </DialogTitle>
              <DialogDescription>
                Configure um pacote de serviços com desconto
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="packageName">Nome do Pacote *</Label>
                <Input
                  id="packageName"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="Ex: Revisão Completa"
                />
              </div>

              <div>
                <Label htmlFor="packageDescription">Descrição</Label>
                <Textarea
                  id="packageDescription"
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="Descreva o pacote..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Serviços Incluídos *</Label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {services.map(service => (
                    <div key={service.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`pkg-service-${service.id}`}
                        checked={packageForm.services?.includes(service.id)}
                        onChange={(e) => {
                          const newServices = e.target.checked
                            ? [...(packageForm.services || []), service.id]
                            : packageForm.services?.filter(id => id !== service.id) || [];
                          setPackageForm({ ...packageForm, services: newServices });
                        }}
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor={`pkg-service-${service.id}`}
                        className="cursor-pointer text-sm font-normal flex-1"
                      >
                        {service.name} - {formatCurrency(service.basePrice)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="packagePrice">Preço do Pacote (R$) *</Label>
                  <Input
                    id="packagePrice"
                    type="number"
                    value={packageForm.price ? (packageForm.price / 100).toFixed(2) : ''}
                    onChange={(e) => setPackageForm({
                      ...packageForm,
                      price: Math.round(parseFloat(e.target.value) * 100)
                    })}
                    placeholder="300.00"
                  />
                </div>

                <div>
                  <Label htmlFor="packageDiscount">Desconto (%)</Label>
                  <Input
                    id="packageDiscount"
                    type="number"
                    value={packageForm.discount}
                    onChange={(e) => setPackageForm({
                      ...packageForm,
                      discount: parseInt(e.target.value)
                    })}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={packageForm.isActive}
                  onCheckedChange={(checked) => setPackageForm({
                    ...packageForm,
                    isActive: checked
                  })}
                />
                <Label className="cursor-pointer">Pacote ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPackageModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePackage}>
                {editingPackage ? 'Salvar Alterações' : 'Criar Pacote'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </WorkshopLayout>
  );
}