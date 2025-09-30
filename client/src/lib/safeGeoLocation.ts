/**
 * Uma versão mais segura da geolocalização para ambientes de produção
 * Evita erros críticos que podem quebrar o aplicativo
 */

/**
 * Verifica se o modo de teste internacional está ativado via parâmetro na URL
 * Para teste: adicionar ?country=international (ou ?country=int) na URL
 */
const isInternationalTestModeActive = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    
    const urlParams = new URLSearchParams(window.location.search);
    const countryParam = urlParams.get('country');
    
    return countryParam === 'international' || 
           countryParam === 'int' || 
           countryParam === 'external';
  } catch (error) {
    console.error('Erro ao verificar modo de teste internacional:', error);
    return false;
  }
};

/**
 * Uma função simplificada e segura que detecta a localização apenas pelo navegador
 * Não depende de chamadas de API externas que podem ser bloqueadas
 */
export const detectLocationSafe = (): { isBrazil: boolean } => {
  // Configuração padrão (Brasil)
  const defaultConfig = { isBrazil: true };
  
  try {
    // Verifica se modo de teste internacional está ativado
    if (isInternationalTestModeActive()) {
      console.log('🌎 Modo de teste internacional ativado via URL');
      return { isBrazil: false };
    }
    
    // Se não tivermos acesso ao navegador, retorna o padrão
    if (typeof window === 'undefined' || !window.navigator) {
      return defaultConfig;
    }
    
    // Verifica o idioma do navegador
    const languages = [
      navigator.language,
      ...(navigator.languages || [])
    ].map(lang => (lang || '').toLowerCase());
    
    // Se qualquer um dos idiomas for português ou contiver 'br', consideramos Brasil
    const isBrazil = languages.some(lang => 
      lang.startsWith('pt') || 
      lang.includes('br') || 
      lang === 'pt-br'
    );
    
    console.log('Detecção segura de localização:', { 
      languages,
      isBrazil 
    });
    
    return { isBrazil };
  } catch (error) {
    // Em caso de qualquer erro, retorna o padrão
    console.error('Erro na detecção segura de localização:', error);
    return defaultConfig;
  }
};

/**
 * Retorna os dados de contato seguros com base na localização
 */
export const getContactInfoSafe = (isBrazil: boolean) => {
  return isBrazil 
    ? {
        whatsapp: "(49) 9 9999-2055",
        whatsappLink: "https://wa.me/554999992055",
        email: "comercial@ruidcar.com.br",
        showEmail: true
      }
    : {
        whatsapp: "+55 49 8886-2954",
        whatsappLink: "https://wa.me/5549988862954",
        email: "vendas@ruidcar.com.br",
        showEmail: false
      };
};