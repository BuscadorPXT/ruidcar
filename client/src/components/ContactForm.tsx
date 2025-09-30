import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import type { CountryData } from 'react-phone-input-2';
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { detectLocationSafe, getContactInfoSafe } from '@/lib/safeGeoLocation';
import { trackContactEvent } from '@/lib/fbPixel';

// Esquema de validação do formulário
const contactFormSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  company: z.string().min(2, "Empresa deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  country: z.string().min(2, "País é obrigatório"),
  businessType: z.string().min(1, "Tipo de empresa é obrigatório"),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
  const sectionRef = useRef(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const { toast } = useToast();
  const { i18n, t } = useTranslation();
  const [isBrazil, setIsBrazil] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Detecta a localização do usuário usando método seguro para produção
  useEffect(() => {
    try {
      // 1. Primeiro tenta usar o idioma do i18n (método mais seguro)
      const currentLang = (i18n.language || '').toLowerCase();
      console.log('Idioma atual i18n (ContactForm):', currentLang);
      
      if (currentLang && (currentLang.startsWith('pt') || currentLang.includes('br'))) {
        console.log('Brasileiro detectado via i18n:', true);
        setIsBrazil(true);
        return;
      }
      
      if (currentLang && currentLang.startsWith('es')) {
        console.log('Idioma espanhol detectado via i18n - internacional:', true);
        setIsBrazil(false);
        return;
      }
      
      // 2. Usa o detector seguro como fallback
      const { isBrazil: fromBrazil } = detectLocationSafe();
      console.log('Localização detectada via método seguro (ContactForm):', { fromBrazil });
      setIsBrazil(fromBrazil);
      
    } catch (error) {
      // Em caso de erro, usar Brasil como default
      console.error('Erro ao detectar localização no ContactForm:', error);
      setIsBrazil(true);
    }
  }, [i18n.language]);
  
  // Obter informações de contato seguras
  const info = getContactInfoSafe(isBrazil);
  
  // Configuração da mutation para envio do formulário
  const contactMutation = useMutation({
    mutationFn: async (formData: ContactFormData) => {
      const response = await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      // Tentar enviar para o Coda também
      try {
        const codaData = {
          nome: formData.fullName,
          empresa: formData.company,
          email: formData.email,
          whatsapp: formData.whatsapp,
          cidade: formData.city,
          estado: formData.state,
          tipoEmpresa: formData.businessType,
          mensagem: formData.message,
          dataEnvio: new Date().toLocaleString('pt-BR'),
          origem: 'Site RuidCar - Formulário de Contato'
        };
        
        const codaResponse = await fetch('/api/coda-send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(codaData)
        });
        
        if (!codaResponse.ok) {
          console.warn('Falha ao enviar dados para o Coda, mas os dados foram salvos no sistema interno');
        } else {
          console.log('Dados enviados com sucesso para o Coda');
        }
      } catch (codaError) {
        console.error('Erro ao tentar enviar para o Coda:', codaError);
        // Não falharemos a mutation principal se o Coda falhar
      }
      
      return response;
    },
    onSuccess: () => {
      setShowSuccessMessage(true);
      reset();
      // Track contact event for Facebook Pixel
      trackContactEvent('form', 'contact-form');
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error submitting contact form:", error);
    },
  });
  
  // Formulário com validação zod
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      company: "",
      email: "",
      whatsapp: "",
      city: "",
      state: "",
      country: "br",
      businessType: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  return (
    <section 
      id="contact"
      ref={sectionRef}
      className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-accent/20"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </motion.div>

        <motion.div 
          className="bg-card rounded-xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-6 lg:p-8">
              {!showSuccessMessage ? (
                <>
                  <h3 className="text-xl font-semibold text-card-foreground mb-6">{t('contact.requestInfo')}</h3>
                  
                  <motion.form 
                    onSubmit={handleSubmit(onSubmit)} 
                    className="space-y-4"
                    initial={{ opacity: 1, scale: 1 }}
                    animate={showSuccessMessage ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="full-name">{t('contact.form.fullName')}</Label>
                        <Input 
                          id="full-name"
                          {...register("fullName", { required: true })}
                          className={errors.fullName ? "border-red-500" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">{t('contact.form.company')}</Label>
                        <Input 
                          id="company"
                          {...register("company", { required: true })}
                          className={errors.company ? "border-red-500" : ""}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="email">{t('contact.form.email')}</Label>
                        <Input 
                          id="email"
                          type="email"
                          {...register("email", { 
                            required: true,
                            pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i 
                          })}
                          className={errors.email ? "border-red-500" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="whatsapp">{t('contact.form.whatsapp')}</Label>
                        <div className={errors.whatsapp ? "border-red-500 rounded phone-input-container" : "phone-input-container"}>
                          <PhoneInput
                            country={'br'}
                            inputProps={{
                              id: 'whatsapp',
                              name: 'whatsapp',
                              required: true,
                              placeholder: t('contact.form.whatsappPlaceholder')
                            }}
                            onChange={(value, countryData) => {
                              setValue('whatsapp', value);
                              setValue('country', (countryData as CountryData)?.countryCode || 'br');
                            }}
                            countryCodeEditable={false}
                            enableSearch={true}
                            disableSearchIcon={false}
                            autoFormat={true}
                            disableCountryCode={false}
                            searchPlaceholder={t('contact.form.searchCountry')}
                            searchNotFound={t('contact.form.countryNotFound')}
                            preferredCountries={['br', 'us', 'es', 'pt', 'ar', 'co', 'mx']}
                            inputClass="w-full"
                            containerClass="w-full"
                            dropdownClass="country-dropdown"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="city">{t('contact.form.city', 'Cidade')}</Label>
                        <Input 
                          id="city"
                          {...register("city", { required: true })}
                          className={errors.city ? "border-red-500" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">{t('contact.form.state', 'Estado')}</Label>
                        <Input 
                          id="state"
                          {...register("state", { required: true })}
                          className={errors.state ? "border-red-500" : ""}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="business-type">Tipo de estabelecimento</Label>
                      <Select onValueChange={(value) => setValue("businessType", value)}>
                        <SelectTrigger className={errors.businessType ? "border-red-500" : ""}>
                          <SelectValue placeholder="Selecione o tipo de estabelecimento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="montadora">Montadora</SelectItem>
                          <SelectItem value="autocenter">Auto Center</SelectItem>
                          <SelectItem value="oficina">Oficina Mecânica</SelectItem>
                          <SelectItem value="blindadora">Blindadora</SelectItem>
                          <SelectItem value="autopecas">Auto Peças</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="message">{t('contact.form.message')}</Label>
                      <Textarea 
                        id="message"
                        rows={4}
                        {...register("message", { required: true })}
                        className={errors.message ? "border-red-500" : ""}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={contactMutation.isPending}>
                      {contactMutation.isPending ? t('contact.form.sending') : t('contact.form.submit')}
                    </Button>
                  </motion.form>
                </>
              ) : (
                <motion.div
                  className="flex flex-col items-center justify-center text-center py-12 px-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-green-100 rounded-full p-4 mb-6">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-4">
                    Mensagem enviada com sucesso!
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                    Recebemos suas informações! Em breve, alguém da nossa equipe entrará em contato com você pelo WhatsApp.
                  </p>
                  <Button 
                    onClick={() => setShowSuccessMessage(false)} 
                    variant="outline"
                    className="mt-4"
                  >
                    Enviar nova mensagem
                  </Button>
                </motion.div>
              )}
            </div>
            
            <div className="bg-accent/50 p-6 lg:p-8">
              <h3 className="text-xl font-semibold text-card-foreground mb-6">{t('contact.contactInfo')}</h3>
              
              <div className="space-y-6">
                <div id="email-tab" className="flex items-start">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">{info.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-foreground">WhatsApp</p>
                    <p className="text-sm text-muted-foreground wpp-text">
                      WhatsApp: <a id="wpp-link" href={info.whatsappLink} target="_blank" rel="noopener noreferrer">{info.whatsapp}</a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-foreground">{t('contact.form.address', 'Endereço')}</p>
                    <p className="text-sm text-muted-foreground">{info.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-foreground">{t('contact.form.phone', 'Telefone')}</p>
                    <p className="text-sm text-muted-foreground">{info.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}