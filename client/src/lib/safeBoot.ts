
/**
 * Módulo de inicialização segura para ambiente de produção
 * Este módulo garante que o aplicativo nunca quebre devido a erros 
 * em componentes não essenciais como detecção de país
 */

import { BRAZIL_WHATSAPP, INTERNATIONAL_WHATSAPP } from './ipGeoLocation';
import { detectLocationSafe } from './safeGeoLocation';

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
 * Atualiza informações de contato de forma segura
 */
const updateContactInfoSafe = (isBrazil: boolean): void => {
  try {
    const contactInfo = isBrazil ? BRAZIL_WHATSAPP : INTERNATIONAL_WHATSAPP;
    console.log(`📱 Configurando contato para: ${isBrazil ? 'Brasil' : 'Internacional'}`, contactInfo);
    
    // Atualização segura do DOM
    setTimeout(() => {
      try {
        const wppLinks = document.querySelectorAll('a[href*="wa.me"], #wpp-link');
        const wppTexts = document.querySelectorAll('.wpp-text');
        const emailTabs = document.querySelectorAll('#email-tab');
        
        console.log(`Atualizando DOM com safeBoot...`);
        
        wppLinks.forEach(link => {
          link.setAttribute('href', contactInfo.link);
          if (link.textContent) {
            link.textContent = contactInfo.number;
          }
        });
        
        wppTexts.forEach(element => {
          element.innerHTML = `WhatsApp: <a href="${contactInfo.link}">${contactInfo.number}</a>`;
        });
        
        emailTabs.forEach(tab => {
          (tab as HTMLElement).style.display = contactInfo.displayEmail ? 'block' : 'none';
        });
        
      } catch (domError) {
        console.error('Erro ao atualizar DOM:', domError);
      }
    }, 100);
    
    // Executa novamente após um delay maior
    setTimeout(() => updateContactInfoSafe(isBrazil), 2000);
    
  } catch (error) {
    console.error('Erro ao atualizar informações de contato:', error);
  }
};

/**
 * Inicializa o sistema de boot seguro da aplicação
 * Alterna o WhatsApp e visibilidade de email com base na localização
 * Método extremamente seguro que nunca quebrará o aplicativo
 */
export const safeBootApplication = (): void => {
  try {
    console.log('🚀 Inicializando sistema de boot seguro...');
    
    // Verifica primeiro se estamos no modo de teste internacional
    if (isInternationalTestModeActive()) {
      console.log('🌎 Modo de teste internacional ativado via URL param no SafeBoot');
      
      // Configura como visitante internacional
      const isBrazil = false;
      console.log('Localização forçada para internacional via parâmetro URL');
      
      // Configurações de contato para internacional
      const contactInfo = INTERNATIONAL_WHATSAPP;
      
      // Função para atualização segura do DOM que será executada em múltiplos momentos
      const updateDOM = () => {
        try {
          console.log('Atualizando DOM com configuração internacional forçada...');
          
          // Atualizar links de WhatsApp
          const waLinks = document.querySelectorAll('a[href*="wa.me/"]');
          waLinks.forEach(link => {
            try {
              link.setAttribute('href', contactInfo.link);
            } catch (e) {
              // Ignora erros individuais
            }
          });
          
          // Atualizar textos de WhatsApp
          const wppTexts = document.querySelectorAll('.wpp-text');
          wppTexts.forEach(element => {
            try {
              element.innerHTML = `WhatsApp: <a id="wpp-link" href="${contactInfo.link}">${contactInfo.number}</a>`;
            } catch (e) {
              // Ignora erros individuais
            }
          });
          
          // Esconder ou mostrar emails baseado na localização
          const emailTabs = document.querySelectorAll('#email-tab');
          emailTabs.forEach(tab => {
            try {
              (tab as HTMLElement).style.display = isBrazil ? 'block' : 'none';
            } catch (e) {
              // Ignora erros individuais
            }
          });
        } catch (e) {
          console.error('Erro no safeBoot ao atualizar DOM:', e);
        }
      };
      
      // Executa atualizações em diferentes momentos
      updateDOM();
      setTimeout(updateDOM, 500);
      setTimeout(updateDOM, 1500);
      setTimeout(updateDOM, 3000);
      
      return;
    }
    
    // Tentar detectar país com método resiliente
    let isBrazil = true;
    try {
      const location = detectLocationSafe();
      isBrazil = location.isBrazil;
      console.log('Localização detectada (modo seguro):', location);
    } catch (err) {
      console.error('Erro na detecção de país, usando configuração padrão (Brasil):', err);
    }
    
    // Configurações de contato
    const contactInfo = isBrazil ? BRAZIL_WHATSAPP : INTERNATIONAL_WHATSAPP;
    
    // Função para atualização segura do DOM que será executada em múltiplos momentos
    const updateDOM = () => {
      try {
        console.log('Atualizando DOM com safeBoot...');
        
        // Atualizar links de WhatsApp
        const waLinks = document.querySelectorAll('a[href*="wa.me/"]');
        waLinks.forEach(link => {
          try {
            link.setAttribute('href', contactInfo.link);
          } catch (e) {
            // Ignora erros individuais
          }
        });
        
        // Atualizar textos de WhatsApp
        const wppTexts = document.querySelectorAll('.wpp-text');
        wppTexts.forEach(element => {
          try {
            element.innerHTML = `WhatsApp: <a id="wpp-link" href="${contactInfo.link}">${contactInfo.number}</a>`;
          } catch (e) {
            // Ignora erros individuais
          }
        });
        
        // Esconder ou mostrar emails baseado na localização
        const emailTabs = document.querySelectorAll('#email-tab');
        emailTabs.forEach(tab => {
          try {
            (tab as HTMLElement).style.display = isBrazil ? 'block' : 'none';
          } catch (e) {
            // Ignora erros individuais
          }
        });
      } catch (e) {
        console.error('Erro no safeBoot ao atualizar DOM:', e);
      }
    };
    
    // Configurar atualizações regulares para garantir que os elementos sejam atualizados
    // mesmo se carregados dinamicamente ou em momentos diferentes
    const setupIntervals = () => {
      // Atualização inicial
      updateDOM();
      
      // Mais atualizações em diferentes momentos para garantir que todos os elementos estejam prontos
      setTimeout(updateDOM, 500);
      setTimeout(updateDOM, 1500);
      setTimeout(updateDOM, 3000);
      
      // Para aplicações de página única (SPA), também atualiza quando a página muda
      if (typeof window !== 'undefined') {
        let lastUrl = window.location.href;
        
        setInterval(() => {
          // Verifica se a URL mudou (navegação de SPA)
          if (lastUrl !== window.location.href) {
            lastUrl = window.location.href;
            console.log('Detectada mudança de URL, atualizando DOM...');
            
            // Dá tempo para o DOM carregar depois da mudança de rota
            setTimeout(updateDOM, 200);
            setTimeout(updateDOM, 800);
          }
        }, 500);
      }
    };
    
    // Inicializa quando o DOM estiver pronto
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupIntervals);
      } else {
        setupIntervals();
      }
    }
    
    console.log('✅ Boot seguro concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral no safeBoot:', error);
    
    // Fallback seguro em caso de erro
    try {
      const { isBrazil } = detectLocationSafe();
      updateContactInfoSafe(isBrazil);
    } catch (fallbackError) {
      console.error('❌ Erro no fallback:', fallbackError);
      // Última tentativa: usar Brasil como padrão
      updateContactInfoSafe(true);
    }
  }
};
