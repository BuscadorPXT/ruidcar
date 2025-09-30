import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Globe, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { type Workshop } from '@shared/schema';
import { BRAZILIAN_STATES, STATE_NAMES } from '@shared/constants';

// Schema de validação para o formulário
const workshopFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  address: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres'),
  contact: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  latitude: z.string().regex(/^-?\d+\.?\d*$/, 'Latitude inválida'),
  longitude: z.string().regex(/^-?\d+\.?\d*$/, 'Longitude inválida'),
  city: z.string().optional(),
  state: z.string().optional().or(z.literal('')),
  active: z.boolean().default(true),
});

type WorkshopFormData = z.infer<typeof workshopFormSchema>;

interface WorkshopFormProps {
  isOpen: boolean;
  onClose: () => void;
  workshop?: Workshop | null; // undefined = criar novo, null = fechar, Workshop = editar
  onSuccess: () => void; // callback para recarregar lista
}

export default function WorkshopForm({ isOpen, onClose, workshop, onSuccess }: WorkshopFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isEditing = !!workshop;
  const title = isEditing ? 'Editar Oficina' : 'Nova Oficina';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<WorkshopFormData>({
    resolver: zodResolver(workshopFormSchema),
    defaultValues: {
      name: workshop?.name || '',
      address: workshop?.address || '',
      contact: workshop?.contact || '',
      phone: workshop?.phone || '',
      website: workshop?.website || '',
      latitude: workshop?.latitude || '',
      longitude: workshop?.longitude || '',
      city: workshop?.city || '',
      state: workshop?.state || '',
      active: workshop?.active ?? true,
    },
  });

  const selectedState = watch('state');
  const isActive = watch('active');

  // Reset form when workshop changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: workshop?.name || '',
        address: workshop?.address || '',
        contact: workshop?.contact || '',
        phone: workshop?.phone || '',
        website: workshop?.website || '',
        latitude: workshop?.latitude || '',
        longitude: workshop?.longitude || '',
        city: workshop?.city || '',
        state: workshop?.state || '',
        active: workshop?.active ?? true,
      });
    }
  }, [isOpen, workshop, reset]);

  const onSubmit = async (data: WorkshopFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/admin/workshops/${workshop.id}`
        : '/api/admin/workshops';

      const method = isEditing ? 'PUT' : 'POST';

      // Converter campos opcionais vazios para null
      const payload = {
        ...data,
        contact: data.contact || null,
        phone: data.phone || null,
        website: data.website || null,
        city: data.city || null,
        state: data.state && data.state.trim() ? data.state : null,
      };

      console.log(`${method} ${url}`, payload);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: isEditing ? 'Oficina atualizada' : 'Oficina criada',
          description: result.message,
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(result.message || 'Erro ao salvar oficina');
      }
    } catch (error) {
      console.error('Erro ao salvar oficina:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      toast({
        title: 'Erro ao salvar oficina',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('latitude', position.coords.latitude.toString());
          setValue('longitude', position.coords.longitude.toString());
          toast({
            title: 'Localização obtida',
            description: 'Coordenadas atualizadas com sua localização atual',
          });
        },
        (error) => {
          toast({
            title: 'Erro ao obter localização',
            description: 'Não foi possível obter sua localização atual',
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({
        title: 'Geolocalização não suportada',
        description: 'Seu navegador não suporta geolocalização',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite as informações da oficina abaixo.'
              : 'Preencha as informações para criar uma nova oficina.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Oficina *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Auto Center Silva"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo *</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo - SP 01234-567"
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* Localização */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                {...register('latitude')}
                placeholder="-23.550520"
              />
              {errors.latitude && (
                <p className="text-sm text-red-600">{errors.latitude.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                {...register('longitude')}
                placeholder="-46.633308"
              />
              {errors.longitude && (
                <p className="text-sm text-red-600">{errors.longitude.message}</p>
              )}
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleGetLocation}
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Usar minha localização
              </Button>
            </div>
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="São Paulo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select
                value={selectedState || 'NONE'}
                onValueChange={(value) => setValue('state', value === 'NONE' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Nenhum estado</SelectItem>
                  {BRAZILIAN_STATES.map(state => (
                    <SelectItem key={state} value={state}>
                      {state} - {STATE_NAMES[state]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-2">
            <Label htmlFor="contact">Contato</Label>
            <Input
              id="contact"
              {...register('contact')}
              placeholder="Ex: João Silva"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="Ex: (11) 99999-9999"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register('website')}
              placeholder="https://www.example.com"
            />
            {errors.website && (
              <p className="text-sm text-red-600">{errors.website.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('active', checked)}
            />
            <Label htmlFor="active" className="flex items-center gap-2">
              {isActive ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Oficina ativa
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  Oficina inativa
                </>
              )}
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}