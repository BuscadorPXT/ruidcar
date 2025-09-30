import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Wrench, Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function WorkshopLogin() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Usando login unificado com intent=oficina
      const response = await fetch('/api/auth/unified-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          intent: 'oficina' // Especificar que é login de oficina
        }),
        credentials: 'include' // Importante: para receber cookies
      });

      // Primeiro verificar se a resposta é válida
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error('❌ Resposta não é JSON. Content-Type:', contentType);
        console.error('Status:', response.status);
        console.error('Status Text:', response.statusText);

        // Tentar ler o texto da resposta para debug
        const text = await response.text();
        console.error('Resposta como texto:', text);

        throw new Error(`Servidor retornou resposta não-JSON: ${text.substring(0, 200)}`);
      }

      const result = await response.json();

      if (!response.ok) {
        // Tratar erros específicos do login unificado
        if (result.code === 'INVALID_CREDENTIALS') {
          setErrorMessage('Email ou senha inválidos');
        } else if (result.code === 'ACCOUNT_DISABLED' || result.code === 'NO_ROLES') {
          setErrorMessage('Sua conta foi desativada ou está aguardando aprovação. Entre em contato com o suporte.');
        } else if (result.code === 'INTENT_MISMATCH') {
          setErrorMessage('Você não tem acesso como oficina. Verifique se seu cadastro foi aprovado.');
        } else if (result.code === 'NO_WORKSHOPS') {
          setErrorMessage('Nenhuma oficina encontrada para esta conta.');
        } else {
          setErrorMessage(result.message || 'Erro no login');
        }
        return;
      }

      // Processar resposta do login unificado
      const workshopRole = result.roles?.find((r: any) => r.roleName === 'OFICINA_OWNER');
      if (!workshopRole) {
        setErrorMessage('Acesso de oficina não encontrado. Verifique suas permissões.');
        return;
      }

      // Salvar dados no formato esperado pelo dashboard
      const adminData = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone
      };

      // Buscar dados da oficina do organizationId
      const workshopData = {
        id: workshopRole.organizationId,
        // Outros dados virão do backend futuramente
      };

      localStorage.setItem('workshop-admin', JSON.stringify(adminData));
      localStorage.setItem('workshop-workshops', JSON.stringify([workshopData]));

      toast({
        title: 'Login realizado com sucesso!',
        description: `Bem-vindo(a), ${result.user.name}`,
      });

      // Debug do redirect
      console.log('🔀 Redirect recebido:', result.defaultRedirect);
      console.log('🔀 Redirecionando para:', result.defaultRedirect || '/workshop/dashboard');

      // Sempre redirecionar para o dashboard, ignorando o redirect sugerido
      setLocation('/workshop/dashboard');

    } catch (error) {
      console.error('❌ Erro no login:', error);

      // Log mais detalhado do erro
      if (error instanceof Error) {
        console.error('Mensagem de erro:', error.message);
        console.error('Stack trace:', error.stack);
      }

      // Se for erro de parsing JSON
      if (error instanceof SyntaxError) {
        console.error('🚨 Erro de parse JSON detectado');
        setErrorMessage('Erro de formato na resposta do servidor. Por favor, tente novamente ou entre em contato com o suporte.');
      } else {
        setErrorMessage('Erro de conexão. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Painel da Oficina
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Acesse sua conta para gerenciar sua oficina RuidCar
            </p>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Primeira vez aqui?
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setLocation('/workshop/register')}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar nova oficina
              </Button>
            </div>

            <div className="text-center mt-6 text-sm text-muted-foreground">
              <p>
                Problemas para acessar?{' '}
                <button
                  className="text-primary hover:underline"
                  onClick={() => {
                    toast({
                      title: 'Suporte',
                      description: 'Entre em contato: contato@ruidcar.com.br',
                    });
                  }}
                >
                  Entre em contato
                </button>
              </p>
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