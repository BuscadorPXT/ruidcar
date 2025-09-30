import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MapPin, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import LazyYouTube from '@/components/LazyYouTube';

// Import assets
import logoImage from '../assets/logo.png';
import backgroundMobileImage from '../assets/images/ruidcar-background-mobile.jpg';

export default function UnifiedLanding() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    setIsContentLoaded(true);
    // Mostrar opções após 3 segundos ou quando usuário interagir
    const timer = setTimeout(() => {
      setShowOptions(true);
    }, 3000);

    const handleInteraction = () => {
      setShowOptions(true);
      clearTimeout(timer);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('scroll', handleInteraction);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('scroll', handleInteraction);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.3
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

  if (!showOptions) {
    return (
      <div className="premium-container">
        {/* Background para desktop (vídeo YouTube com lazy loading) */}
        {!isMobile && (
          <div className="youtube-background">
            <LazyYouTube
              videoId="NZKot1QLwDM"
              title="RuidCar Background Video"
              className="w-full h-full"
              autoplay={true}
              muted={true}
              loop={true}
              controls={false}
              playlist="NZKot1QLwDM"
            />
          </div>
        )}

        {/* Background para mobile (imagem estática) */}
        {isMobile && (
          <div className="image-background">
            <img
              src={backgroundMobileImage}
              alt="RuidCar Equipment"
              className="w-full h-full object-cover"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>
        )}

        {/* Overlay to enhance text visibility */}
        <div className="gradient-overlay"></div>

        {/* Content overlay */}
        <motion.div
          className="content-overlay"
          variants={containerVariants}
          initial="hidden"
          animate={isContentLoaded ? "visible" : "hidden"}
        >
          <motion.p
            className="bible-quote text-lg"
            variants={itemVariants}
          >
            "Clama a mim, e responder-te-ei e anunciar-te-ei coisas grandes e firmes, que não sabes."
          </motion.p>

          <motion.p
            className="bible-reference"
            variants={itemVariants}
          >
            Jeremias 33:3
          </motion.p>

          <motion.div
            className="logo-container"
            variants={itemVariants}
          >
            <img
              src={logoImage}
              alt="RuidCar"
              className="premium-logo"
            />
          </motion.div>

          <motion.p
            className="premium-subtitle"
            variants={itemVariants}
          >
            {t('premium.subtitle', 'A solução definitiva para diagnóstico automotivo que revoluciona sua oficina com precisão e tecnologia de ponta.')}
          </motion.p>

          <motion.div
            className="text-center mt-8"
            variants={itemVariants}
          >
            <p className="text-white text-sm opacity-75">
              Toque em qualquer lugar para continuar
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-neutral-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg overflow-hidden p-6 sm:p-8 md:p-10">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="w-full max-w-[280px] md:max-w-[320px] mb-8">
            <img
              src={logoImage}
              alt="RuidCar Logo"
              className="w-full h-auto"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-10">
            {t('landing.title', 'Como podemos te ajudar hoje?')}
          </h1>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            {/* Buy Option */}
            <a href="/home">
              <div className={cn(
                "h-auto p-6 flex flex-col items-center text-center border-2 border-primary",
                "hover:bg-primary/5 transition-all duration-300 rounded-md cursor-pointer",
                "bg-white shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}>
                <div className="w-16 h-16 mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Info className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-secondary mb-2">
                  {t('landing.buy_option', 'Quero Investir no RuidCar')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('landing.buy_description', 'Conheça o produto, preços, especificações técnicas e faça seu pedido')}
                </p>
              </div>
            </a>

            {/* Find Workshop Option */}
            <a
              href="https://localize.ruidcar.com.br"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={cn(
                "h-auto p-6 flex flex-col items-center text-center border-2 border-secondary",
                "hover:bg-secondary/5 transition-all duration-300 rounded-md cursor-pointer",
                "bg-white shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
              )}>
                <div className="w-16 h-16 mb-4 bg-secondary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-secondary mb-2">
                  {t('landing.workshop_option', 'Encontrar Oficina Parceira')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t('landing.workshop_description', 'Localize a oficina mais próxima que utiliza a tecnologia RuidCar')}
                </p>
              </div>
            </a>
          </div>

          {/* Additional Info */}
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              Precisa de ajuda? Entre em contato conosco:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center">
              <a
                href="https://wa.me/554999992055"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                WhatsApp: (49) 9 9999-2055
              </a>
              <a
                href="mailto:comercial@ruidcar.com.br"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                comercial@ruidcar.com.br
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}