import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin, Globe, ArrowRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { detectLocationSafe, getContactInfoSafe } from "@/lib/safeGeoLocation";

export default function Footer() {
  const [isBrazil, setIsBrazil] = useState(true);
  const [langSelection, setLangSelection] = useState<'pt' | 'en'>('pt');

  // Detecção de localização simplificada e segura para produção
  useEffect(() => {
    try {
      // Usa a versão segura da detecção de localização
      const { isBrazil: fromBrazil } = detectLocationSafe();
      // Atualiza o estado com base na detecção
      setIsBrazil(fromBrazil);
      setLangSelection(fromBrazil ? 'pt' : 'en');
    } catch (error) {
      // Fallback para Brasil em caso de erro
      console.error('Erro ao detectar localização no Footer:', error);
      setIsBrazil(true);
      setLangSelection('pt');
    }
  }, []);

  // Informações de contato seguras
  const safeContactInfo = getContactInfoSafe(isBrazil);
  
  // Dados de contato com base na localização
  const contactInfo = {
    brazil: {
      whatsapp: "(49) 9 9999-2055",
      whatsappLink: "https://wa.me/554999992055",
      email: "comercial@ruidcar.com.br",
      address: "Lebón Régis, SC - Brasil"
    },
    international: {
      whatsapp: "+55 49 8886-2954",
      whatsappLink: "https://wa.me/5549988862954",
      email: "vendas@ruidcar.com.br",
      address: "Lebón Régis, SC - Brazil"
    }
  };

  // Configurar informações com base na localização
  const info = isBrazil ? contactInfo.brazil : contactInfo.international;
  
  // Alternar idioma/localização manualmente
  const toggleLocation = () => {
    setIsBrazil(!isBrazil);
    setLangSelection(!isBrazil ? 'pt' : 'en');
  };

  return (
    <footer className="bg-muted text-accent-foreground">
      {/* Rastro de gradiente na parte superior */}
      <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-3xl font-bold text-foreground">Ruid<span className="text-primary">Car</span></span>
                <Badge variant="outline" className="ml-3 border-primary/50 text-primary/90 text-xs px-2">
                  <Award className="h-3 w-3 mr-1" />
                  PATENTEADO
                </Badge>
              </div>
              <p className="text-muted-foreground mb-6 text-lg max-w-md">
                Tecnologia inovadora para diagnósticos mais precisos de ruídos automotivos, transformando o seu negócio.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                {langSelection === 'pt' ? 'Fale Conosco' : 'Contact Us'}
              </h3>
              
              <div className="space-y-3">
                <a 
                  href={info.whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-muted-foreground hover:text-primary transition-colors group"
                >
                  <div className="bg-primary/10 rounded-full p-2 mr-3 group-hover:bg-primary/20 transition-colors">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <span className="wpp-text">WhatsApp: <a id="wpp-link" href={info.whatsappLink} target="_blank" rel="noopener noreferrer">{info.whatsapp}</a></span>
                </a>
                
                <a 
                  id="email-tab" 
                  href={`mailto:${info.email}`} 
                  className="flex items-center text-muted-foreground hover:text-primary transition-colors group"
                >
                  <div className="bg-primary/10 rounded-full p-2 mr-3 group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <span>E-mail: {info.email}</span>
                </a>
                
                <div className="flex items-center text-muted-foreground">
                  <div className="bg-primary/10 rounded-full p-2 mr-3">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <span>{info.address}</span>
                </div>
              </div>
            </div>
            
            
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-5">
              {langSelection === 'pt' ? 'Produto' : 'Product'}
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#patented" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <ArrowRight className="h-3 w-3 mr-2 text-primary" />
                  RuidCar
                </a>
              </li>
              <li>
                <a href="#specifications" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <ArrowRight className="h-3 w-3 mr-2 text-primary" />
                  {langSelection === 'pt' ? 'Especificações' : 'Specifications'}
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <ArrowRight className="h-3 w-3 mr-2 text-primary" />
                  {langSelection === 'pt' ? 'Treinamento' : 'Training'}
                </a>
              </li>
              <li>
                <Link href="/mapa">
                  <a className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <ArrowRight className="h-3 w-3 mr-2 text-primary" />
                    {langSelection === 'pt' ? 'Mapa Interativo' : 'Interactive Map'}
                  </a>
                </Link>
              </li>
            </ul>
            
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mt-8 mb-5">
              {langSelection === 'pt' ? 'Redes Sociais' : 'Social Media'}
            </h3>
            <div className="flex space-x-3">
              <a href="#" className="bg-accent hover:bg-accent/80 p-2 rounded-full transition-colors">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5 text-accent-foreground/80" />
              </a>
              <a href="#" className="bg-accent hover:bg-accent/80 p-2 rounded-full transition-colors">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5 text-accent-foreground/80" />
              </a>
              <a href="#" className="bg-accent hover:bg-accent/80 p-2 rounded-full transition-colors">
                <span className="sr-only">YouTube</span>
                <Youtube className="h-5 w-5 text-accent-foreground/80" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-5">
              {langSelection === 'pt' ? 'Empresa' : 'Company'}
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <ArrowRight className="h-3 w-3 mr-2 text-primary" />
                  {langSelection === 'pt' ? 'Sobre nós' : 'About us'}
                </a>
              </li>
              <li>
                <a href="#influencers" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <ArrowRight className="h-3 w-3 mr-2 text-primary" />
                  {langSelection === 'pt' ? 'Influenciadores' : 'Influencers'}
                </a>
              </li>
              <li>
                <a href="#testimonials-gallery" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <ArrowRight className="h-3 w-3 mr-2 text-primary" />
                  {langSelection === 'pt' ? 'Depoimentos' : 'Testimonials'}
                </a>
              </li>
              <li>
                <a href="#success" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <ArrowRight className="h-3 w-3 mr-2 text-primary" />
                  {langSelection === 'pt' ? 'Casos de sucesso' : 'Success cases'}
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <ArrowRight className="h-3 w-3 mr-2 text-primary" />
                  {langSelection === 'pt' ? 'Contato' : 'Contact'}
                </a>
              </li>
            </ul>
            
            <div className="mt-10 bg-card/30 p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                {langSelection === 'pt' 
                  ? 'Quer se tornar um revendedor RuidCar?' 
                  : 'Want to become a RuidCar reseller?'}
              </p>
              <Button size="sm" className="mt-3 w-full" asChild>
                <a href="/home#contact">
                  {langSelection === 'pt' ? 'Entre em contato' : 'Contact us'}
                </a>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-16 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-base text-muted-foreground">
            &copy; {new Date().getFullYear()} RuidCar. {langSelection === 'pt' ? 'Todos os direitos reservados.' : 'All rights reserved.'}
          </p>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-4 md:gap-6 justify-center">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              {langSelection === 'pt' ? 'Política de privacidade' : 'Privacy policy'}
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              {langSelection === 'pt' ? 'Termos de uso' : 'Terms of use'}
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              {langSelection === 'pt' ? 'Garantia' : 'Warranty'}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
