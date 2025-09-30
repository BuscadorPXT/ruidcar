import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star, Award, Check } from "lucide-react";

export default function InfluencersSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const influencers = [
    {
      id: 1,
      name: "ADG da High Torque",
      image: "/adg%20high%20torque.png",
      role: "Especialista em Motores",
      followers: "380K+",
      description: "Referência em preparação de motores e diagnóstico avançado. Utiliza o RuidCar como diferencial competitivo em sua oficina desde o lançamento.",
      socialLink: "https://www.youtube.com/@CanalHighTorque",
      socialLabel: "Canal no YouTube"
    },
    {
      id: 2,
      name: "Guilherme da Tonimek",
      image: "/Guilherme%20da%20Tonimek.png",
      role: "Especialista em Lanternagem e Influenciador",
      followers: "450K+",
      description: "Especialista em lanternagem que identificou a necessidade de um equipamento como o RuidCar para solucionar problemas de ruídos automotivos com maior precisão. Um dos principais nomes do setor no Brasil, recomenda a tecnologia como essencial para oficinas modernas que buscam eficiência.",
      socialLink: "https://www.youtube.com/@tonimek",
      socialLabel: "Canal no YouTube"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section id="influencers" className="py-16 bg-gradient-to-br from-muted to-background dark:from-slate-800 dark:to-slate-900" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title dark:text-white">Reconhecido pelos Especialistas</h2>
          <p className="section-subtitle dark:text-gray-300">
            Os maiores influenciadores da mecânica no Brasil aprovam e utilizam o RuidCar
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <Badge variant="secondary" className="px-4 py-1 text-sm">
              <Award className="h-4 w-4 mr-1" />
              Tecnologia Premiada
            </Badge>
            <Badge variant="outline" className="px-4 py-1 text-sm font-bold text-primary border-primary dark:text-primary-foreground dark:border-primary/70">
              <Star className="h-4 w-4 mr-1 text-primary fill-primary dark:text-primary-foreground dark:fill-primary-foreground" />
              PATENTEADO
            </Badge>
          </div>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {influencers.map((influencer) => (
            <motion.div 
              key={influencer.id}
              className="bg-card dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-border flex flex-col md:flex-row"
              variants={itemVariants}
            >
              <div className="md:w-2/5 bg-gradient-to-br from-primary/10 to-secondary/5 dark:from-primary/5 dark:to-primary/10 p-6 flex items-center justify-center h-96 md:h-[28rem] lg:h-[32rem]">
                <motion.img
                  src={influencer.image}
                  alt={influencer.name}
                  className="max-h-full max-w-full w-auto object-contain object-center drop-shadow-lg"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="md:w-3/5 p-6">
                <h3 className="text-2xl font-bold text-foreground">{influencer.name}</h3>
                <p className="text-sm text-primary font-medium mb-1 dark:text-primary-foreground">{influencer.role}</p>
                <p className="text-sm text-muted-foreground mb-3">Seguidores: {influencer.followers}</p>
                
                <p className="text-card-foreground mb-6">{influencer.description}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">Utiliza o RuidCar em diagnósticos diários</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">Recomenda para profissionais e oficinas</p>
                  </div>
                </div>
                
                <Button size="sm" variant="outline" className="mt-4" asChild>
                  <a href={influencer.socialLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {influencer.socialLabel}
                  </a>
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}