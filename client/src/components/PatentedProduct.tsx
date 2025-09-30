import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Shield, Zap, MapPin } from "lucide-react";
import { Link } from "wouter";

// Importar a imagem do produto
import ruidcarImg from "@assets/ruidcar-white.jpg";

export default function PatentedProduct() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const features = [
    {
      icon: <Shield className="h-5 w-5 text-primary" />,
      title: "Tecnologia Patenteada",
      description: "O RuidCar possui tecnologia exclusiva e patenteada para diagnósticos mais precisos de ruídos em veículos."
    },
    {
      icon: <Zap className="h-5 w-5 text-primary" />,
      title: "Diagnóstico Rápido",
      description: "Identifique a origem exata de ruídos em minutos, aumentando a produtividade da sua oficina."
    },
    {
      icon: <MapPin className="h-5 w-5 text-primary" />,
      title: "Rede de Oficinas",
      description: "Faça parte da rede exclusiva de oficinas com acesso à tecnologia RuidCar."
    }
  ];

  return (
    <section id="patented" className="py-16 bg-background" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-4 px-4 py-1 text-lg font-bold text-primary border-primary border-2">
            <Award className="h-5 w-5 mr-2 text-primary" />
            TECNOLOGIA PATENTEADA
          </Badge>
          <h2 className="section-title">Equipamento Exclusivo para Diagnóstico</h2>
          <p className="section-subtitle">
            O RuidCar é o único equipamento no mercado com tecnologia patenteada para diagnósticos mais precisos de ruídos em veículos
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 rounded-2xl relative dark:border dark:border-border">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="font-bold">
                  PATENTEADO
                </Badge>
              </div>
              <img 
                src={ruidcarImg} 
                alt="RuidCar - Equipamento de diagnóstico patenteado" 
                className="w-full h-auto drop-shadow-xl" 
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  className="flex gap-4 items-start bg-card p-6 rounded-lg shadow-sm border border-border"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.4 + (index * 0.1) }}
                >
                  <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-card-foreground mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button size="lg" asChild>
                <a href="/home#contact">
                  Solicitar mais informações
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a 
                  href="https://localize.ruidcar.com.br/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center"
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Encontrar oficinas parceiras
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}