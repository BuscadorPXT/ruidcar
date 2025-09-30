import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(1, 'Password é obrigatória')
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Tentando fazer login admin...');
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include' // Importante: para receber cookies
      });

      const result = await response.json();
      console.log('📊 Resposta do login:', result);

      if (response.ok) {
        // Token agora está no cookie HTTP-only seguro, não precisamos armazenar
        toast({
          title: 'Login realizado com sucesso!',
          description: `Bem-vindo, ${result.user.name}`,
        });

        console.log('✅ Login bem-sucedido, redirecionando...');
        // Redirect to admin dashboard
        setLocation('/admin');
      } else {
        throw new Error(result.message || 'Erro no login');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      setError(message);
      toast({
        title: 'Erro no login',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">RuidCar Admin</h1>
          <p className="text-gray-600 mt-2">Painel Administrativo</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Login Administrativo
            </CardTitle>
            <CardDescription>
              Acesse o painel de gerenciamento de oficinas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@ruidcar.com"
                    className="pl-10"
                    {...register('email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    className="pl-10"
                    {...register('password')}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fazendo login...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-primary">
                ← Voltar ao site principal
              </Link>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Primeira vez?</h4>
              <p className="text-xs text-gray-600 mb-2">
                Para criar um usuário administrador, use o endpoint de setup:
              </p>
              <code className="text-xs bg-white p-2 rounded border block">
                POST /api/admin/setup
              </code>
              <p className="text-xs text-gray-500 mt-1">
                Com setupKey: "ruidcar-admin-setup-2025"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}