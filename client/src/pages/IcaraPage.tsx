import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Calendar, MapPin, Car, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trackContactEvent, trackLeadEvent } from '@/lib/fbPixel';

export default function IcaraPage() {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Set page metadata for SEO
    document.title = 'RUIDCAR em Içara - Diagnóstico Automotivo Avançado';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Conheça a RUIDCAR em Içara. Diagnóstico automotivo avançado com tecnologia de ponta. Agende seu diagnóstico e descubra problemas no seu veículo com precisão.'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Conheça a RUIDCAR em Içara. Diagnóstico automotivo avançado com tecnologia de ponta. Agende seu diagnóstico e descubra problemas no seu veículo com precisão.';
      document.head.appendChild(meta);
    }

    setIsLoaded(true);
    
    // Track page visit as a lead event
    trackLeadEvent('icara-page');
  }, []);

  const handleWhatsAppClick = () => {
    // Track contact event when user clicks WhatsApp
    trackContactEvent('whatsapp', 'icara-page');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
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

  const benefits = [
    {
      icon: <Car className="w-6 h-6 text-primary" />,
      title: "Diagnóstico Preciso",
      description: "Identificação exata de problemas através de análise acústica avançada"
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-primary" />,
      title: "Tecnologia Avançada",
      description: "Equipamento de última geração para análise completa do seu veículo"
    },
    {
      icon: <MapPin className="w-6 h-6 text-primary" />,
      title: "Atendimento Local",
      description: "Equipe especializada em Içara e região para melhor atendimento"
    }
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-neutral-50">
        <div className="animate-pulse">
          <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
        </div>
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
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          variants={itemVariants}
        >
          <h1 className="text-3xl md:text-5xl font-bold text-secondary mb-6">
            RUIDCAR em <span className="text-primary">Içara</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Descubra a tecnologia de diagnóstico automotivo mais avançada do mercado. 
            Nossa equipe especializada em Içara está pronta para identificar problemas 
            no seu veículo com precisão inigualável.
          </p>
          
          {/* CTA Button */}
          <a 
            href="https://wa.me/5548991567879?text=Ol%C3%A1%2C%20vim%20pela%20RUIDCAR."
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
          >
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Agendar Diagnóstico
            </Button>
          </a>
        </motion.div>

        {/* Benefits Section */}
        <motion.div 
          className="grid md:grid-cols-3 gap-6 mb-12"
          variants={itemVariants}
        >
          {benefits.map((benefit, index) => (
            <Card key={index} className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-secondary mb-3">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Local Focus Section */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center"
          variants={itemVariants}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-6">
              Por que escolher a RUIDCAR em Içara?
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold text-primary mb-3">
                  Atendimento Personalizado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Nossa equipe local conhece as necessidades específicas dos motoristas 
                  de Içara e região, oferecendo um atendimento personalizado e eficiente.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary mb-3">
                  Tecnologia de Ponta
                </h3>
                <p className="text-muted-foreground mb-4">
                  Utilizamos equipamentos de última geração para diagnóstico por análise 
                  acústica, garantindo precisão na identificação de problemas.
                </p>
              </div>
            </div>
            
            {/* Secondary CTA */}
            <div className="mt-8">
              <a 
                href="https://wa.me/5548991567879?text=Ol%C3%A1%2C%20vim%20pela%20RUIDCAR."
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
              >
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary text-primary hover:bg-primary hover:text-white px-6 py-3 font-semibold"
                >
                  Agende Agora Mesmo
                </Button>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div 
          className="text-center mt-12"
          variants={itemVariants}
        >
          <p className="text-muted-foreground">
            Dúvidas? Entre em contato conosco e descubra como a RUIDCAR pode ajudar você.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}