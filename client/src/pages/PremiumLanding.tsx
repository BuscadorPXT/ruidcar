import { useEffect, useState } from 'react';
import '../styles/premium-landing.css'; // Estilos específicos para a página premium
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import LazyYouTube from '@/components/LazyYouTube';
import { Link } from 'wouter';

// Import assets
import logoImage from '../assets/logo.png';
import backgroundMobileImage from '../assets/images/ruidcar-background-mobile.jpg';

export default function PremiumLanding() {
  const { t } = useTranslation();
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const isMobile = useIsMobile();

  // Effect para controlar carregamento do conteúdo
  useEffect(() => {
    // Display content immediately
    setIsContentLoaded(true);
  }, []);
  
  // A função de iniciar o vídeo manualmente foi removida
  // pois agora estamos usando YouTube para desktop e imagem para mobile

  // Staggered animation variants
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

  return (
    <div className="premium-container">
      {/* Video background para melhor compatibilidade com dispositivos móveis */}
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
          className="buttons-container"
          variants={itemVariants}
        >
          <motion.a 
            href="/home" 
            className="premium-button button-buy"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('premium.buy', 'Quero Investir')}
          </motion.a>
          
          <Link href="/mapa">
            <motion.button
              className="premium-button button-locate"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Localizar oficinas
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}