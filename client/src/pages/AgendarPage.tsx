import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, MapPin, Phone, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const scheduleSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  vehicleModel: z.string().min(2, 'Modelo do veículo é obrigatório'),
  vehicleYear: z.string().min(4, 'Ano do veículo é obrigatório'),
  problemDescription: z.string().min(10, 'Descreva o problema com mais detalhes'),
  preferredDate: z.string().min(1, 'Data preferencial é obrigatória'),
  preferredTime: z.string().min(1, 'Horário preferencial é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

export default function AgendarPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema)
  });

  const onSubmit = async (data: ScheduleFormData) => {
    setIsSubmitting(true);
    
    try {
      // Format data for submission
      const formattedData = {
        ...data,
        dataEnvio: new Date().toISOString(),
        origem: 'Agendamento Içara',
        tipoEmpresa: 'Cliente Final'
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Agendamento enviado!",
          description: "Entraremos em contato em breve para confirmar seu diagnóstico.",
        });
      } else {
        throw new Error('Erro no envio');
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-secondary mb-4">
                Agendamento Enviado!
              </h2>
              <p className="text-muted-foreground mb-6">
                Recebemos sua solicitação de diagnóstico. Nossa equipe entrará em contato 
                em breve para confirmar o agendamento.
              </p>
              <Button 
                onClick={() => window.location.href = '/icara'}
                className="bg-primary hover:bg-primary/90"
              >
                Voltar para Içara
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <motion.div 
        className="container mx-auto px-4 py-8 md:py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          variants={itemVariants}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
            Agendar <span className="text-primary">Diagnóstico</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Preencha o formulário abaixo para agendar seu diagnóstico automotivo em Içara. 
            Nossa equipe entrará em contato para confirmar data e horário.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <motion.div 
            className="lg:col-span-2"
            variants={itemVariants}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Dados do Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input 
                        id="name"
                        {...register("name")}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        type="email"
                        {...register("email")}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  {/* Phone and City */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">WhatsApp</Label>
                      <div className="phone-input-container">
                        <PhoneInput
                          country={'br'}
                          value={watch("phone")}
                          onChange={(value) => setValue("phone", value)}
                          inputClass={errors.phone ? "border-red-500" : ""}
                          containerClass="w-full"
                          inputStyle={{ width: '100%' }}
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input 
                        id="city"
                        {...register("city")}
                        placeholder="Içara, SC"
                        className={errors.city ? "border-red-500" : ""}
                      />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleModel">Modelo do Veículo</Label>
                      <Input 
                        id="vehicleModel"
                        {...register("vehicleModel")}
                        placeholder="Ex: Honda Civic, Toyota Corolla"
                        className={errors.vehicleModel ? "border-red-500" : ""}
                      />
                      {errors.vehicleModel && <p className="text-red-500 text-sm mt-1">{errors.vehicleModel.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="vehicleYear">Ano do Veículo</Label>
                      <Input 
                        id="vehicleYear"
                        {...register("vehicleYear")}
                        placeholder="Ex: 2020"
                        className={errors.vehicleYear ? "border-red-500" : ""}
                      />
                      {errors.vehicleYear && <p className="text-red-500 text-sm mt-1">{errors.vehicleYear.message}</p>}
                    </div>
                  </div>

                  {/* Schedule Preferences */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preferredDate">Data Preferencial</Label>
                      <Input 
                        id="preferredDate"
                        type="date"
                        {...register("preferredDate")}
                        min={new Date().toISOString().split('T')[0]}
                        className={errors.preferredDate ? "border-red-500" : ""}
                      />
                      {errors.preferredDate && <p className="text-red-500 text-sm mt-1">{errors.preferredDate.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="preferredTime">Horário Preferencial</Label>
                      <Select onValueChange={(value) => setValue("preferredTime", value)}>
                        <SelectTrigger className={errors.preferredTime ? "border-red-500" : ""}>
                          <SelectValue placeholder="Selecione o horário" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Manhã (8h às 12h)</SelectItem>
                          <SelectItem value="afternoon">Tarde (13h às 17h)</SelectItem>
                          <SelectItem value="flexible">Horário flexível</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.preferredTime && <p className="text-red-500 text-sm mt-1">{errors.preferredTime.message}</p>}
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div>
                    <Label htmlFor="problemDescription">Descrição do Problema</Label>
                    <Textarea 
                      id="problemDescription"
                      {...register("problemDescription")}
                      placeholder="Descreva os ruídos ou problemas que está percebendo no veículo..."
                      rows={4}
                      className={errors.problemDescription ? "border-red-500" : ""}
                    />
                    {errors.problemDescription && <p className="text-red-500 text-sm mt-1">{errors.problemDescription.message}</p>}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Enviando...' : 'Agendar Diagnóstico'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Sidebar */}
          <motion.div 
            className="space-y-6"
            variants={itemVariants}
          >
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">Telefone</p>
                    <p className="text-muted-foreground">Em breve</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-muted-foreground">contato@ruidcar.com.br</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">Atendimento</p>
                    <p className="text-muted-foreground">Içara e região</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Process Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Como Funciona
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-sm">Preencha o formulário de agendamento</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-sm">Nossa equipe entrará em contato para confirmar</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-sm">Realizamos o diagnóstico no local e horário agendado</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}