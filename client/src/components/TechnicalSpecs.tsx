import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Award 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TechnicalSpecs() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [activeImage, setActiveImage] = useState(0);
  
  const equipmentImages = [
    {
      src: "/assets/painel-eletrico.jpg",
      alt: "Painel elétrico do RuidCar",
      title: "Painel Elétrico"
    },
    {
      src: "/assets/osciladoras.jpg",
      alt: "Osciladoras do equipamento RuidCar",
      title: "Osciladoras"
    },
    {
      src: "/assets/cavaletes-de-apoio.jpg",
      alt: "Cavaletes de apoio do RuidCar",
      title: "Cavaletes de Apoio"
    }
  ];
  
  const componentsData = [
    {
      label: "Osciladoras",
      description: "Sistema patenteado para reprodução de vibrações veiculares com controle preciso de frequência",
      icon: <Zap className="h-5 w-5 text-primary" />
    },
    {
      label: "Cavaletes de Apoio",
      description: "Suporte para veículos de até 3.000 kg com estabilidade reforçada",
      icon: <ShieldCheck className="h-5 w-5 text-primary" />
    },
    {
      label: "Painel Elétrico",
      description: "Equipado com inversor de frequência integrado, ideal para ajuste fácil de velocidades",
      icon: <Award className="h-5 w-5 text-primary" />
    }
  ];
  
  const advantagesData = [
    "Diagnóstico mais rápido que pode durar de 5 a 30 minutos, dependendo do caso. Obs: este é apenas um tempo estimado com base em atendimentos anteriores e pode variar conforme o caso.",
    "Compatível com todos os modelos de veículos do mercado",
    "Diversas combinações para reproduzir até os barulhos mais difíceis de encontrar"
  ];

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % equipmentImages.length);
  };

  const prevImage = () => {
    setActiveImage((prev) => (prev - 1 + equipmentImages.length) % equipmentImages.length);
  };

  return (
    <section id="specifications" className="py-16 bg-background" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Equipamento RuidCar</h2>
          <p className="section-subtitle">
            Conheça os detalhes técnicos do equipamento que está revolucionando o diagnóstico automotivo.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div 
            className="bg-card rounded-xl overflow-hidden shadow-sm border border-border"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative pb-[75%]">
              <img 
                src={equipmentImages[activeImage].src}
                alt={equipmentImages[activeImage].alt}
                className="absolute inset-0 w-full h-full object-contain p-2"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white font-semibold text-lg">{equipmentImages[activeImage].title}</p>
              </div>
              
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-card/80 hover:bg-card dark:text-foreground"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-card/80 hover:bg-card dark:text-foreground"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Capacidade</p>
                  <p className="text-lg font-bold text-primary">3.000 kg</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Diagnóstico</p>
                  <p className="text-lg font-bold text-primary">5 a 30 min*</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Precisão</p>
                  <p className="text-lg font-bold text-primary">99%</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                * Este é apenas um tempo estimado com base em atendimentos anteriores e pode variar conforme o caso.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
              <h3 className="text-xl font-semibold text-card-foreground mb-4">Componentes Principais</h3>
              <ul className="space-y-4">
                {componentsData.map((component, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-0.5 bg-primary/10 p-1.5 rounded-full">
                      {component.icon}
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{component.label}</p>
                      <p className="text-muted-foreground text-sm">{component.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
              <h3 className="text-xl font-semibold text-card-foreground mb-4">Vantagens Exclusivas</h3>
              <ul className="space-y-3">
                {advantagesData.map((advantage, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-muted-foreground">
                      {advantage}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="text-center">
              <Button asChild>
                <a href="#contact">
                  Solicitar demonstração técnica
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
