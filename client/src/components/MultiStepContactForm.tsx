import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building, Mail, Phone, MapPin, MessageSquare, Target } from 'lucide-react';
import MultiStepForm, { FormStep } from '@/components/MultiStepForm';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// Schemas de validação para cada etapa
const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
});

const businessInfoSchema = z.object({
  company: z.string().min(2, "Empresa deve ter pelo menos 2 caracteres"),
  businessType: z.string().min(1, "Tipo de empresa é obrigatório"),
  whatsapp: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos"),
});

const locationInfoSchema = z.object({
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  country: z.string().min(2, "País é obrigatório"),
});

const messageSchema = z.object({
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
  contactPreference: z.string().optional(),
  budget: z.string().optional(),
});

type PersonalInfo = z.infer<typeof personalInfoSchema>;
type BusinessInfo = z.infer<typeof businessInfoSchema>;
type LocationInfo = z.infer<typeof locationInfoSchema>;
type MessageInfo = z.infer<typeof messageSchema>;

interface MultiStepContactFormProps {
  onSubmit: (data: any) => void;
  className?: string;
}

export default function MultiStepContactForm({ onSubmit, className }: MultiStepContactFormProps) {
  const [formData, setFormData] = useState<any>({});

  // Step 1: Personal Information
  const PersonalInfoStep = () => {
    const { register, formState: { errors }, watch, setValue } = useForm<PersonalInfo>({
      resolver: zodResolver(personalInfoSchema),
      defaultValues: formData.personal || {}
    });

    const watchedValues = watch();

    // Update parent form data when this step changes
    useState(() => {
      setFormData(prev => ({ ...prev, personal: watchedValues }));
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Informações Pessoais</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              placeholder="Digite seu nome completo"
              {...register('fullName')}
              aria-invalid={errors.fullName ? 'true' : 'false'}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive" role="alert">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && (
              <p className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Step 2: Business Information
  const BusinessInfoStep = () => {
    const { register, formState: { errors }, watch, setValue } = useForm<BusinessInfo>({
      resolver: zodResolver(businessInfoSchema),
      defaultValues: formData.business || {}
    });

    const watchedValues = watch();

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Building className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Informações da Empresa</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Nome da Empresa *</Label>
            <Input
              id="company"
              placeholder="Nome da sua oficina/empresa"
              {...register('company')}
              aria-invalid={errors.company ? 'true' : 'false'}
            />
            {errors.company && (
              <p className="text-sm text-destructive" role="alert">
                {errors.company.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessType">Tipo de Empresa *</Label>
            <Select onValueChange={(value) => setValue('businessType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oficina-independente">Oficina Independente</SelectItem>
                <SelectItem value="rede-oficinas">Rede de Oficinas</SelectItem>
                <SelectItem value="concessionaria">Concessionária</SelectItem>
                <SelectItem value="centro-automotivo">Centro Automotivo</SelectItem>
                <SelectItem value="distribuidor">Distribuidor</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            {errors.businessType && (
              <p className="text-sm text-destructive" role="alert">
                {errors.businessType.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp *</Label>
          <PhoneInput
            country={'br'}
            value={watchedValues.whatsapp}
            onChange={(phone) => setValue('whatsapp', phone)}
            inputProps={{
              name: 'whatsapp',
              required: true,
              className: 'w-full'
            }}
            containerClass="w-full"
            inputClass="w-full px-3 py-2 border border-input rounded-md"
          />
          {errors.whatsapp && (
            <p className="text-sm text-destructive" role="alert">
              {errors.whatsapp.message}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Step 3: Location Information
  const LocationInfoStep = () => {
    const { register, formState: { errors }, watch, setValue } = useForm<LocationInfo>({
      resolver: zodResolver(locationInfoSchema),
      defaultValues: formData.location || {}
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Localização</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              placeholder="Sua cidade"
              {...register('city')}
              aria-invalid={errors.city ? 'true' : 'false'}
            />
            {errors.city && (
              <p className="text-sm text-destructive" role="alert">
                {errors.city.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Estado *</Label>
            <Input
              id="state"
              placeholder="UF"
              {...register('state')}
              aria-invalid={errors.state ? 'true' : 'false'}
            />
            {errors.state && (
              <p className="text-sm text-destructive" role="alert">
                {errors.state.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">País *</Label>
            <Select onValueChange={(value) => setValue('country', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BR">Brasil</SelectItem>
                <SelectItem value="AR">Argentina</SelectItem>
                <SelectItem value="UY">Uruguai</SelectItem>
                <SelectItem value="PY">Paraguai</SelectItem>
                <SelectItem value="CL">Chile</SelectItem>
                <SelectItem value="CO">Colômbia</SelectItem>
                <SelectItem value="PE">Peru</SelectItem>
                <SelectItem value="BO">Bolívia</SelectItem>
                <SelectItem value="EC">Equador</SelectItem>
                <SelectItem value="VE">Venezuela</SelectItem>
                <SelectItem value="OTHER">Outro</SelectItem>
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-sm text-destructive" role="alert">
                {errors.country.message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Step 4: Message and Preferences
  const MessageStep = () => {
    const { register, formState: { errors }, watch, setValue } = useForm<MessageInfo>({
      resolver: zodResolver(messageSchema),
      defaultValues: formData.message || {}
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Mensagem e Preferências</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              placeholder="Descreva seu interesse no RuidCar, necessidades específicas ou dúvidas..."
              rows={4}
              {...register('message')}
              aria-invalid={errors.message ? 'true' : 'false'}
            />
            {errors.message && (
              <p className="text-sm text-destructive" role="alert">
                {errors.message.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPreference">Preferência de Contato</Label>
              <Select onValueChange={(value) => setValue('contactPreference', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Como prefere ser contatado?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="any">Qualquer forma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento Aproximado</Label>
              <Select onValueChange={(value) => setValue('budget', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Faixa de investimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ate-50k">Até R$ 50.000</SelectItem>
                  <SelectItem value="50k-100k">R$ 50.000 - R$ 100.000</SelectItem>
                  <SelectItem value="100k-200k">R$ 100.000 - R$ 200.000</SelectItem>
                  <SelectItem value="acima-200k">Acima de R$ 200.000</SelectItem>
                  <SelectItem value="nao-definido">Não definido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const steps: FormStep[] = [
    {
      id: 'personal',
      title: 'Dados Pessoais',
      description: 'Vamos começar com suas informações básicas',
      component: <PersonalInfoStep />,
      validation: async () => {
        try {
          personalInfoSchema.parse(formData.personal);
          return true;
        } catch {
          return false;
        }
      }
    },
    {
      id: 'business',
      title: 'Informações da Empresa',
      description: 'Conte-nos sobre sua empresa',
      component: <BusinessInfoStep />,
      validation: async () => {
        try {
          businessInfoSchema.parse(formData.business);
          return true;
        } catch {
          return false;
        }
      }
    },
    {
      id: 'location',
      title: 'Localização',
      description: 'Onde você está localizado?',
      component: <LocationInfoStep />,
      validation: async () => {
        try {
          locationInfoSchema.parse(formData.location);
          return true;
        } catch {
          return false;
        }
      }
    },
    {
      id: 'message',
      title: 'Mensagem',
      description: 'Finalize com sua mensagem e preferências',
      component: <MessageStep />,
      validation: async () => {
        try {
          messageSchema.parse(formData.message);
          return true;
        } catch {
          return false;
        }
      }
    }
  ];

  const handleComplete = (finalData: any) => {
    // Flatten the data structure
    const flattenedData = {
      ...finalData.personal,
      ...finalData.business,
      ...finalData.location,
      ...finalData.message,
    };

    onSubmit(flattenedData);
  };

  return (
    <div className={className}>
      <MultiStepForm
        steps={steps}
        onComplete={handleComplete}
        allowSkip={false}
        autoSave={true}
        autoSaveKey="ruidcar-contact-form"
        showProgress={true}
      />
    </div>
  );
}