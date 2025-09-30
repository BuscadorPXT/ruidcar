/**
 * Componente de ajuda para testar o modo internacional
 * Permite alternar facilmente entre o modo Brasil e Internacional
 */

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { isInternationalTestModeActive } from '@/lib/geoDetection';

export default function GeoTestHelper() {
  const [isInternational, setIsInternational] = useState(false);
  
  // Detecta o modo atual ao carregar
  useEffect(() => {
    setIsInternational(isInternationalTestModeActive());
  }, []);
  
  // Alterna entre os modos Brasil e Internacional
  const toggleMode = () => {
    const newUrl = new URL(window.location.href);
    
    if (isInternational) {
      // Se já estiver no modo internacional, remove o parâmetro
      newUrl.searchParams.delete('country');
    } else {
      // Se estiver no modo Brasil, adiciona o parâmetro
      newUrl.searchParams.set('country', 'international');
    }
    
    // Navega para a nova URL
    window.location.href = newUrl.toString();
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={toggleMode}
        className={`text-xs p-2 ${isInternational ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isInternational ? '🇧🇷 Modo Brasil' : '🌎 Modo Internacional'}
      </Button>
    </div>
  );
}