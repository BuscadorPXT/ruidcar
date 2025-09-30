import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { 
  Award, 
  Globe, 
  MapPin, 
  Play, 
  Users, 
  Youtube,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomVideoPlayer } from './CustomVideoPlayer';

export default function MediaSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const countries = [
    "Brasil", 
    "EUA", 
    "México", 
    "Dubai", 
    "Qatar", 
    "Kuwait", 
    "Bolívia", 
    "Honduras", 
    "Costa Rica", 
    "Argentina", 
    "Paraguai"
  ];
  
  const videoRef = useRef<HTMLDivElement>(null);
  
  const toggleVideo = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  return (
    <section id="media" className="py-16 bg-gradient-to-br from-background to-muted dark:from-slate-900 dark:to-slate-800" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title dark:text-white">Reconhecimento & Presença Global</h2>
          <p className="section-subtitle dark:text-gray-300">
            Reconhecido por especialistas e presente em oficinas do mundo todo
          </p>
        </motion.div>
        
        {/* Media Appearances */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-card dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 flex flex-col justify-center">
                <div className="flex items-center mb-4">
                  <Youtube className="h-6 w-6 text-red-600 mr-2" />
                  <h3 className="text-xl font-bold text-foreground">Auto Esporte - Rede Globo</h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  O RuidCar foi destaque no programa Auto Esporte da Rede Globo, reconhecido como 
                  uma tecnologia inovadora para diagnóstico de problemas automotivos.
                </p>
                <div 
                  ref={videoRef}
                  className="relative rounded-lg overflow-hidden aspect-video bg-gray-100"
                >
                  {isVideoPlaying ? (
                    <div className="relative w-full h-full">
                      <div className="absolute top-3 right-3 z-10">
                        <button 
                          onClick={toggleVideo}
                          className="bg-gray-900/70 hover:bg-gray-900 text-white rounded-full p-1.5 transition-colors"
                          aria-label="Fechar vídeo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <CustomVideoPlayer 
                        videoId="XZgA3w3DVBQ"
                        title="RuidCar no Auto Esporte"
                        thumbnailUrl="https://i.ytimg.com/vi/XZgA3w3DVBQ/maxresdefault.jpg"
                        onClose={toggleVideo}
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full cursor-pointer"
                      onClick={toggleVideo}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center">
                          <Play className="h-8 w-8 text-white" fill="white" />
                        </div>
                      </div>
                      <img 
                        src="https://i.ytimg.com/vi/XZgA3w3DVBQ/maxresdefault.jpg" 
                        alt="RuidCar no Auto Esporte" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-muted dark:bg-slate-800 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Aparições na Mídia</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Award className="h-5 w-5 text-primary dark:text-primary-foreground mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">4 edições do Auto Esporte</p>
                      <p className="text-sm text-muted-foreground">
                        O RuidCar apareceu em 4 edições do programa Auto Esporte da Rede Globo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-primary dark:text-primary-foreground mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Recomendado por especialistas</p>
                      <p className="text-sm text-muted-foreground">
                        Influenciadores como Tonimek (650 mil inscritos) e High Torque (1,3 milhão de inscritos)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Globe className="h-5 w-5 text-primary dark:text-primary-foreground mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Presença internacional</p>
                      <p className="text-sm text-muted-foreground">
                        Em mais de 10 países ao redor do mundo, incluindo EUA e Oriente Médio
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Presente em:</h4>
                  <div className="flex flex-wrap gap-2">
                    {countries.map((country, index) => (
                      <div 
                        key={index} 
                        className="inline-flex items-center bg-card dark:bg-slate-900 rounded-full px-3 py-1 text-xs border border-border"
                      >
                        <MapPin className="h-3 w-3 text-primary dark:text-primary-foreground mr-1" />
                        <span className="text-foreground">{country}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Statistics */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-card dark:bg-slate-900 rounded-xl shadow-sm p-4 md:p-6 border border-border text-center">
            <p className="text-primary dark:text-primary-foreground font-bold text-3xl md:text-4xl">150k+</p>
            <p className="text-muted-foreground text-sm md:text-base">Seguidores</p>
          </div>
          <div className="bg-card dark:bg-slate-900 rounded-xl shadow-sm p-4 md:p-6 border border-border text-center">
            <p className="text-primary dark:text-primary-foreground font-bold text-3xl md:text-4xl">13M+</p>
            <p className="text-muted-foreground text-sm md:text-base">Visualizações mensais</p>
          </div>
          <div className="bg-card dark:bg-slate-900 rounded-xl shadow-sm p-4 md:p-6 border border-border text-center">
            <p className="text-primary dark:text-primary-foreground font-bold text-3xl md:text-4xl">200+</p>
            <p className="text-muted-foreground text-sm md:text-base">Oficinas no Brasil</p>
          </div>
          <div className="bg-card dark:bg-slate-900 rounded-xl shadow-sm p-4 md:p-6 border border-border text-center">
            <p className="text-primary dark:text-primary-foreground font-bold text-3xl md:text-4xl">10+</p>
            <p className="text-muted-foreground text-sm md:text-base">Países</p>
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button size="lg" variant="outline" asChild>
            <a href="https://www.youtube.com/watch?v=qD3gUg_AvMU" target="_blank" rel="noopener noreferrer">
              Ver mais demonstrações
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}