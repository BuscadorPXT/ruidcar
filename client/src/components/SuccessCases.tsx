import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TrendingUp, User, Video, Play, Pause, Loader2, ArrowRight, Award } from "lucide-react";
import { Testimonial } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface TestimonialStat {
  label: string;
  value: string;
}

export default function SuccessCases() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [activeMedia, setActiveMedia] = useState<string | null>(null);

  // Buscar depoimentos do banco de dados
  const { data: testimonialsData, isLoading, error } = useQuery<{ testimonials: Testimonial[] }>({
    queryKey: ['/api/testimonials/featured'],
    retry: 1,
  });

  // Caso não tenha dados ainda, usar dados padrão
  const fallbackCases = [
    {
      id: 1,
      name: "Nelson da Box Express",
      location: "Manaus, AM",
      mediaType: "youtube",
      videoId: "OG1NmuPoxuc", // Vídeo shorts do Nelson da Box Express
      thumbnail: "https://i.ytimg.com/vi/OG1NmuPoxuc/maxresdefault.jpg",
      testimonial: "O RuidCar trouxe grande agilidade para nossa oficina. Conseguimos localizar problemas de ruídos com muito mais eficiência, economizando tempo e garantindo maior satisfação dos clientes.",
      statsJson: JSON.stringify([
        { label: "Diagnósticos mais rápidos", value: "85%" },
        { label: "Clientes satisfeitos", value: "9.5/10" }
      ])
    },
    {
      id: 2,
      name: "Maquinho JMX",
      location: "Rio de Janeiro, RJ",
      mediaType: "youtube",
      videoId: "rUZA3yT2occ", // Vídeo shorts do Marquinho da JMX
      thumbnail: "https://i.ytimg.com/vi/rUZA3yT2occ/maxresdefault.jpg",
      testimonial: "O equipamento RuidCar é revolucionário para nossa oficina. Conseguimos diagnosticar problemas complexos em minutos, o que antes levava horas de trabalho.",
      statsJson: JSON.stringify([
        { label: "Aumento de faturamento", value: "195%" },
        { label: "ROI alcançado em", value: "3 meses" }
      ])
    },
    {
      id: 3,
      name: "Juninho Concept",
      location: "São Paulo, SP",
      mediaType: "youtube",
      videoId: "nmJUZj85qAE", // Vídeo shorts do Juninho Concept
      thumbnail: "https://i.ytimg.com/vi/nmJUZj85qAE/maxresdefault.jpg",
      testimonial: "O RuidCar se tornou indispensável no nosso dia a dia. Nos permitiu criar um serviço exclusivo de diagnóstico que os clientes valorizam muito.",
      statsJson: JSON.stringify([
        { label: "Valor por diagnóstico", value: "R$ 800,00" },
        { label: "ROI alcançado em", value: "1 mês" }
      ])
    },
    {
      id: 4,
      name: "Erasmo - Especialista em Suspensão",
      location: "Belo Horizonte, MG",
      mediaType: "audio",
      mediaUrl: "/assets/depoismento-erasmo.mp3",
      testimonial: "O RuidCar mudou completamente nossa forma de trabalhar. Diagnósticos mais rápidos, precisos e com menos retrabalho. Nossa oficina virou referência na região.",
      statsJson: JSON.stringify([
        { label: "Diagnósticos mensais", value: "30+" },
        { label: "Faturamento adicional", value: "R$ 9.000,00/mês" }
      ])
    }
  ];

  // Determinar os depoimentos a serem exibidos
  const testimonials = testimonialsData?.testimonials || fallbackCases;

  const toggleMedia = (mediaUrl: string) => {
    if (activeMedia === mediaUrl) {
      setActiveMedia(null);
    } else {
      setActiveMedia(mediaUrl);
    }
  };

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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const renderTestimonialStats = (statsJson: string | null) => {
    if (!statsJson) return null;

    try {
      const stats = JSON.parse(statsJson) as TestimonialStat[];
      if (!Array.isArray(stats)) return null;

      return (
        <div className="mt-4 space-y-2">
          {stats.map((stat, statIndex) => (
            <div key={statIndex} className="flex items-center">
              <p className="text-sm font-medium text-secondary mr-2">{stat.label}:</p>
              <p className={`text-sm font-bold ${statIndex === 1 ? 'text-green-500' : 'text-primary'}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  return (
    <section id="success" className="py-16 bg-gradient-to-br from-muted to-background dark:from-slate-800 dark:to-slate-900" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title dark:text-white"></h2>
          <p className="section-subtitle dark:text-gray-300">
          </p>
        </motion.div>

        <div className="relative pb-12">
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary/20 dark:bg-primary/30"></div>

          <motion.div 
            className="relative mb-20"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Layout completamente novo para ROI */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-card dark:bg-slate-900">
                <div className="grid md:grid-cols-2 gap-0 items-stretch">
                  {/* Lado esquerdo - Imagem e destaques */}
                  <div className="bg-primary/5 dark:bg-primary/10 p-8 md:p-12 flex flex-col justify-center relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                    
                    <h3 className="text-3xl font-bold text-foreground mb-6 relative">
                      Retorno sobre Investimento
                      <span className="absolute -bottom-2 left-0 w-16 h-1 bg-primary"></span>
                    </h3>
                    
                    <p className="text-lg text-card-foreground mb-10 pr-4">
                      Nossas oficinas parceiras recuperam o investimento rapidamente e expandem seus negócios com um serviço exclusivo de diagnóstico de ruídos.
                    </p>
                    
                    <div className="mb-10">
                      <ul className="space-y-4">
                        <li className="flex items-start">
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                          <span className="ml-3 text-card-foreground">Diagnósticos que podem durar de <strong>5 a 30 minutos</strong> vs. 2+ horas no método tradicional. Obs: este é apenas um tempo estimado com base em atendimentos anteriores e pode variar conforme o caso.</span>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                          <span className="ml-3 text-card-foreground">Aumento médio de <strong>200%</strong> no faturamento de diagnósticos</span>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                          <span className="ml-3 text-card-foreground">Taxa de conversão de <strong>90%</strong> para serviços adicionais</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <Button 
                        size="lg" 
                        className="bg-primary hover:bg-primary/90 text-white"
                        asChild
                      >
                        <a href="#calculator">
                          Calcule seu Potencial de Retorno
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Lado direito - Destaque do ROI */}
                  <div className="bg-primary p-8 md:p-12 flex flex-col items-center justify-center text-white">
                    <h4 className="text-xl font-medium mb-6 text-white/90">
                      Nossos clientes recuperam o valor investido em:
                    </h4>
                    
                    <div className="text-center mb-10">
                      <div className="inline-block text-6xl md:text-7xl font-extrabold bg-clip-text">
                        <span className="drop-shadow-sm">3-6</span>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold uppercase mt-2">meses</div>
                    </div>
                    
                    <div className="w-full max-w-sm mx-auto bg-white/10 backdrop-blur rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-3">
                        <span className="text-white/90 font-medium">Valor médio por diagnóstico</span>
                        <span className="font-bold">R$ 350,00</span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-3">
                        <span className="text-white/90 font-medium">Diagnósticos mensais</span>
                        <span className="font-bold">20-30</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-white/90 font-medium">Faturamento adicional</span>
                        <span className="font-bold text-lg">R$ 7.000,00+</span>
                      </div>
                    </div>
                    
                    <div className="mt-10 text-center">
                      <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                        <TrendingUp className="h-4 w-4" />
                        <span>Baseado em dados reais de oficinas parceiras</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Estado de carregamento */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-secondary">Carregando depoimentos...</p>
            </div>
          )}

          {/* Testimonials */}
          {!isLoading && !error && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8"
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              {testimonials && testimonials.map((testimonial) => (
                <motion.div 
                  key={testimonial.id}
                  className="bg-card dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-border"
                  variants={itemVariants}
                >
                  <div className="flex items-center mb-4">
                    <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center mr-4">
                      {testimonial.mediaType === 'video' ? (
                        <Video className="h-6 w-6 text-primary" />
                      ) : testimonial.mediaType === 'audio' ? (
                        <Play className="h-6 w-6 text-primary" />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>

                  {testimonial.mediaType === 'youtube' && (testimonial as any).videoId && (
                    <div className="mb-4 relative rounded-lg overflow-hidden bg-muted dark:bg-slate-800 aspect-video cursor-pointer" 
                         onClick={() => toggleMedia((testimonial as any).videoId || '')}>
                      {activeMedia === (testimonial as any).videoId ? (
                        <div className="w-full h-full">
                          {(testimonial as any).videoId === "nmJUZj85qAE" ? (
                            // Formato especial para vídeos Shorts (formato vertical)
                            <div className="mx-auto" style={{maxWidth: "400px", height: "100%"}}>
                              <iframe 
                                width="100%" 
                                height="100%" 
                                src={`https://www.youtube.com/embed/${(testimonial as any).videoId}?autoplay=1&rel=0&controls=1`}
                                title={testimonial.name}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{aspectRatio: "9/16"}}
                              ></iframe>
                            </div>
                          ) : (
                            // Formato normal para vídeos comuns (16:9)
                            <iframe 
                              width="100%" 
                              height="100%" 
                              src={`https://www.youtube.com/embed/${(testimonial as any).videoId}?autoplay=1&rel=0`}
                              title={testimonial.name}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center">
                              <Play className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <img 
                            src={(testimonial as any).thumbnail || `https://i.ytimg.com/vi/${(testimonial as any).videoId}/hqdefault.jpg`}
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        </>
                      )}
                    </div>
                  )}

                  {testimonial.mediaType === 'audio' && testimonial.mediaUrl && (
                    <div className="mb-4 p-3 bg-muted dark:bg-slate-800 rounded-lg">
                      {activeMedia === testimonial.mediaUrl ? (
                        <audio 
                          src={testimonial.mediaUrl} 
                          className="w-full" 
                          controls 
                          autoPlay
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMedia(testimonial.mediaUrl || '');
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground">Ouvir depoimento em áudio</span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-muted-foreground italic">
                    "{testimonial.testimonial}"
                  </p>

                  {renderTestimonialStats(typeof testimonial.statsJson === 'string' ? testimonial.statsJson : null)}
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div 
            className="relative mt-20"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Layout completamente novo para Reconhecimentos */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-card dark:bg-slate-900">
                <div className="grid md:grid-cols-2 gap-0 items-stretch">
                  {/* Lado esquerdo - Banner com texto */}
                  <div className="bg-blue-600 dark:bg-blue-800 p-8 md:p-12 flex flex-col justify-center text-white relative">                    
                    <h3 className="text-3xl font-bold text-white mb-6 relative">
                      Reconhecimento & Homologações
                      <span className="absolute -bottom-2 left-0 w-16 h-1 bg-white"></span>
                    </h3>
                    
                    <p className="text-lg text-white/90 mb-10 max-w-lg">
                      O RuidCar é reconhecido e homologado por grandes montadoras e recebeu a aprovação dos principais influenciadores do setor automotivo.
                    </p>
                    
                    <div className="space-y-5 mb-8">
                      <div className="flex items-center">
                        <div className="bg-white/20 p-2 rounded-full mr-4">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">Homologado pela Volkswagen</h4>
                          <p className="text-white/80 text-sm">Aprovado pelos padrões de qualidade da montadora</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="bg-white/20 p-2 rounded-full mr-4">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">Endossado por Especialistas</h4>
                          <p className="text-white/80 text-sm">Influenciadores com milhões de seguidores recomendam</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="border-white border-2 bg-white/20 text-white font-medium hover:bg-white hover:text-blue-600 dark:hover:text-blue-800 group"
                        asChild
                      >
                        <a href="/home#contact">
                          <span>Fale com nossa equipe</span>
                          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Lado direito - Grid de parceiros */}
                  <div className="bg-muted dark:bg-slate-800 p-8 md:p-12">
                    <div className="text-center mb-8">
                      <h4 className="text-xl font-semibold text-foreground">Nossos Parceiros e Apoiadores</h4>
                      <p className="text-muted-foreground mt-2">Confiado por profissionais e empresas referência do setor</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div className="bg-card dark:bg-slate-900 p-5 rounded-lg shadow-sm flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-10">
                            <path fill="#37474F" d="M12 22v-9H9v9c0 1.7 1.3 3 3 3v5h3v-5C13.3 25 12 23.7 12 22zM39 22v-9h-3v9c0 1.7-1.3 3-3 3v5h3v-5C37.7 25 39 23.7 39 22z"/>
                            <path fill="#0D47A1" d="M39.7 4.7C38.6 6.8 35.1 8 31 8h-1v9h1c2.2 0 4.1-.2 5.7-.5C36.4 13.6 36 10.9 36 8c0-1.1.1-2.2.2-3.3C38.2 4.3 39.3 4.3 39.7 4.7zM8.3 4.7C9.4 6.8 12.9 8 17 8h1v9h-1c-2.2 0-4.1-.2-5.7-.5C11.6 13.6 12 10.9 12 8c0-1.1-.1-2.2-.2-3.3C9.8 4.3 8.7 4.3 8.3 4.7z"/>
                            <path fill="#01579B" d="M32.8 23.5c-3.2-1-6.8-1.5-10.8-1.5s-7.6.5-10.8 1.5c.2 3.3.9 6.4 1.9 9.1C16.4 34.3 19.9 36 24 36s7.6-1.7 10.9-3.4C35.9 29.9 36.6 26.8 32.8 23.5zM24 33.5c-2.3 0-4.2-1.5-4.2-3.4 0-1.9 1.9-3.4 4.2-3.4s4.2 1.5 4.2 3.4C28.2 32 26.3 33.5 24 33.5z"/>
                            <path fill="#0D47A1" d="M24 7C14.6 7 7 8.4 7 10v7c0 1.6 7.6 3 17 3s17-1.4 17-3v-7C41 8.4 33.4 7 24 7z"/>
                          </svg>
                        </div>
                        <h5 className="font-bold text-foreground">Volkswagen</h5>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium px-2 py-0.5 bg-blue-50 dark:bg-blue-950 rounded-full mt-1">
                          Homologado
                        </span>
                        <p className="text-muted-foreground text-sm mt-3">Equipamento aprovado pelos padrões de qualidade da montadora</p>
                      </div>
                      
                      <div className="bg-card dark:bg-slate-900 p-5 rounded-lg shadow-sm flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10" fill="#DD2C00">
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                          </svg>
                        </div>
                        <h5 className="font-bold text-foreground">High Torque</h5>
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium px-2 py-0.5 bg-red-50 dark:bg-red-950 rounded-full mt-1">
                          1.3M+ inscritos
                        </span>
                        <p className="text-muted-foreground text-sm mt-3">Canal de referência em mecânica automotiva com vídeos sobre o RuidCar</p>
                      </div>
                      
                      <div className="bg-card dark:bg-slate-900 p-5 rounded-lg shadow-sm flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-950 rounded-full flex items-center justify-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10" fill="#2E7D32">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                          </svg>
                        </div>
                        <h5 className="font-bold text-foreground">Tonimek</h5>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium px-2 py-0.5 bg-green-50 dark:bg-green-950 rounded-full mt-1">
                          650K+ inscritos
                        </span>
                        <p className="text-muted-foreground text-sm mt-3">Youtuber especialista e influenciador no setor automotivo</p>
                      </div>
                      
                      <div className="bg-card dark:bg-slate-900 p-5 rounded-lg shadow-sm flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950 rounded-full flex items-center justify-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10" fill="#6A1B9A">
                            <path d="M15.402 21v-6.966h2.333l.349-2.708h-2.682V9.598c0-.784.218-1.319 1.342-1.319h1.434V5.857a19.19 19.19 0 00-2.09-.107c-2.067 0-3.482 1.262-3.482 3.58v1.996h-2.338v2.708h2.338V21H4a1 1 0 01-1-1V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1h-4.598z"/>
                          </svg>
                        </div>
                        <h5 className="font-bold text-foreground">Auto Esporte</h5>
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium px-2 py-0.5 bg-purple-50 dark:bg-purple-950 rounded-full mt-1">
                          Mídia Especializada
                        </span>
                        <p className="text-muted-foreground text-sm mt-3">Renomada revista do setor automotivo com matéria sobre o RuidCar</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}