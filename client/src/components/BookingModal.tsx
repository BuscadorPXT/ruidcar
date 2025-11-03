import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, parse, isWeekend, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Workshop {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  diagnosisActive?: boolean;
}

interface VehiclePricing {
  category: 'popular' | 'medium' | 'luxury';
  price: number;
  estimatedDuration: number;
}

interface AvailableSlot {
  date: string;
  time: string;
  available: boolean;
}

interface BookingData {
  workshopId: number;
  date: string;
  time: string;
  vehicleCategory: 'popular' | 'medium' | 'luxury';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlate: string;
  observations?: string;
  consentLgpd: boolean;
  consentMarketing: boolean;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workshop: Workshop | null;
}

const CATEGORY_LABELS = {
  popular: 'Popular / Linha Leve',
  medium: 'Linha Média / SUV / Picape',
  luxury: 'Luxo / Premium'
};

const CATEGORY_EXAMPLES = {
  popular: 'Ex: Onix, HB20, Gol, Strada',
  medium: 'Ex: Compass, Tiggo, Hilux, S10',
  luxury: 'Ex: BMW, Mercedes, Audi, Porsche'
};

export default function BookingModal({ isOpen, onClose, workshop }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [pricing, setPricing] = useState<VehiclePricing[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingData, setBookingData] = useState<BookingData>({
    workshopId: workshop?.id || 0,
    date: '',
    time: '',
    vehicleCategory: 'popular',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCpf: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlate: '',
    observations: '',
    consentLgpd: false,
    consentMarketing: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Reset ao abrir modal
  useEffect(() => {
    if (isOpen && workshop) {
      setStep(1);
      setBookingData({
        workshopId: workshop.id,
        date: '',
        time: '',
        vehicleCategory: 'popular',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerCpf: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        vehiclePlate: '',
        observations: '',
        consentLgpd: false,
        consentMarketing: false
      });
      setErrors({});
      loadPricing();
    }
  }, [isOpen, workshop]);

  // Carregar preços
  const loadPricing = async () => {
    if (!workshop) return;

    try {
      const response = await fetch(`/api/public/diagnostic/pricing/${workshop.id}`);
      if (!response.ok) throw new Error('Erro ao carregar preços');

      const result = await response.json();
      setPricing(result.data || []);
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os preços',
        variant: 'destructive'
      });
    }
  };

  // Verificar disponibilidade
  const checkAvailability = async (date: string, category: string) => {
    if (!workshop) return;

    setCheckingAvailability(true);
    try {
      const response = await fetch(
        `/api/public/diagnostic/availability/${workshop.id}?date=${date}&category=${category}`
      );

      if (!response.ok) throw new Error('Erro ao verificar disponibilidade');

      const result = await response.json();
      setAvailableSlots(result.data.slots || []);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar disponibilidade',
        variant: 'destructive'
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Validar formulário por etapa
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        // Validação da categoria
        if (!bookingData.vehicleCategory) {
          newErrors.category = 'Selecione uma categoria';
        }
        break;

      case 2:
        // Validação de data e horário
        if (!bookingData.date) {
          newErrors.date = 'Selecione uma data';
        }
        if (!bookingData.time) {
          newErrors.time = 'Selecione um horário';
        }
        break;

      case 3:
        // Validação dos dados do veículo
        if (!bookingData.vehicleMake.trim()) {
          newErrors.vehicleMake = 'Marca é obrigatória';
        }
        if (!bookingData.vehicleModel.trim()) {
          newErrors.vehicleModel = 'Modelo é obrigatório';
        }
        if (!bookingData.vehicleYear.trim() || bookingData.vehicleYear.length !== 4) {
          newErrors.vehicleYear = 'Ano inválido';
        }
        if (!bookingData.vehiclePlate.trim()) {
          newErrors.vehiclePlate = 'Placa é obrigatória';
        }
        break;

      case 4:
        // Validação dos dados pessoais
        if (!bookingData.customerName.trim()) {
          newErrors.customerName = 'Nome é obrigatório';
        }
        if (!bookingData.customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customerEmail)) {
          newErrors.customerEmail = 'Email inválido';
        }
        if (!bookingData.customerPhone.trim() || bookingData.customerPhone.replace(/\D/g, '').length < 10) {
          newErrors.customerPhone = 'Telefone inválido';
        }
        if (!bookingData.consentLgpd) {
          newErrors.consent = 'Você deve aceitar os termos';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Avançar etapa
  const handleNextStep = async () => {
    if (!validateStep(step)) return;

    if (step === 1) {
      // Ao selecionar categoria, ir para seleção de data
      setStep(2);
    } else if (step === 2 && bookingData.date && !bookingData.time) {
      // Ao selecionar data, buscar horários disponíveis
      await checkAvailability(bookingData.date, bookingData.vehicleCategory);
    } else if (step === 2 && bookingData.time) {
      // Após selecionar horário, ir para dados do veículo
      setStep(3);
    } else if (step === 3) {
      // Após dados do veículo, ir para dados pessoais
      setStep(4);
    } else if (step === 4) {
      // Confirmar agendamento
      handleSubmit();
    }
  };

  // Voltar etapa
  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 3) {
        // Ao voltar da etapa 3, limpar horário selecionado
        setBookingData({ ...bookingData, time: '' });
      }
    }
  };

  // Enviar agendamento
  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/public/diagnostic/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar agendamento');
      }

      const result = await response.json();

      toast({
        title: 'Agendamento Confirmado!',
        description: `Seu diagnóstico foi agendado para ${format(parseISO(bookingData.date), "d 'de' MMMM", { locale: ptBR })} às ${bookingData.time}.`
      });

      // Mostrar etapa de confirmação
      setStep(5);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  // Calcular preço selecionado
  const getSelectedPrice = () => {
    const price = pricing.find(p => p.category === bookingData.vehicleCategory);
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price.price / 100);
  };

  // Calcular duração estimada
  const getEstimatedDuration = () => {
    const price = pricing.find(p => p.category === bookingData.vehicleCategory);
    return price?.estimatedDuration || 60;
  };

  // Early return APÓS todos os hooks para evitar React Error #310
  if (!workshop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando informações da oficina...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step < 5 ? (
          <>
            <DialogHeader>
              <DialogTitle>Agendar Diagnóstico RuidCar</DialogTitle>
              <DialogDescription>
                Complete as informações abaixo para agendar seu diagnóstico automotivo
              </DialogDescription>
              <DialogDescription>
                {workshop.name} - {workshop.city}, {workshop.state}
              </DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}
                    `}
                  >
                    {s}
                  </div>
                  {s < 4 && (
                    <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="space-y-4">
              {/* Step 1: Categoria do Veículo */}
              {step === 1 && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Selecione a Categoria do Veículo</h3>
                    <RadioGroup
                      value={bookingData.vehicleCategory}
                      onValueChange={(value) => setBookingData({ ...bookingData, vehicleCategory: value as any })}
                    >
                      <div className="grid gap-4">
                        {(['popular', 'medium', 'luxury'] as const).map((category) => {
                          const price = pricing.find(p => p.category === category);
                          return (
                            <Card
                              key={category}
                              className={`cursor-pointer transition-colors ${
                                bookingData.vehicleCategory === category ? 'border-primary' : ''
                              }`}
                            >
                              <CardContent className="p-4">
                                <RadioGroupItem value={category} id={category} className="sr-only" />
                                <Label htmlFor={category} className="cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3">
                                        <Car className="h-5 w-5 text-gray-600" />
                                        <div>
                                          <p className="font-medium">{CATEGORY_LABELS[category]}</p>
                                          <p className="text-sm text-gray-500">{CATEGORY_EXAMPLES[category]}</p>
                                        </div>
                                      </div>
                                    </div>
                                    {price && (
                                      <div className="text-right">
                                        <p className="text-lg font-bold text-primary">
                                          {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                          }).format(price.price / 100)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Duração: {price.estimatedDuration} min
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </Label>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </RadioGroup>
                    {errors.category && (
                      <p className="text-sm text-red-500 mt-2">{errors.category}</p>
                    )}
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      O diagnóstico RuidCar identifica ruídos e problemas na suspensão do seu veículo
                      usando tecnologia avançada de vibração.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {/* Step 2: Data e Horário */}
              {step === 2 && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Escolha Data e Horário</h3>

                    {/* Seleção de Data */}
                    {!bookingData.date ? (
                      <div>
                        <Label>Selecione uma data</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {Array.from({ length: 30 }, (_, i) => {
                            const date = addDays(new Date(), i + 1);
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isDisabled = isWeekend(date);

                            return (
                              <Button
                                key={dateStr}
                                variant={bookingData.date === dateStr ? 'default' : 'outline'}
                                size="sm"
                                disabled={isDisabled}
                                onClick={() => {
                                  setBookingData({ ...bookingData, date: dateStr, time: '' });
                                  checkAvailability(dateStr, bookingData.vehicleCategory);
                                }}
                                className="text-xs"
                              >
                                {format(date, "d 'de' MMM", { locale: ptBR })}
                              </Button>
                            );
                          })}
                        </div>
                        {errors.date && (
                          <p className="text-sm text-red-500 mt-2">{errors.date}</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Data Selecionada */}
                        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Data selecionada:</p>
                            <p className="font-medium">
                              {format(parseISO(bookingData.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBookingData({ ...bookingData, date: '', time: '' })}
                          >
                            Alterar
                          </Button>
                        </div>

                        {/* Horários Disponíveis */}
                        <Label>Horários disponíveis</Label>
                        {checkingAvailability ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Não há horários disponíveis para esta data. Por favor, selecione outra data.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {availableSlots.map((slot) => (
                              <Button
                                key={slot.time}
                                variant={bookingData.time === slot.time ? 'default' : 'outline'}
                                size="sm"
                                disabled={!slot.available}
                                onClick={() => setBookingData({ ...bookingData, time: slot.time })}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {slot.time}
                              </Button>
                            ))}
                          </div>
                        )}
                        {errors.time && (
                          <p className="text-sm text-red-500 mt-2">{errors.time}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Resumo do Agendamento */}
                  {bookingData.date && bookingData.time && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Categoria:</span>
                            <span className="font-medium">{CATEGORY_LABELS[bookingData.vehicleCategory]}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Data:</span>
                            <span className="font-medium">
                              {format(parseISO(bookingData.date), "d 'de' MMMM", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Horário:</span>
                            <span className="font-medium">{bookingData.time}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Valor:</span>
                            <span className="text-lg font-bold text-primary">{getSelectedPrice()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Step 3: Dados do Veículo */}
              {step === 3 && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Dados do Veículo</h3>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Marca</Label>
                          <Input
                            placeholder="Ex: Volkswagen"
                            value={bookingData.vehicleMake}
                            onChange={(e) => setBookingData({ ...bookingData, vehicleMake: e.target.value })}
                          />
                          {errors.vehicleMake && (
                            <p className="text-sm text-red-500 mt-1">{errors.vehicleMake}</p>
                          )}
                        </div>
                        <div>
                          <Label>Modelo</Label>
                          <Input
                            placeholder="Ex: Polo"
                            value={bookingData.vehicleModel}
                            onChange={(e) => setBookingData({ ...bookingData, vehicleModel: e.target.value })}
                          />
                          {errors.vehicleModel && (
                            <p className="text-sm text-red-500 mt-1">{errors.vehicleModel}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Ano</Label>
                          <Input
                            placeholder="Ex: 2022"
                            maxLength={4}
                            value={bookingData.vehicleYear}
                            onChange={(e) => setBookingData({ ...bookingData, vehicleYear: e.target.value })}
                          />
                          {errors.vehicleYear && (
                            <p className="text-sm text-red-500 mt-1">{errors.vehicleYear}</p>
                          )}
                        </div>
                        <div>
                          <Label>Placa</Label>
                          <Input
                            placeholder="Ex: ABC1234"
                            value={bookingData.vehiclePlate}
                            onChange={(e) => setBookingData({
                              ...bookingData,
                              vehiclePlate: e.target.value.toUpperCase()
                            })}
                          />
                          {errors.vehiclePlate && (
                            <p className="text-sm text-red-500 mt-1">{errors.vehiclePlate}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Observações (opcional)</Label>
                        <Textarea
                          placeholder="Descreva os ruídos ou problemas que você notou no veículo..."
                          rows={3}
                          value={bookingData.observations}
                          onChange={(e) => setBookingData({ ...bookingData, observations: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Dados Pessoais */}
              {step === 4 && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Seus Dados</h3>
                    <div className="grid gap-4">
                      <div>
                        <Label>Nome Completo</Label>
                        <Input
                          placeholder="Digite seu nome completo"
                          value={bookingData.customerName}
                          onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                        />
                        {errors.customerName && (
                          <p className="text-sm text-red-500 mt-1">{errors.customerName}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            value={bookingData.customerEmail}
                            onChange={(e) => setBookingData({ ...bookingData, customerEmail: e.target.value })}
                          />
                          {errors.customerEmail && (
                            <p className="text-sm text-red-500 mt-1">{errors.customerEmail}</p>
                          )}
                        </div>
                        <div>
                          <Label>Telefone</Label>
                          <Input
                            placeholder="(11) 99999-9999"
                            value={bookingData.customerPhone}
                            onChange={(e) => setBookingData({
                              ...bookingData,
                              customerPhone: formatPhone(e.target.value)
                            })}
                          />
                          {errors.customerPhone && (
                            <p className="text-sm text-red-500 mt-1">{errors.customerPhone}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>CPF (opcional)</Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={bookingData.customerCpf}
                          onChange={(e) => setBookingData({
                            ...bookingData,
                            customerCpf: formatCPF(e.target.value)
                          })}
                        />
                      </div>

                      <Separator />

                      {/* Consentimentos */}
                      <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="lgpd"
                            checked={bookingData.consentLgpd}
                            onCheckedChange={(checked) =>
                              setBookingData({ ...bookingData, consentLgpd: !!checked })
                            }
                          />
                          <Label htmlFor="lgpd" className="text-sm cursor-pointer">
                            <Shield className="h-3 w-3 inline mr-1" />
                            Concordo com o tratamento dos meus dados pessoais conforme a LGPD
                            para realização do diagnóstico.
                          </Label>
                        </div>

                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="marketing"
                            checked={bookingData.consentMarketing}
                            onCheckedChange={(checked) =>
                              setBookingData({ ...bookingData, consentMarketing: !!checked })
                            }
                          />
                          <Label htmlFor="marketing" className="text-sm cursor-pointer">
                            Aceito receber comunicações sobre o serviço e promoções.
                          </Label>
                        </div>

                        {errors.consent && (
                          <p className="text-sm text-red-500">{errors.consent}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resumo Final */}
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Resumo do Agendamento</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Oficina:</span>
                          <span>{workshop.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Data:</span>
                          <span>{format(parseISO(bookingData.date), "d 'de' MMMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Horário:</span>
                          <span>{bookingData.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Veículo:</span>
                          <span>{bookingData.vehicleMake} {bookingData.vehicleModel}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-base font-medium">
                          <span>Total:</span>
                          <span className="text-primary">{getSelectedPrice()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={step === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>

              <Button
                onClick={handleNextStep}
                disabled={loading || checkingAvailability}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : step === 4 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Agendamento
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Step 5: Confirmação */
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Agendamento Confirmado!</h2>
            <p className="text-gray-600 mb-6">
              Seu diagnóstico foi agendado com sucesso
            </p>

            <Card className="mb-6 text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Detalhes do Agendamento</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{workshop.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>
                      {format(parseISO(bookingData.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{bookingData.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-500" />
                    <span>{bookingData.vehicleMake} {bookingData.vehicleModel} - {bookingData.vehiclePlate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Enviamos os detalhes do agendamento para {bookingData.customerEmail}
              </AlertDescription>
            </Alert>

            <Button className="mt-6" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}