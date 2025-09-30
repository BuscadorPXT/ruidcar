import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Video, Volume2, Star, Quote } from "lucide-react";
import { CustomVideoPlayer } from './CustomVideoPlayer';

// Áudio local removido (arquivo não existe). Mantemos depoimento como citação.

// IDs de vídeos do YouTube para substituir os arquivos MP4
const nelsonVideoId = "OG1NmuPoxuc"; // Vídeo shorts do Nelson da Box Express
const juninhoVideoId = "nmJUZj85qAE"; // Vídeo shorts do Juninho Concept
const marquinhosVideoId = "rUZA3yT2occ"; // Vídeo shorts do Marquinho da JMX

// Interface para os depoimentos
interface TestimonialStat {
  label: string;
  value: string;
}

interface Testimonial {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  mediaType?: string;
  videoId?: string;
  media?: string;
  thumbnail?: string;
  quote: string;
  stats: TestimonialStat[];
}

export default function TestimonialsGallery() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [activeTab, setActiveTab] = useState("videos");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const testimonials = [
    {
      id: "nelson",
      type: "video",
      title: "Nelson da Box Express",
      subtitle: "Box Express - Manaus, AM",
      mediaType: "youtube",
      videoId: nelsonVideoId,
      thumbnail: `https://i.ytimg.com/vi/${nelsonVideoId}/maxresdefault.jpg`,
      quote: "O RuidCar trouxe grande agilidade para nossa oficina. Conseguimos localizar problemas de ruídos com muito mais eficiência, economizando tempo e garantindo maior satisfação dos clientes.",
      stats: [
        { label: "Diagnósticos mais rápidos", value: "85%" },
        { label: "Clientes satisfeitos", value: "9.5/10" }
      ]
    },
    {
      id: "juninho",
      type: "video",
      title: "Juninho Concept",
      subtitle: "Concept Suspensões - Osasco, SP",
      mediaType: "youtube",
      videoId: juninhoVideoId,
      thumbnail: `https://i.ytimg.com/vi/${juninhoVideoId}/maxresdefault.jpg`,
      quote: "O RuidCar é uma ferramenta indispensável para diagnósticos mais precisos em veículos. Mudou completamente nossa forma de trabalhar.",
      stats: [
        { label: "Aumento no faturamento", value: "180%" },
        { label: "Tempo para diagnóstico", value: "-70%" }
      ]
    },
    {
      id: "marquinhos",
      type: "video",
      title: "Marquinhos",
      subtitle: "Oficina JMX - Rio de Janeiro, RJ",
      mediaType: "youtube",
      videoId: marquinhosVideoId,
      thumbnail: `https://i.ytimg.com/vi/${marquinhosVideoId}/maxresdefault.jpg`,
      quote: "Com o RuidCar, conseguimos identificar problemas que antes levariam horas para diagnosticar. A precisão é impressionante.",
      stats: [
        { label: "Serviços mensais", value: "+25" },
        { label: "Retorno sobre investimento", value: "3 meses" }
      ]
    },
    {
      id: "erasmo",
      type: "quote",
      title: "Erasmo",
      subtitle: "Especialista em Suspensão - Belo Horizonte, MG",
      quote: "Trabalho há mais de 20 anos com suspensão e nunca vi um equipamento tão preciso quanto o RuidCar. É um divisor de águas.",
      stats: [
        { label: "Diagnósticos precisos", value: "95%" },
        { label: "Satisfação dos clientes", value: "9.8/10" }
      ]
    }
  ];

  const handleAudioToggle = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
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

  return (
    <section id="testimonials-gallery" className="py-16 bg-gradient-to-b from-gray-900 to-primary/80 text-white" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center mb-4">
            <Star className="h-6 w-6 text-yellow-400 mr-2" />
            <h2 className="text-3xl font-bold">Galeria de Depoimentos</h2>
            <Star className="h-6 w-6 text-yellow-400 ml-2" />
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Veja e ouça o que os profissionais têm a dizer sobre como o RuidCar transformou seus negócios
          </p>
        </motion.div>
        
        <Tabs defaultValue="videos" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-gray-800/50 border border-gray-700">
              <TabsTrigger value="videos" className="data-[state=active]:bg-primary">
                <Video className="h-4 w-4 mr-2" />
                Vídeos
              </TabsTrigger>
              <TabsTrigger value="audio" className="data-[state=active]:bg-primary">
                <Volume2 className="h-4 w-4 mr-2" />
                Áudio
              </TabsTrigger>
              <TabsTrigger value="quotes" className="data-[state=active]:bg-primary">
                <Quote className="h-4 w-4 mr-2" />
                Citações
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="videos" className="mt-4 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.filter(t => t.type === 'video').map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  className="bg-gray-800/40 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-gray-700"
                  variants={itemVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="aspect-video relative cursor-pointer group">
                        <img 
                          src={testimonial.thumbnail ?? `https://i.ytimg.com/vi/${testimonial.videoId}/hqdefault.jpg`} 
                          alt={testimonial.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
                          <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                          <h3 className="text-lg font-bold">{testimonial.title}</h3>
                          <p className="text-sm text-gray-300">{testimonial.subtitle}</p>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl bg-gray-900 border-gray-800">
                      <div className="aspect-video w-full">
                        {testimonial.videoId === "nmJUZj85qAE" ? (
                          // Especial para vídeo Shorts (formato vertical)
                          <div className="mx-auto" style={{maxWidth: "400px", height: "100%"}}>
                            <iframe 
                              width="100%" 
                              height="100%" 
                              src={`https://www.youtube.com/embed/${testimonial.videoId}?autoplay=1&rel=0&controls=1`}
                              title={testimonial.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              style={{aspectRatio: "9/16"}}
                            ></iframe>
                          </div>
                        ) : (
                          // CustomVideoPlayer para vídeos normais
                          <CustomVideoPlayer 
                            videoId={testimonial.videoId || "dQw4w9WgXcQ"} 
                            title={testimonial.title}
                            thumbnailUrl={testimonial.thumbnail || `https://i.ytimg.com/vi/${testimonial.videoId || "dQw4w9WgXcQ"}/maxresdefault.jpg`}
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-xl font-bold text-white">{testimonial.title}</h3>
                        <p className="text-gray-300 mb-4">{testimonial.subtitle}</p>
                        <p className="text-gray-200 italic">"{testimonial.quote}"</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <div className="p-4">
                    <p className="text-gray-300 italic mb-4">"{testimonial.quote}"</p>
                    <div className="flex flex-wrap gap-4">
                      {testimonial.stats.map((stat, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg px-3 py-2 text-center flex-1">
                          <p className="text-sm text-gray-400">{stat.label}</p>
                          <p className="text-lg font-bold text-primary">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="audio" className="focus-visible:outline-none">
            <motion.div
              className="bg-gray-800/40 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-gray-700 p-6 mx-auto max-w-2xl"
              variants={itemVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              {testimonials.filter(t => t.type === 'audio').map((testimonial) => (
                <div key={testimonial.id} className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/30 rounded-full p-4">
                      <Volume2 className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{testimonial.title}</h3>
                      <p className="text-gray-300">{testimonial.subtitle}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-200 italic text-lg">"{testimonial.quote}"</p>
                  
                  <div className="bg-gray-900/60 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Depoimento em áudio</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-gray-600 hover:bg-gray-700"
                        onClick={handleAudioToggle}
                      >
                        {isAudioPlaying ? "Pausar" : "Reproduzir"}
                      </Button>
                    </div>
                    
                    <audio 
                      ref={audioRef}
                      src={testimonial.media} 
                      className="w-full" 
                      controls
                      onPlay={() => setIsAudioPlaying(true)}
                      onPause={() => setIsAudioPlaying(false)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {testimonial.stats.map((stat, index) => (
                      <div key={index} className="bg-gray-800 rounded-lg px-3 py-3 text-center">
                        <p className="text-sm text-gray-400">{stat.label}</p>
                        <p className="text-lg font-bold text-primary">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="quotes" className="focus-visible:outline-none">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              {testimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  className="bg-gray-800/40 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-gray-700 p-6"
                  variants={itemVariants}
                >
                  <Quote className="h-8 w-8 text-primary/70 mb-4" />
                  <p className="text-gray-200 italic text-lg mb-6">"{testimonial.quote}"</p>
                  
                  <div className="flex items-center space-x-3 mt-auto">
                    <div className="bg-primary/20 rounded-full p-1.5">
                      {testimonial.type === 'video' ? (
                        <Video className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{testimonial.title}</h3>
                      <p className="text-sm text-gray-400">{testimonial.subtitle}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
        
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-gray-300 mb-6">
            Junte-se aos centenas de profissionais que transformaram seus negócios com o RuidCar
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-gray-100" asChild>
            <a href="/home#contact">
              Solicitar Demonstração
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}