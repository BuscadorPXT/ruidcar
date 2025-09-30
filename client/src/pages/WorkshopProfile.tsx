import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Save,
  Upload,
  Camera,
  AlertCircle,
  CheckCircle,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  DollarSign,
  Shield,
  Award,
  FileText,
  Trash2,
  Plus,
  Edit2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WorkshopLayout from '@/components/workshop/WorkshopLayout';
import { useToast } from '@/hooks/use-toast';
import { CEPField } from '@/components/CEPField';

interface WorkshopProfile {
  id: number;
  uniqueCode: string;
  name: string;
  description?: string;
  address: string;
  cep: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  openingHours: {
    [key: string]: {
      isOpen: boolean;
      open?: string;
      close?: string;
    };
  };
  services: string[];
  specialties: string[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    year: string;
  }[];
  images: {
    logo?: string;
    cover?: string;
    gallery: string[];
  };
  diagnosisPrice?: number;
  paymentMethods: string[];
  active: boolean;
}

const defaultOpeningHours = {
  segunda: { isOpen: true, open: '08:00', close: '18:00' },
  terca: { isOpen: true, open: '08:00', close: '18:00' },
  quarta: { isOpen: true, open: '08:00', close: '18:00' },
  quinta: { isOpen: true, open: '08:00', close: '18:00' },
  sexta: { isOpen: true, open: '08:00', close: '18:00' },
  sabado: { isOpen: true, open: '08:00', close: '12:00' },
  domingo: { isOpen: false, open: '', close: '' }
};

const availableServices = [
  'Diagnóstico RuidCar',
  'Troca de óleo',
  'Alinhamento',
  'Balanceamento',
  'Suspensão',
  'Freios',
  'Motor',
  'Transmissão',
  'Ar condicionado',
  'Elétrica'
];

const paymentMethodsList = [
  'Dinheiro',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Boleto',
  'Cheque'
];

export default function WorkshopProfile() {
  const [profile, setProfile] = useState<WorkshopProfile>({
    id: 1,
    uniqueCode: 'RCW-0001',
    name: '',
    description: '',
    address: '',
    cep: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    website: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    openingHours: defaultOpeningHours,
    services: [],
    specialties: [],
    certifications: [],
    images: {
      logo: '',
      cover: '',
      gallery: []
    },
    diagnosisPrice: 0,
    paymentMethods: [],
    active: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [newCertification, setNewCertification] = useState({
    name: '',
    issuer: '',
    year: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Mock data - substituir por chamada real à API
      const mockProfile: WorkshopProfile = {
        id: 1,
        uniqueCode: 'RCW-0001',
        name: 'Oficina Exemplo',
        description: 'Especializada em diagnóstico e reparo de ruídos automotivos',
        address: 'Rua das Oficinas, 123',
        cep: '01234-567',
        city: 'São Paulo',
        state: 'SP',
        phone: '(11) 99999-9999',
        email: 'contato@oficinaexemplo.com.br',
        website: 'www.oficinaexemplo.com.br',
        instagram: '@oficinaexemplo',
        openingHours: defaultOpeningHours,
        services: ['Diagnóstico RuidCar', 'Suspensão', 'Freios'],
        specialties: ['Ruídos', 'Suspensão'],
        certifications: [
          {
            id: '1',
            name: 'Certificação RuidCar',
            issuer: 'RuidCar Brasil',
            year: '2023'
          }
        ],
        images: {
          logo: '',
          cover: '',
          gallery: []
        },
        diagnosisPrice: 15000, // em centavos
        paymentMethods: ['PIX', 'Cartão de Crédito', 'Dinheiro'],
        active: true
      };

      setProfile(mockProfile);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do perfil',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Aqui seria a chamada real à API
      console.log('Salvando perfil:', profile);

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso',
      });

      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar perfil',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfile({ ...profile, [field]: value });
    setHasChanges(true);
  };

  const handleOpeningHoursChange = (day: string, field: string, value: any) => {
    setProfile({
      ...profile,
      openingHours: {
        ...profile.openingHours,
        [day]: {
          ...profile.openingHours[day],
          [field]: value
        }
      }
    });
    setHasChanges(true);
  };

  const handleServiceToggle = (service: string) => {
    const services = profile.services.includes(service)
      ? profile.services.filter(s => s !== service)
      : [...profile.services, service];

    setProfile({ ...profile, services });
    setHasChanges(true);
  };

  const handlePaymentMethodToggle = (method: string) => {
    const methods = profile.paymentMethods.includes(method)
      ? profile.paymentMethods.filter(m => m !== method)
      : [...profile.paymentMethods, method];

    setProfile({ ...profile, paymentMethods: methods });
    setHasChanges(true);
  };

  const handleAddCertification = () => {
    if (newCertification.name && newCertification.issuer && newCertification.year) {
      const certification = {
        id: Date.now().toString(),
        ...newCertification
      };

      setProfile({
        ...profile,
        certifications: [...profile.certifications, certification]
      });

      setNewCertification({ name: '', issuer: '', year: '' });
      setHasChanges(true);
    }
  };

  const handleRemoveCertification = (id: string) => {
    setProfile({
      ...profile,
      certifications: profile.certifications.filter(c => c.id !== id)
    });
    setHasChanges(true);
  };

  const handleCEPChange = (cep: string, data?: any) => {
    setProfile({ ...profile, cep });

    if (data?.valid) {
      if (data.logradouro) {
        setProfile(prev => ({ ...prev, address: data.logradouro }));
      }
      if (data.localidade) {
        setProfile(prev => ({ ...prev, city: data.localidade }));
      }
      if (data.uf) {
        setProfile(prev => ({ ...prev, state: data.uf }));
      }
    }
    setHasChanges(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  if (loading) {
    return (
      <WorkshopLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Carregando perfil...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Perfil da Oficina</h1>
            <p className="text-gray-600 mt-1">Gerencie as informações da sua oficina</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Código: {profile.uniqueCode}
            </Badge>
            {profile.active ? (
              <Badge className="bg-green-500">Ativa</Badge>
            ) : (
              <Badge variant="secondary">Aguardando Aprovação</Badge>
            )}
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informações</TabsTrigger>
            <TabsTrigger value="hours">Horários</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="certifications">Certificações</TabsTrigger>
          </TabsList>

          {/* Tab: Informações Básicas */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Dados principais da sua oficina que aparecem para os clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Oficina</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nome completo da oficina"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={profile.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descreva sua oficina, especialidades e diferenciais..."
                    rows={4}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Endereço</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <CEPField
                        value={profile.cep}
                        onCEPChange={handleCEPChange}
                        label="CEP"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={profile.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Rua, número, complemento"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={profile.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Cidade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={profile.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Presença Online</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="contato@oficina.com.br"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="website"
                          value={profile.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="www.suaoficina.com.br"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="instagram"
                          value={profile.instagram}
                          onChange={(e) => handleInputChange('instagram', e.target.value)}
                          placeholder="@suaoficina"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <div className="relative">
                        <Facebook className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="facebook"
                          value={profile.facebook}
                          onChange={(e) => handleInputChange('facebook', e.target.value)}
                          placeholder="facebook.com/suaoficina"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Horários */}
          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Horários de Funcionamento</CardTitle>
                <CardDescription>
                  Configure os horários de atendimento da sua oficina
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(profile.openingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-32">
                        <Label className="capitalize">{day}-feira</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={hours.isOpen}
                          onCheckedChange={(checked) => handleOpeningHoursChange(day, 'isOpen', checked)}
                        />
                        <span className="text-sm text-gray-600">
                          {hours.isOpen ? 'Aberto' : 'Fechado'}
                        </span>
                      </div>

                      {hours.isOpen && (
                        <div className="flex items-center gap-2 ml-auto">
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                            className="w-32"
                          />
                          <span>às</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Serviços */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Serviços Oferecidos</CardTitle>
                <CardDescription>
                  Marque todos os serviços que sua oficina oferece
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Serviços Disponíveis</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {availableServices.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={service}
                          checked={profile.services.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={service} className="text-sm font-normal cursor-pointer">
                          {service}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="diagnosisPrice">Preço do Diagnóstico RuidCar</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="relative flex-1 max-w-xs">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="diagnosisPrice"
                        type="number"
                        value={profile.diagnosisPrice ? (profile.diagnosisPrice / 100).toFixed(2) : ''}
                        onChange={(e) => handleInputChange('diagnosisPrice', Math.round(parseFloat(e.target.value) * 100))}
                        placeholder="150.00"
                        className="pl-10"
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      Valor atual: {formatCurrency(profile.diagnosisPrice || 0)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Formas de Pagamento</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {paymentMethodsList.map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={method}
                          checked={profile.paymentMethods.includes(method)}
                          onChange={() => handlePaymentMethodToggle(method)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={method} className="text-sm font-normal cursor-pointer">
                          {method}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Certificações */}
          <TabsContent value="certifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Certificações e Credenciais</CardTitle>
                <CardDescription>
                  Adicione certificações que comprovem a qualificação da sua oficina
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lista de certificações */}
                <div className="space-y-3">
                  {profile.certifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma certificação adicionada</p>
                      <p className="text-sm mt-1">Adicione certificações para aumentar a credibilidade</p>
                    </div>
                  ) : (
                    profile.certifications.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-primary mt-1" />
                          <div>
                            <p className="font-medium">{cert.name}</p>
                            <p className="text-sm text-gray-600">
                              {cert.issuer} • {cert.year}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCertification(cert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <Separator />

                {/* Adicionar nova certificação */}
                <div className="space-y-4">
                  <h3 className="font-medium">Adicionar Nova Certificação</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="certName">Nome da Certificação</Label>
                      <Input
                        id="certName"
                        value={newCertification.name}
                        onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                        placeholder="Ex: Certificação RuidCar"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certIssuer">Emissor</Label>
                      <Input
                        id="certIssuer"
                        value={newCertification.issuer}
                        onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                        placeholder="Ex: RuidCar Brasil"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certYear">Ano</Label>
                      <Input
                        id="certYear"
                        value={newCertification.year}
                        onChange={(e) => setNewCertification({ ...newCertification, year: e.target.value })}
                        placeholder="Ex: 2023"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleAddCertification}
                    disabled={!newCertification.name || !newCertification.issuer || !newCertification.year}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Certificação
                  </Button>
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
              onClick={loadProfile}
              disabled={saving}
            >
              Cancelar Alterações
            </Button>
            <Button
              onClick={handleSaveProfile}
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
      </div>
    </WorkshopLayout>
  );
}