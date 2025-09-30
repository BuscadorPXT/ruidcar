import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { detectUserLocation } from '@/lib/locationDetector';

// Interface dos idiomas suportados
interface Language {
  code: string;
  name: string;
  flag: string;
  active: boolean;
}

// Função auxiliar para determinar o idioma baseado na localização
const determineLanguageFromNavigator = (): string => {
  // Usa nossa biblioteca especializada de detecção de localização
  const locationInfo = detectUserLocation();
  console.log('Detecção avançada de localização:', locationInfo);
  
  // Determina o idioma com base nas informações detectadas
  if (locationInfo.fromBrazil) {
    return 'pt-BR';
  } else if (locationInfo.fromSpanishSpeaking) {
    return 'es';
  } else {
    return 'en-US';
  }
};

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || determineLanguageFromNavigator());

  // Efeito para definir o idioma inicialmente baseado na localização
  useEffect(() => {
    // Verifica se o idioma está no localStorage (definido pelo usuário)
    const storedLang = localStorage.getItem('i18nextLng');
    
    if (storedLang) {
      console.log('Usando idioma do localStorage:', storedLang);
      i18n.changeLanguage(storedLang);
    } else if (!i18n.language) {
      // Se não tiver idioma ainda, determina baseado no navegador
      const detectedLanguage = determineLanguageFromNavigator();
      console.log('Definindo idioma baseado no navegador:', detectedLanguage);
      i18n.changeLanguage(detectedLanguage);
    }
    
    // Força o idioma a ser um dos suportados
    const currentLang = i18n.language || '';
    if (currentLang.startsWith('pt')) {
      setCurrentLanguage('pt-BR');
    } else if (currentLang.startsWith('es')) {
      setCurrentLanguage('es');
    } else {
      setCurrentLanguage('en-US');
    }
  }, [i18n]);
  
  // Atualiza o estado local quando o idioma do i18n mudar
  useEffect(() => {
    console.log('Idioma i18n alterado para:', i18n.language);
    
    const lang = i18n.language || '';
    // Normaliza o idioma para um dos três suportados
    if (lang.startsWith('pt')) {
      setCurrentLanguage('pt-BR');
    } else if (lang.startsWith('es')) {
      setCurrentLanguage('es');
    } else {
      setCurrentLanguage('en-US');
    }
  }, [i18n.language]);
  
  // Lista de idiomas suportados
  const languages: Language[] = [
    {
      code: 'pt-BR',
      name: 'Português',
      flag: '🇧🇷',
      active: currentLanguage === 'pt-BR',
    },
    {
      code: 'en-US',
      name: 'English',
      flag: '🇺🇸',
      active: currentLanguage === 'en-US',
    },
    {
      code: 'es',
      name: 'Español',
      flag: '🇪🇸',
      active: currentLanguage === 'es',
    },
  ];
  
  // Altera o idioma da aplicação
  const changeLanguage = (code: string) => {
    console.log('Alterando idioma para:', code);
    
    // Guarda o idioma no localStorage para persistir
    localStorage.setItem('i18nextLng', code);
    
    // Altera o idioma no i18n
    i18n.changeLanguage(code);
    
    // Força uma atualização da página se necessário
    setTimeout(() => {
      // Se o idioma atual não corresponder ao solicitado depois de 100ms,
      // podemos recarregar a página para garantir a alteração
      if (i18n.language !== code) {
        console.log('Recarregando a página para garantir a mudança de idioma');
        window.location.reload();
      }
    }, 100);
    
    setOpen(false);
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 px-0"
          aria-label="Alterar idioma"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className={`flex items-center gap-2 cursor-pointer ${
              language.active ? 'bg-primary/10 font-medium' : ''
            }`}
            onClick={() => changeLanguage(language.code)}
          >
            <span className="text-base">{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}