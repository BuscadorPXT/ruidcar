import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Car,
  MapPin,
  Clock,
  Star,
  Search,
  User,
  Settings,
  LogOut,
  Bell,
  MessageSquare,
  FileText,
  ChevronRight
} from 'lucide-react';

interface Appointment {
  id: number;
  workshopName: string;
  workshopAddress: string;
  service: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface Workshop {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  rating: number;
  distance?: number;
  services: string[];
}

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nearbyWorkshops, setNearbyWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      // Dados mock para demonstração
      setAppointments([
        {
          id: 1,
          workshopName: 'Oficina Central SP',
          workshopAddress: 'Rua das Flores, 123 - São Paulo, SP',
          service: 'Instalação RuidCar',
          date: '2025-10-05',
          time: '14:00',
          status: 'scheduled'
        },
        {
          id: 2,
          workshopName: 'AutoCenter Premium',
          workshopAddress: 'Av. Principal, 456 - São Paulo, SP',
          service: 'Revisão RuidCar',
          date: '2025-09-15',
          time: '10:00',
          status: 'completed'
        }
      ]);

      setNearbyWorkshops([
        {
          id: 1,
          name: 'Oficina Central SP',
          address: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          rating: 4.8,
          distance: 2.5,
          services: ['Instalação', 'Manutenção', 'Revisão']
        },
        {
          id: 2,
          name: 'AutoCenter Premium',
          address: 'Av. Principal, 456',
          city: 'São Paulo',
          state: 'SP',
          rating: 4.6,
          distance: 3.8,
          services: ['Instalação', 'Diagnóstico']
        },
        {
          id: 3,
          name: 'RuidCar Express',
          address: 'Rua Comercial, 789',
          city: 'São Paulo',
          state: 'SP',
          rating: 4.9,
          distance: 5.2,
          services: ['Instalação Express', 'Revisão']
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast({
      title: 'Logout realizado',
      description: 'Até logo!',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                RuidCar - Área do Cliente
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || 'Cliente'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Próximo Agendamento
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">05/10</div>
              <p className="text-xs text-muted-foreground">
                às 14:00 - Oficina Central SP
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Serviços Realizados
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                nos últimos 6 meses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Oficinas Favoritas
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                oficinas salvas
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments">Meus Agendamentos</TabsTrigger>
            <TabsTrigger value="workshops">Oficinas Próximas</TabsTrigger>
            <TabsTrigger value="vehicle">Meu Veículo</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos</CardTitle>
                <CardDescription>
                  Gerencie seus agendamentos de instalação e manutenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Você ainda não tem agendamentos
                    </p>
                    <Button className="mt-4" onClick={() => setLocation('/mapa')}>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar Oficinas
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {appointment.workshopName}
                              </h3>
                              <Badge className={getStatusColor(appointment.status)}>
                                {getStatusLabel(appointment.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              {appointment.workshopAddress}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {new Date(appointment.date).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-gray-400" />
                                {appointment.time}
                              </div>
                            </div>
                            <p className="text-sm font-medium text-primary">
                              {appointment.service}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workshops" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Oficinas Próximas</CardTitle>
                <CardDescription>
                  Oficinas RuidCar perto de você
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nearbyWorkshops.map((workshop) => (
                      <div
                        key={workshop.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{workshop.name}</h3>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">
                                  {workshop.rating}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              {workshop.address} - {workshop.city}, {workshop.state}
                            </div>
                            {workshop.distance && (
                              <p className="text-sm text-gray-500">
                                {workshop.distance} km de distância
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {workshop.services.map((service, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              toast({
                                title: 'Em breve!',
                                description: 'Função de agendamento será liberada em breve.',
                              });
                            }}
                          >
                            Agendar
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation('/mapa')}
                    >
                      Ver Todas as Oficinas no Mapa
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicle" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meu Veículo</CardTitle>
                <CardDescription>
                  Informações do veículo com RuidCar instalado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Veículo Principal</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Marca/Modelo</p>
                        <p className="font-medium">Volkswagen Amarok</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Ano</p>
                        <p className="font-medium">2023</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Placa</p>
                        <p className="font-medium">ABC-1234</p>
                      </div>
                      <div>
                        <p className="text-gray-500">RuidCar Instalado</p>
                        <p className="font-medium text-green-600">Sim</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Próxima Revisão</h4>
                    <p className="text-sm text-gray-600">
                      Recomendada em 3 meses ou 5.000 km
                    </p>
                    <Button size="sm" className="mt-3">
                      Agendar Revisão
                    </Button>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Car className="h-4 w-4 mr-2" />
                    Adicionar Outro Veículo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}