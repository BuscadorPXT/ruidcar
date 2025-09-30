import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw
} from 'lucide-react';

const checkSchema = z.object({
  identifier: z.string().min(1, 'Informe o código ou email'),
});

type CheckFormData = z.infer<typeof checkSchema>;

interface WorkshopStatus {
  found: boolean;
  workshop?: {
    name: string;
    code: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    rejectionReason?: string;
    adminEmail?: string;
  };
}

export default function WorkshopStatusCheck() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<WorkshopStatus | null>(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CheckFormData>({
    resolver: zodResolver(checkSchema)
  });

  const onSubmit = async (data: CheckFormData) => {
    setIsChecking(true);
    setError('');
    setStatus(null);

    try {
      const response = await fetch('/api/workshops/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: data.identifier.trim()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Erro ao verificar status');
        return;
      }

      setStatus(result);

      if (!result.found) {
        setError('Oficina não encontrada. Verifique o código ou email informado.');
      }

    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Aguardando Aprovação</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitada</Badge>;
      default:
        return null;
    }
  };

  const getStatusMessage = (workshop?: WorkshopStatus['workshop']) => {
    if (!workshop) return '';

    switch (workshop.status) {
      case 'pending':
        const daysSince = Math.floor(
          (Date.now() - new Date(workshop.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return `Sua oficina está em análise há ${daysSince} dia${daysSince !== 1 ? 's' : ''}. O prazo médio de aprovação é de 2-3 dias úteis.`;

      case 'approved':
        return `Parabéns! Sua oficina foi aprovada e já está disponível na plataforma. Use o código ${workshop.code} para fazer login.`;

      case 'rejected':
        return workshop.rejectionReason
          ? `Motivo da rejeição: ${workshop.rejectionReason}`
          : 'Sua solicitação foi rejeitada. Entre em contato com o suporte para mais informações.';

      default:
        return '';
    }
  };

  const handleReset = () => {
    reset();
    setStatus(null);
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Search className="h-4 w-4 mr-2" />
          Verificar Status da Aprovação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verificar Status da Oficina</DialogTitle>
          <DialogDescription>
            Informe o código único da oficina ou o email cadastrado para verificar o status da aprovação.
          </DialogDescription>
        </DialogHeader>

        {!status && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="identifier">Código ou Email</Label>
              <Input
                id="identifier"
                placeholder="Ex: RCW-1234 ou email@exemplo.com"
                {...register('identifier')}
                disabled={isChecking}
              />
              {errors.identifier && (
                <p className="text-sm text-destructive mt-1">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Verificar Status
                </>
              )}
            </Button>
          </form>
        )}

        {status?.found && status.workshop && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{status.workshop.name}</h3>
                {getStatusIcon(status.workshop.status)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                {getStatusBadge(status.workshop.status)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Código:</span>
                <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                  {status.workshop.code}
                </code>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  {getStatusMessage(status.workshop)}
                </p>
              </div>

              {status.workshop.status === 'approved' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Você já pode fazer login usando seu email e senha cadastrados.
                  </AlertDescription>
                </Alert>
              )}

              {status.workshop.status === 'rejected' && (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Para mais informações ou nova tentativa, entre em contato:
                    <br />
                    <strong>contato@ruidcar.com.br</strong>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleReset}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Fazer Nova Consulta
            </Button>
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Problemas? Entre em contato:
            <br />
            <a
              href="mailto:contato@ruidcar.com.br"
              className="text-primary hover:underline"
            >
              contato@ruidcar.com.br
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}