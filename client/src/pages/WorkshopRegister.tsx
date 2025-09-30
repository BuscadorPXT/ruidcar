import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Wrench,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle,
  ArrowLeft,
  Search,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CEPField } from '@/components/CEPField';
import { WorkshopSearchField } from '@/components/WorkshopSearchField';
import WorkshopStatusCheck from '@/components/WorkshopStatusCheck';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const registerSchema = z.object({
  // Dados do administrador
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),

  // Dados da oficina
  workshopName: z.string().min(3, 'Nome da oficina deve ter pelo menos 3 caracteres'),
  workshopCEP: z.string().min(8, 'CEP é obrigatório'),
  workshopAddress: z.string().min(10, 'Endereço deve ser completo'),
  workshopPhone: z.string().min(10, 'Telefone da oficina é obrigatório'),
  workshopCity: z.string().min(2, 'Cidade é obrigatória'),
  workshopState: z.string().length(2, 'Estado deve ter 2 caracteres (ex: SP)'),

  // Coordenadas (serão preenchidas automaticamente)
  latitude: z.string().min(1, 'Coordenadas são obrigatórias'),
  longitude: z.string().min(1, 'Coordenadas são obrigatórias'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function WorkshopRegister() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState(0); // 0: escolher modo, 1: dados pessoais, 2: dados oficina
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<'new' | 'existing' | null>(null);
  const [workshopCode, setWorkshopCode] = useState('');
  const [existingWorkshop, setExistingWorkshop] = useState<any>(null);
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const watchedAddress = watch('workshopAddress');
  const watchedCity = watch('workshopCity');
  const watchedState = watch('workshopState');
  const watchedName = watch('name');
  const watchedEmail = watch('email');
  const watchedPhone = watch('phone');
  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'existing') {
        setRegistrationMode('existing');
        setStep(1);
      }
    } catch {}
  }, []);

  const getCoordinatesFromAddress = async () => {
    if (!watchedAddress || !watchedCity || !watchedState) {
      toast({
        title: 'Endereço incompleto',
        description: 'Preencha o endereço, cidade e estado para buscar as coordenadas',
        variant: 'destructive'
      });
      return;
    }

    setIsGettingLocation(true);
    try {
      const fullAddress = `${watchedAddress}, ${watchedCity}, ${watchedState}, Brasil`;

      // Usar serviço de geocoding (aqui usaremos OpenStreetMap Nominatim como exemplo)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setValue('latitude', lat);
        setValue('longitude', lon);
        toast({
          title: 'Coordenadas encontradas!',
          description: 'Localização foi identificada com sucesso',
        });
      } else {
        toast({
          title: 'Localização não encontrada',
          description: 'Verifique se o endereço está correto',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao buscar localização. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/workshop/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.message || 'Erro no cadastro');
        return;
      }

      setSuccessMessage(`Cadastro realizado com sucesso! Sua oficina "${result.workshop.name}" foi registrada e está aguardando aprovação. Você receberá um email quando for aprovada.`);
      setStep(3); // Ir para tela de sucesso

    } catch (error) {
      console.error('Erro no cadastro:', error);
      setErrorMessage('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    setStep(step + 1);
    setErrorMessage('');
  };

  const prevStep = () => {
    setStep(step - 1);
    setErrorMessage('');
  };

  const handleModeSelection = (mode: 'new' | 'existing') => {
    setRegistrationMode(mode);
    setStep(1);
    setErrorMessage('');
  };

  const handleCEPChange = (cep: string, data?: any) => {
    setValue('workshopCEP', cep);

    if (data?.valid) {
      // Auto-preenchimento baseado no CEP
      if (data.logradouro) {
        const address = data.complemento
          ? `${data.logradouro}, ${data.complemento}`
          : data.logradouro;
        setValue('workshopAddress', address);
      }

      if (data.localidade) {
        setValue('workshopCity', data.localidade);
      }

      if (data.uf) {
        setValue('workshopState', data.uf);
      }
    }
  };

  const handleWorkshopFound = (workshop: any) => {
    setExistingWorkshop(workshop);

    // Pre-popular campos com dados da oficina encontrada
    setValue('workshopName', workshop.name);
    setValue('workshopAddress', workshop.address);
    setValue('workshopCity', workshop.city);
    setValue('workshopState', workshop.state);
    if (workshop.phone) {
      setValue('workshopPhone', workshop.phone);
    }
  };

  const searchWorkshopByCode = async () => {
    if (!workshopCode || workshopCode.trim().length < 3) {
      toast({
        title: 'Código inválido',
        description: 'Informe um código válido (ex: RCW-1234)'.trim(),
        variant: 'destructive'
      });
      return;
    }
    setIsSearchingCode(true);
    setExistingWorkshop(null);
    try {
      const response = await fetch(`/api/workshops/search-by-code/${encodeURIComponent(workshopCode.trim())}`);
      const result = await response.json();
      if (!response.ok || !result.found) {
        toast({ title: 'Não encontrado', description: result.message || 'Oficina não encontrada para este código', variant: 'destructive' });
        return;
      }
      handleWorkshopFound(result.workshop);
      toast({ title: 'Oficina encontrada', description: `${result.workshop.name} • ${result.workshop.city || ''} ${result.workshop.state || ''}`.trim() });
    } catch (e) {
      toast({ title: 'Erro na busca', description: 'Não foi possível buscar pelo código agora. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSearchingCode(false);
    }
  };

  const handleClaimWorkshop = async () => {
    if (!existingWorkshop) {
      toast({ title: 'Busque a oficina', description: 'Informe e busque o código da oficina antes de ativar.' });
      return;
    }
    if (!watchedName || !watchedEmail || !watchedPassword || !watchedConfirmPassword) {
      toast({ title: 'Dados incompletos', description: 'Preencha nome, email e senha na etapa anterior.', variant: 'destructive' });
      return;
    }
    setIsClaiming(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/workshop/auth/claim-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: workshopCode.trim(),
          email: watchedEmail,
          name: watchedName,
          phone: watchedPhone,
          password: watchedPassword,
          confirmPassword: watchedConfirmPassword
        })
      });
      let result: any = null;
      try {
        result = await response.json();
      } catch (parseErr) {
        const text = await response.text().catch(() => '');
        console.error('❌ Falha ao parsear JSON da resposta:', { status: response.status, text });
        if (!response.ok) {
          setErrorMessage(text || 'Erro ao ativar acesso.');
          return;
        }
        // 200 OK com corpo vazio: considerar sucesso usando os dados já conhecidos
        const fallbackName = existingWorkshop?.name;
        setSuccessMessage(`Acesso ativado com sucesso${fallbackName ? ` para "${fallbackName}"` : ''}. Você já pode entrar no painel da oficina.`);
        setStep(4);
        return;
      }
      if (!response.ok) {
        // Melhor tratamento de erros com mensagens específicas
        const errorCode = result?.code as string;
        const errorMsg = result?.message as string || '';
        const errorHint = result?.hint as string || '';

        if (errorCode === 'WORKSHOP_NOT_FOUND') {
          setErrorMessage(`${errorMsg} ${errorHint}`);
        } else if (errorCode === 'ACCOUNT_DISABLED') {
          setErrorMessage('Sua conta foi desativada. Entre em contato com suporte@ruidcar.com.br');
        } else {
          setErrorMessage(errorMsg || 'Erro ao ativar acesso. Verifique o código e tente novamente.');
        }
        return;
      }

      // Login automático após ativação bem-sucedida
      const workshopData = (result as any)?.workshop;
      const adminData = (result as any)?.admin;
      const token = (result as any)?.token;

      if (adminData && workshopData) {
        // Salvar dados da sessão para acesso imediato
        localStorage.setItem('workshop-admin', JSON.stringify(adminData));
        localStorage.setItem('workshop-workshops', JSON.stringify([workshopData]));

        // Se tem token, salvá-lo também (embora o cookie já deve ter sido definido pelo backend)
        if (token) {
          // O token já está em cookie seguro definido pelo backend
          console.log('✅ Ativação bem-sucedida, redirecionando para o dashboard...');
        }

        // Mostrar toast de sucesso
        toast({
          title: 'Ativação realizada com sucesso!',
          description: `Bem-vindo(a) ao painel da ${workshopData.name}`,
        });

        // Redirecionar direto para o dashboard
        setTimeout(() => {
          setLocation('/workshop/dashboard');
        }, 500);

        return; // Não mostrar tela de sucesso, ir direto ao dashboard
      }

      // Fallback se não tiver os dados completos
      const workshopName = workshopData?.name || existingWorkshop?.name || '';
      setSuccessMessage(`Acesso ativado com sucesso${workshopName ? ` para "${workshopName}"` : ''}. Você já pode entrar no painel da oficina.`);
      setStep(4);
    } catch (e) {
      setErrorMessage('Erro de conexão. Tente novamente.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleWorkshopNotFound = () => {
    setExistingWorkshop(null);
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-700">
                Cadastro Realizado!
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center">
              {successMessage && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Button
                  onClick={() => setLocation('/workshop/login')}
                  className="w-full"
                >
                  Fazer Login
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setLocation('/')}
                  className="w-full"
                >
                  Voltar ao Site Principal
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Cadastrar Oficina
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Cadastre sua oficina na rede RuidCar
            </p>

            {/* Progress indicator */}
            {step > 0 && (
              <>
                <div className="flex items-center justify-center mt-6 space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    1
                  </div>
                  <div className={`w-8 h-1 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    2
                  </div>
                  <div className={`w-8 h-1 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    3
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  {step === 1 && 'Dados pessoais'}
                  {step === 2 && registrationMode === 'existing' && 'Buscar oficina'}
                  {step === 2 && registrationMode === 'new' && 'Dados da oficina'}
                  {step === 3 && registrationMode === 'existing' && 'Confirmar dados'}
                  {step === 3 && registrationMode === 'new' && 'Finalizar cadastro'}
                </p>
              </>
            )}
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Como você gostaria de cadastrar sua oficina?</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione uma das opções abaixo para continuar
                  </p>
                </div>

                <div className="grid gap-4">
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                    onClick={() => handleModeSelection('existing')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <Search className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">Minha oficina já existe</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Use o código único para encontrar e reivindicar sua oficina
                          </p>
                          <p className="text-xs text-blue-600 mt-2">
                            Mais rápido • Dados já preenchidos
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                    onClick={() => handleModeSelection('new')}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-100 rounded-full">
                          <Plus className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">Cadastrar nova oficina</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Criar um novo cadastro com todas as informações
                          </p>
                          <p className="text-xs text-green-600 mt-2">
                            Controle total • Validação de CEP
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center mt-6">
                  <p className="text-xs text-muted-foreground">
                    Não tem certeza?
                    <button
                      type="button"
                      className="text-primary hover:underline ml-1"
                      onClick={() => handleModeSelection('existing')}
                    >
                      Tente primeiro buscar sua oficina
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="Seu nome completo"
                          className="pl-10"
                          {...register('name')}
                        />
                      </div>
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          {...register('email')}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">WhatsApp</Label>
                    <PhoneInput
                      country={'br'}
                      value={watch('phone')}
                      onChange={(value) => setValue('phone', value)}
                      inputClass={`w-full h-10 text-sm ${errors.phone ? 'border-red-500' : ''}`}
                      containerClass="w-full"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          className="pl-10 pr-10"
                          {...register('password')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repita a senha"
                          className="pl-10 pr-10"
                          {...register('confirmPassword')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={nextStep}
                    className="w-full"
                  >
                    Próximo: Dados da Oficina
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && registrationMode === 'existing' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="workshopCode">Código da Oficina</Label>
                    <Input
                      id="workshopCode"
                      placeholder="Ex: RCW-1234"
                      value={workshopCode}
                      onChange={(e) => setWorkshopCode(e.target.value.toUpperCase())}
                    />
                    <div className="flex gap-3 mt-3">
                      <Button type="button" variant="outline" onClick={prevStep} className="flex-1"> 
                        <ArrowLeft className="w-4 h-4 mr-2" />Voltar
                      </Button>
                      <Button type="button" onClick={searchWorkshopByCode} disabled={isSearchingCode} className="flex-1">
                        {isSearchingCode ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Buscando...
                          </>
                        ) : (
                          <>Buscar Oficina<Search className="w-4 h-4 ml-2" /></>
                        )}
                      </Button>
                    </div>
                  </div>

                  {existingWorkshop && (
                    <div className="p-4 border rounded-md bg-gray-50">
                      <p className="text-sm font-medium">Oficina encontrada</p>
                      <p className="text-sm text-muted-foreground">{existingWorkshop.name}</p>
                      <p className="text-xs text-muted-foreground">{existingWorkshop.address}</p>
                      <p className="text-xs text-muted-foreground">{existingWorkshop.city} - {existingWorkshop.state}</p>
                      {!existingWorkshop.active && (
                        <Alert className="mt-3">
                          <AlertDescription>Esta oficina está inativa. O administrador poderá aprovar posteriormente.</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />Voltar
                    </Button>
                    <Button type="button" onClick={handleClaimWorkshop} disabled={isClaiming || !existingWorkshop} className="flex-1">
                      {isClaiming ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Ativando...
                        </>
                      ) : (
                        <>Ativar acesso<CheckCircle className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && registrationMode === 'new' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="workshopName">Nome da Oficina</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="workshopName"
                        placeholder="Nome da sua oficina"
                        className="pl-10"
                        {...register('workshopName')}
                      />
                    </div>
                    {errors.workshopName && (
                      <p className="text-sm text-destructive mt-1">{errors.workshopName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="workshopAddress">Endereço Completo</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="workshopAddress"
                        placeholder="Rua, número, bairro"
                        className="pl-10"
                        {...register('workshopAddress')}
                      />
                    </div>
                    {errors.workshopAddress && (
                      <p className="text-sm text-destructive mt-1">{errors.workshopAddress.message}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="workshopCity">Cidade</Label>
                      <Input
                        id="workshopCity"
                        placeholder="Ex: São Paulo"
                        {...register('workshopCity')}
                      />
                      {errors.workshopCity && (
                        <p className="text-sm text-destructive mt-1">{errors.workshopCity.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="workshopState">Estado</Label>
                      <Input
                        id="workshopState"
                        placeholder="Ex: SP"
                        maxLength={2}
                        className="uppercase"
                        {...register('workshopState')}
                        onChange={(e) => {
                          e.target.value = e.target.value.toUpperCase();
                          register('workshopState').onChange(e);
                        }}
                      />
                      {errors.workshopState && (
                        <p className="text-sm text-destructive mt-1">{errors.workshopState.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="workshopPhone">Telefone da Oficina</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="workshopPhone"
                          placeholder="(11) 99999-9999"
                          className="pl-10"
                          {...register('workshopPhone')}
                        />
                      </div>
                      {errors.workshopPhone && (
                        <p className="text-sm text-destructive mt-1">{errors.workshopPhone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Buscar localização automaticamente
                        </p>
                        <p className="text-xs text-blue-700">
                          Clique para encontrar as coordenadas do endereço
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCoordinatesFromAddress}
                        disabled={isGettingLocation}
                      >
                        {isGettingLocation ? (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                        {isGettingLocation ? 'Buscando...' : 'Buscar'}
                      </Button>
                    </div>
                  </div>

                  {/* Hidden fields for coordinates */}
                  <input type="hidden" {...register('latitude')} />
                  <input type="hidden" {...register('longitude')} />
                  {(errors.latitude || errors.longitude) && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        É necessário buscar a localização da oficina clicando no botão acima.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          Cadastrar Oficina
                          <CheckCircle className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </form>

            <div className="space-y-4 mt-6">
              <WorkshopStatusCheck />

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Já tem uma conta?{' '}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setLocation('/login')}
                  >
                    Fazer login
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            Voltar para o{' '}
            <button
              className="text-primary hover:underline"
              onClick={() => setLocation('/')}
            >
              site principal
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}