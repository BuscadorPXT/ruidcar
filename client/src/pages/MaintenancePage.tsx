
import { motion } from "framer-motion";
import { Wrench, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import logoImage from "@assets/logo.png";

export default function MaintenancePage() {
  // Timer de 12 horas (43200 segundos)
  const [timeLeft, setTimeLeft] = useState(12 * 60 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  const handleWhatsAppContact = () => {
    const phoneNumber = "+5549988862954";
    const message = "Olá! Gostaria de mais informações sobre o RuidCar.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="mb-6"
        >
          <img 
            src={logoImage} 
            alt="RuidCar" 
            className="h-16 mx-auto mb-4"
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mb-6"
        >
          <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Wrench className="h-10 w-10 text-orange-600" />
          </div>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Site em Manutenção
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-gray-600 mb-6 leading-relaxed"
        >
          Estamos trabalhando para melhorar sua experiência. 
          O site estará disponível em breve.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200"
        >
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <p className="text-sm font-medium text-blue-700">
              Tempo estimado para retorno:
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-900 font-mono">
            {formatTime(timeLeft)}
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-gray-50 rounded-lg p-4 mb-6"
        >
          <p className="text-sm text-gray-700 mb-2">
            Para dúvidas, entre em contato:
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
        >
          <Button 
            onClick={handleWhatsAppContact}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors duration-200"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Falar no WhatsApp
          </Button>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-6 pt-4 border-t border-gray-200"
        >
          <p className="text-xs text-gray-500">
            RuidCar - Tecnologia em Diagnóstico Automotivo
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
