import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Paintbrush, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import LazyImage from "@/components/LazyImage";

// Importação das imagens
import magentaImage from "@assets/colors/B54E00D8-D806-48A4-BB6A-4CB812AD5B5B.jpg";
import redImage1 from "@assets/colors/1.jpg";
import redImage2 from "@assets/colors/2.jpg";
import greyImage from "@assets/colors/2eec2a62-17d6-4bc3-a35b-ae9fcf9251a7.jpg";
import redImage3 from "@assets/colors/3.jpg";
import supportImage from "@assets/colors/support_stands.jpg";
import magentaImage2 from "@assets/colors/FEABDC31-14F6-4D7D-9493-BCCBB11882F6.jpg";
import blackRedImage from "@assets/colors/8062a636-0a9a-4483-b7b3-0b7483d2fe8d.jpg";
import orangeImage from "@assets/colors/930442FB-A0D2-4FF0-A6FC-53754CB3E1B5.jpg";

// Novas imagens
import orangeImage2 from "@assets/colors/continental_orange1.jpg";
import orangeImage3 from "@assets/colors/continental_orange2.jpg";
import whiteImage1 from "@assets/colors/white1.jpg";
import whiteImage2 from "@assets/colors/white2.jpg";
import blackAndWhiteImage1 from "@assets/colors/black_white1.jpg";
import blackAndWhiteImage2 from "@assets/colors/black_white2.jpg";
import magentaImage3 from "@assets/colors/magenta3.jpg";
import redImage4 from "@assets/colors/red4.jpg";
import redImage5 from "@assets/colors/red5.jpg";
import panelImage from "@assets/colors/control_panel.jpg";
import oscillatorsImage from "@assets/colors/oscillators.jpg";

interface ColorOption {
  name: string;
  color: string;
  examples: {
    src: string;
    alt: string;
  }[];
}

export default function CustomizationGallery() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [activeColor, setActiveColor] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const colorOptions: ColorOption[] = [
    {
      name: "Magenta",
      color: "#E0336F",
      examples: [
        { src: magentaImage, alt: "RuidCar na cor Magenta - Vista frontal" },
        { src: magentaImage2, alt: "RuidCar na cor Magenta - Vista lateral" },
        { src: magentaImage3, alt: "RuidCar na cor Magenta - Enviado para Rio Grande do Sul" }
      ]
    },
    {
      name: "Vermelho",
      color: "#E23535",
      examples: [
        { src: redImage1, alt: "RuidCar na cor Vermelho - Múltiplas unidades" },
        { src: redImage2, alt: "RuidCar na cor Vermelho - Vista frontal detalhada" },
        { src: redImage3, alt: "RuidCar na cor Vermelho - Vista em close" },
        { src: redImage4, alt: "RuidCar na cor Vermelho - Enviado para Belém/PA" },
        { src: redImage5, alt: "RuidCar na cor Vermelho - Modelo com degraus" }
      ]
    },
    {
      name: "Preto",
      color: "#121212",
      examples: [
        { src: blackRedImage, alt: "RuidCar na cor Preto com detalhes vermelhos" }
      ]
    },
    {
      name: "Laranja",
      color: "#F7941D",
      examples: [
        { src: orangeImage, alt: "RuidCar na cor Laranja - Vista padrão" },
        { src: orangeImage2, alt: "RuidCar na cor Laranja - Modelo Continental" },
        { src: orangeImage3, alt: "RuidCar na cor Laranja - Modelo Continental vista completa" }
      ]
    },
    {
      name: "Branco",
      color: "#FFFFFF",
      examples: [
        { src: whiteImage1, alt: "RuidCar na cor Branca - Vista painel" },
        { src: whiteImage2, alt: "RuidCar na cor Branca - Vista superior" },
        { src: blackAndWhiteImage1, alt: "RuidCar na cor Branca e Preta - Vista frontal" },
        { src: blackAndWhiteImage2, alt: "RuidCar na cor Branca e Preta - Vista completa" }
      ]
    },
    {
      name: "Cinza",
      color: "#5A5A5A",
      examples: [
        { src: greyImage, alt: "RuidCar na cor Cinza" }
      ]
    },
    {
      name: "Painéis",
      color: "#3E3E3E",
      examples: [
        { src: panelImage, alt: "Painel elétrico do RuidCar" },
        { src: oscillatorsImage, alt: "Sistema de osciladores do RuidCar" },
        { src: supportImage, alt: "Cavaletes de apoio do RuidCar" }
      ]
    }
  ];

  const nextImage = () => {
    const currentColorExamples = colorOptions[activeColor].examples;
    setActiveImage((prev) => (prev + 1) % currentColorExamples.length);
  };

  const prevImage = () => {
    const currentColorExamples = colorOptions[activeColor].examples;
    setActiveImage((prev) => (prev - 1 + currentColorExamples.length) % currentColorExamples.length);
  };

  const selectColor = (index: number) => {
    setActiveColor(index);
    setActiveImage(0); // Reset active image when changing color
  };
  
  const openGallery = () => {
    setIsGalleryOpen(true);
  };
  
  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  return (
    <section id="customization" className="py-16 bg-background" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">{t('customization.title', 'Personalização RuidCar')}</h2>
          <p className="section-subtitle">
            {t('customization.subtitle', 'Equipamentos personalizados para sua empresa em diversas cores')}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            className="md:col-span-2 bg-card rounded-xl overflow-hidden shadow-sm border border-border"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8 }}
          >
            {colorOptions[activeColor].examples.length > 0 && (
              <div className="relative pb-[75%]">
                <button 
                  onClick={openGallery}
                  className="absolute inset-0 w-full h-full group cursor-zoom-in"
                  aria-label={t('customization.open_gallery', 'Abrir galeria de imagens')}
                >
                  <LazyImage
                    src={colorOptions[activeColor].examples[activeImage].src}
                    alt={colorOptions[activeColor].examples[activeImage].alt}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white" />
                  </div>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white font-semibold text-lg flex items-center">
                    <Paintbrush className="h-5 w-5 mr-2" />
                    RuidCar - {colorOptions[activeColor].name}
                  </p>
                </div>
                
                {colorOptions[activeColor].examples.length > 1 && (
                  <>
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
                  </>
                )}
              </div>
            )}
          </motion.div>
          
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
              <h3 className="text-xl font-semibold text-card-foreground mb-4">
                {t('customization.options', 'Opções de cores')}
              </h3>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  {t('customization.description', 'O RuidCar pode ser personalizado na cor da sua empresa, criando identidade visual e tornando-o um diferencial em seu negócio.')}
                </p>
                
                <p className="text-muted-foreground text-sm mt-2">
                  {t('customization.continental', '* Modelos especiais como o "RuidCar Continental" estão disponíveis para parceiros selecionados.')}
                </p>
                
                <div className="flex flex-wrap gap-3 mt-4">
                  {colorOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => selectColor(index)}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 relative transition-all",
                        activeColor === index ? "border-primary scale-110" : "border-transparent scale-100 hover:scale-105"
                      )}
                      title={option.name}
                      style={{ backgroundColor: option.color }}
                    >
                      {activeColor === index && (
                        <span className="absolute inset-0 rounded-full border-2 border-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
              <h3 className="text-xl font-semibold text-card-foreground mb-4">
                {t('customization.benefits', 'Benefícios da personalização')}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="mr-3 mt-0.5 bg-primary/10 p-1.5 rounded-full">
                    <Paintbrush className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">
                    {t('customization.benefit1', 'Identidade visual alinhada com sua marca')}
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="mr-3 mt-0.5 bg-primary/10 p-1.5 rounded-full">
                    <Paintbrush className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">
                    {t('customization.benefit2', 'Destaque do equipamento em sua oficina')}
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="mr-3 mt-0.5 bg-primary/10 p-1.5 rounded-full">
                    <Paintbrush className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">
                    {t('customization.benefit3', 'Acabamento de alta qualidade e resistência')}
                  </span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Galeria de Imagens em Popup */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 bg-black border-gray-800 overflow-hidden">
          <div className="relative w-full h-full flex flex-col">
            {/* Imagem grande */}
            <div className="relative w-full flex-1 flex items-center justify-center bg-black overflow-hidden">
              <LazyImage
                src={colorOptions[activeColor].examples[activeImage].src}
                alt={colorOptions[activeColor].examples[activeImage].alt}
                className="max-w-full max-h-[85vh] object-contain"
              />
              
              {/* Botão fechar */}
              <Button 
                variant="outline" 
                size="icon" 
                onClick={closeGallery}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white border-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
              
              {/* Navegação */}
              {colorOptions[activeColor].examples.length > 1 && (
                <>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 text-white border-gray-700"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                  </div>
                  
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 text-white border-gray-700"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                </>
              )}
            </div>
            
            {/* Miniaturas e legenda */}
            <div className="p-4 bg-black text-white">
              <p className="text-white text-center mb-2">
                {colorOptions[activeColor].examples[activeImage].alt}
              </p>
              
              {colorOptions[activeColor].examples.length > 1 && (
                <div className="flex justify-center gap-2 mt-2 overflow-x-auto py-2">
                  {colorOptions[activeColor].examples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={cn(
                        "h-16 w-16 flex-shrink-0 rounded overflow-hidden border-2 transition-all",
                        activeImage === index ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <LazyImage
                        src={example.src}
                        alt={`Miniatura ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}