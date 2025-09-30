/**
 * Biblioteca simplificada para detecção de localização do usuário
 * Usada como fallback quando outros métodos falham
 */

/**
 * Detecta a localização do usuário com base nas informações do navegador
 * @returns Informações sobre a localização detectada
 */
export const detectUserLocation = (): {
  fromBrazil: boolean;
  detectionMethod: string;
} => {
  try {
    if (typeof window === 'undefined' || !window.navigator) {
      return { fromBrazil: true, detectionMethod: 'default' };
    }

    // Detecção por idioma (mais confiável)
    const languages = [
      navigator.language,
      ...(navigator.languages || [])
    ].map(lang => (lang || '').toLowerCase());
    
    // Se qualquer um dos idiomas for português, provavelmente é Brasil
    const hasPT = languages.some(lang => 
      lang.startsWith('pt') || 
      lang.includes('br')
    );
    
    if (hasPT) {
      return { fromBrazil: true, detectionMethod: 'language' };
    }
    
    // Assume não-brasileiro se o idioma principal for espanhol, inglês ou outro
    const hasSpanishOrEnglish = languages.some(lang => 
      lang.startsWith('es') || 
      lang.startsWith('en')
    );
    
    if (hasSpanishOrEnglish) {
      return { fromBrazil: false, detectionMethod: 'language' };
    }
    
    // Padrão se não conseguir detectar com certeza
    return { fromBrazil: true, detectionMethod: 'default' };
  } catch (error) {
    console.error('Erro ao detectar localização:', error);
    return { fromBrazil: true, detectionMethod: 'error-fallback' };
  }
};

/**
 * Obtém informações de contato com base na localização detectada
 * @param isBrazil Se o usuário é do Brasil ou não
 * @returns Informações de contato apropriadas
 */
export const getContactInfoForLocation = (isBrazil: boolean) => {
  return isBrazil 
    ? {
        whatsapp: "(49) 9 9999-2055",
        whatsappLink: "https://wa.me/554999992055",
        email: "comercial@ruidcar.com.br",
        address: "Lebón Régis, SC - Brasil"
      }
    : {
        whatsapp: "+55 49 8886-2954",
        whatsappLink: "https://wa.me/5549988862954",
        email: "vendas@ruidcar.com.br",
        address: "Lebón Régis, SC - Brazil"
      };
};