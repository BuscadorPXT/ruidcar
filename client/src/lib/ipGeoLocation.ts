
/**
 * IP Geolocation Service - VERSÃO CORRIGIDA
 * Uses the ipinfo.io API to detect the user's country based on their IP address
 * Números corrigidos conforme especificação original
 */

import axios from 'axios';

interface IPInfoResponse {
  ip: string;
  city: string;
  region: string;
  country: string;
  loc: string;
  postal: string;
  timezone: string;
  org: string;
}

// ✅ NÚMEROS CORRETOS conforme especificação
export const BRAZIL_WHATSAPP = {
  number: "(49) 9 9999-2055",
  link: "https://wa.me/554999992055",
  displayEmail: true
};

export const INTERNATIONAL_WHATSAPP = {
  number: "+55 (49) 98886-2954", // ✅ Número correto para internacional
  link: "https://wa.me/5549988862954",
  displayEmail: false
};

/**
 * Verifica se o modo de teste internacional está ativado via parâmetro na URL
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
 * Detects the user's country based on their IP address using ipinfo.io
 * ✅ VERSÃO MELHORADA com melhor tratamento de erros
 */
export const detectCountryByIP = async (): Promise<string | null> => {
  try {
    // Verifica se o modo de teste internacional está ativado
    if (isInternationalTestModeActive()) {
      console.log("🌎 Modo de teste internacional ativado via URL param - simulando país: US");
      return "US";
    }
    
    console.log("🔍 Iniciando detecção de país via IP (ipinfo.io)...");
    
    const response = await axios.get<IPInfoResponse>('https://ipinfo.io?token=9473f46e9baeed', {
      timeout: 8000, // Timeout aumentado
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.data && response.data.country) {
      console.log("✅ País detectado com sucesso via ipinfo.io:", response.data.country);
      console.log("📍 Dados completos do IP:", response.data);
      return response.data.country;
    } else {
      console.warn("⚠️ País não detectado na resposta da API ipinfo.io", response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching country information from IP:', error);
    return null;
  }
};

/**
 * Gets the appropriate WhatsApp contact information based on country
 */
export const getWhatsAppInfoByCountry = (countryCode: string | null): typeof BRAZIL_WHATSAPP | typeof INTERNATIONAL_WHATSAPP => {
  // Se é Brasil ou não foi detectado, usa Brasil
  if (!countryCode || countryCode === 'BR') {
    console.log("🇧🇷 Configurando para visitantes do BRASIL");
    return BRAZIL_WHATSAPP;
  }
  
  // Caso contrário, usa internacional
  console.log("🌍 Configurando para visitantes INTERNACIONAIS");
  return INTERNATIONAL_WHATSAPP;
};

/**
 * ✅ FUNÇÃO MELHORADA para atualização do DOM
 * Updates DOM elements with the appropriate WhatsApp contact information
 */
export const updateContactDOM = (whatsappInfo: typeof BRAZIL_WHATSAPP | typeof INTERNATIONAL_WHATSAPP): void => {
  if (typeof document === 'undefined') return;

  try {
    console.log('🔄 Atualizando elementos DOM com informações de WhatsApp:', whatsappInfo);
    
    const updateWhatsAppElements = () => {
      let updated = false;
      
      // 1. Atualizar todos os links de WhatsApp
      const waLinks = document.querySelectorAll('a[href*="wa.me/"], #wpp-link');
      console.log(`📱 Encontrados ${waLinks.length} links de WhatsApp`);
      
      waLinks.forEach((link, index) => {
        try {
          link.setAttribute('href', whatsappInfo.link);
          if (link.textContent && link.textContent.includes('9')) {
            link.textContent = whatsappInfo.number;
            updated = true;
            console.log(`✅ Link WhatsApp ${index + 1} atualizado: ${whatsappInfo.number}`);
          }
        } catch (err) {
          console.error(`❌ Erro ao atualizar link WhatsApp ${index + 1}:`, err);
        }
      });
      
      // 2. Atualizar textos de WhatsApp
      const wppTexts = document.querySelectorAll('.wpp-text');
      console.log(`📝 Encontrados ${wppTexts.length} textos de WhatsApp`);
      
      wppTexts.forEach((element, index) => {
        try {
          element.innerHTML = `WhatsApp: <a id="wpp-link" href="${whatsappInfo.link}">${whatsappInfo.number}</a>`;
          updated = true;
          console.log(`✅ Texto WhatsApp ${index + 1} atualizado: ${whatsappInfo.number}`);
        } catch (err) {
          console.error(`❌ Erro ao atualizar texto WhatsApp ${index + 1}:`, err);
        }
      });
      
      // 3. Controlar visibilidade do email
      const emailTabs = document.querySelectorAll('#email-tab');
      console.log(`📧 Encontrados ${emailTabs.length} elementos de email`);
      
      emailTabs.forEach((tab, index) => {
        try {
          const display = whatsappInfo.displayEmail ? 'block' : 'none';
          (tab as HTMLElement).style.display = display;
          console.log(`✅ Email ${index + 1} ${whatsappInfo.displayEmail ? 'exibido' : 'ocultado'}`);
        } catch (err) {
          console.error(`❌ Erro ao atualizar visibilidade do email ${index + 1}:`, err);
        }
      });
      
      return updated;
    };
    
    // Executa a atualização imediatamente
    const updated = updateWhatsAppElements();
    
    if (updated) {
      console.log('✅ DOM atualizado com sucesso!');
    } else {
      console.log('⚠️ Nenhum elemento foi atualizado - elementos podem não estar prontos ainda');
    }
    
  } catch (error) {
    console.error('❌ Erro geral ao atualizar DOM com informações de contato:', error);
  }
};

/**
 * ✅ SISTEMA PRINCIPAL MELHORADO
 * Initializes IP-based geolocation detection and updates WhatsApp contact information
 */
export const initIPGeoLocation = async (retryCount = 0): Promise<void> => {
  try {
    console.log(`🚀 Iniciando detecção de geolocalização (tentativa ${retryCount + 1})`);
    
    // Detecta o país por IP
    const countryCode = await detectCountryByIP();
    console.log('🌍 Country detected by IP:', countryCode);
    
    // Pega as informações de WhatsApp baseadas no país
    const whatsappInfo = getWhatsAppInfoByCountry(countryCode);
    
    // Atualiza o DOM múltiplas vezes para garantir que capture elementos carregados dinamicamente
    const performUpdates = () => {
      updateContactDOM(whatsappInfo);
      
      // Agenda próximas atualizações
      setTimeout(() => updateContactDOM(whatsappInfo), 1000);
      setTimeout(() => updateContactDOM(whatsappInfo), 3000);
      setTimeout(() => updateContactDOM(whatsappInfo), 5000);
    };
    
    // Executa atualizações imediatamente
    performUpdates();
    
    // Observa mudanças no DOM para atualizar elementos adicionados dinamicamente
    if (typeof window !== 'undefined' && 'MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.id === 'wpp-link' || 
                    element.classList.contains('wpp-text') ||
                    element.id === 'email-tab' ||
                    element.querySelector('#wpp-link, .wpp-text, #email-tab')) {
                  shouldUpdate = true;
                }
              }
            });
          }
        });
        
        if (shouldUpdate) {
          console.log('🔄 Novos elementos detectados no DOM, atualizando...');
          setTimeout(() => updateContactDOM(whatsappInfo), 100);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    
    console.log('✅ Sistema de geolocalização inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Error initializing IP geolocation:', error);
    
    // Retry logic
    if (retryCount < 2) {
      console.log(`🔄 Tentando novamente geolocalização (${retryCount + 1}/2) em 2 segundos...`);
      setTimeout(() => {
        initIPGeoLocation(retryCount + 1);
      }, 2000);
    } else {
      console.warn('⚠️ Falha na detecção de país após múltiplas tentativas, usando configuração padrão para Brasil');
      updateContactDOM(BRAZIL_WHATSAPP);
    }
  }
};
