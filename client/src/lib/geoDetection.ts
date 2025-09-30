/**
 * Implementação exata da lógica do arquivo geo.js original
 * Para garantir o comportamento idêntico de detecção de localização e troca de contatos
 */

import axios from 'axios';

/**
 * Verifica se o modo de teste internacional está ativado via parâmetro na URL
 * Para teste: adicionar ?country=international (ou ?country=int) na URL
 */
export const isInternationalTestModeActive = (): boolean => {
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
 * Função que detecta o país e atualiza os elementos do DOM
 * Implementação melhorada com verificações mais robustas
 */
export const checkCountry = async (): Promise<void> => {
  try {
    // Simula país estrangeiro se o parâmetro URL estiver presente
    let country = null; // Começamos sem assumir país padrão

    if (isInternationalTestModeActive()) {
      console.log('🌎 Modo de teste internacional ativado - simulando país estrangeiro');
      country = 'US'; // Simula Estados Unidos
    } else {
      // Faz chamada real para a API de localização com prioridade máxima
      try {
        console.log('🔍 Iniciando detecção de país via IP...');
        const response = await axios.get('https://ipinfo.io?token=9473f46e9baeed', {
          timeout: 8000, // Aumentamos o timeout
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        if (response.data && response.data.country) {
          country = response.data.country;
          console.log('✅ País detectado com sucesso via IP:', country);
          console.log('📍 Dados completos do IP:', response.data);
        } else {
          console.warn('⚠️ Resposta da API não contém país:', response.data);
          country = 'BR'; // Fallback para Brasil apenas se a API não responder
        }
      } catch (err) {
        console.error('❌ Erro na detecção de país via API:', err);
        console.log('🔄 Tentando detectar por outros métodos...');

        // Fallback: tenta detectar por idioma apenas se a API falhar completamente
        const languages = navigator.languages || [navigator.language];
        const hasPortuguese = languages.some(lang => 
          lang && (lang.toLowerCase().startsWith('pt') || lang.toLowerCase().includes('br'))
        );

        if (!hasPortuguese) {
          console.log('🌍 Idioma não é português - assumindo internacional');
          country = 'US'; // Se não é português, provavelmente é internacional
        } else {
          country = 'BR'; // Se é português, assume Brasil
        }
      }
    }

    console.log('🏁 País final detectado:', country);

    // Função para atualizar elementos com tentativas múltiplas
    const updateElements = () => {
      // Busca todos os links de WhatsApp possíveis
      const wppLinks = document.querySelectorAll('#wpp-link, a[href*="wa.me"]');
      const whatsappTexts = document.querySelectorAll('.wpp-text');
      const emailTabs = document.querySelectorAll('#email-tab');

      console.log(`Encontrados: ${wppLinks.length} links WhatsApp, ${whatsappTexts.length} textos WhatsApp, ${emailTabs.length} abas email`);

      // Lógica para visitantes internacionais (fora do Brasil)
      if (country !== 'BR') {
        console.log('🌍 Configurando para visitantes INTERNACIONAIS');

        // Atualiza todos os links de WhatsApp
        wppLinks.forEach((link, index) => {
          try {
            link.setAttribute('href', 'https://wa.me/5549988862954');
            link.textContent = '+55 (49) 98886-2954';
            console.log(`Link WhatsApp ${index + 1} atualizado para internacional: +55 (49) 98886-2954`);
          } catch (err) {
            console.error(`Erro ao atualizar link WhatsApp ${index + 1}:`, err);
          }
        });

        // Atualiza textos de WhatsApp
        whatsappTexts.forEach((textElement, index) => {
          try {
            textElement.innerHTML = 'WhatsApp: <a id="wpp-link" href="https://wa.me/5549988862954">+55 (49) 98886-2954</a>';
            console.log(`Texto WhatsApp ${index + 1} atualizado para internacional: +55 (49) 98886-2954`);
          } catch (err) {
            console.error(`Erro ao atualizar texto WhatsApp ${index + 1}:`, err);
          }
        });

        // Oculta abas de email para visitantes internacionais
        emailTabs.forEach((tab, index) => {
          try {
            (tab as HTMLElement).style.display = 'none';
            console.log(`Aba de email ${index + 1} ocultada para visitante internacional`);
          } catch (err) {
            console.error(`Erro ao ocultar aba de email ${index + 1}:`, err);
          }
        });
      } else {
        console.log('🇧🇷 Configurando para visitantes do BRASIL');

        // Atualiza todos os links de WhatsApp
        wppLinks.forEach((link, index) => {
          try {
            link.setAttribute('href', 'https://wa.me/554999992055');
            link.textContent = '(49) 9 9999-2055';
            console.log(`Link WhatsApp ${index + 1} atualizado para Brasil`);
          } catch (err) {
            console.error(`Erro ao atualizar link WhatsApp ${index + 1}:`, err);
          }
        });

        // Atualiza textos de WhatsApp
        whatsappTexts.forEach((textElement, index) => {
          try {
            textElement.innerHTML = 'WhatsApp: <a id="wpp-link" href="https://wa.me/554999992055">(49) 9 9999-2055</a>';
            console.log(`Texto WhatsApp ${index + 1} atualizado para Brasil`);
          } catch (err) {
            console.error(`Erro ao atualizar texto WhatsApp ${index + 1}:`, err);
          }
        });

        // Mostra abas de email para visitantes do Brasil
        emailTabs.forEach((tab, index) => {
          try {
            (tab as HTMLElement).style.display = 'block';
            console.log(`Aba de email ${index + 1} exibida para visitante brasileiro`);
          } catch (err) {
            console.error(`Erro ao exibir aba de email ${index + 1}:`, err);
          }
        });
      }
    };

    // Executa a atualização imediatamente
    updateElements();

    // Executa novamente após um tempo para garantir que elementos carregados dinamicamente sejam atualizados
    setTimeout(updateElements, 1000);
    setTimeout(updateElements, 3000);

  } catch (error) {
    console.error('Erro na detecção de país:', error);
  }
};

/**
 * Inicializa o sistema de detecção geográfica
 * Executa e programa execuções adicionais para garantir que os elementos sejam atualizados
 */
export const initGeoDetection = (): void => {
  try {
    console.log('🚀 Iniciando sistema de detecção geográfica avançado');

    // Execução inicial
    checkCountry();

    // Execuções adicionais em diferentes momentos
    // para garantir que todos os elementos estejam carregados
    setTimeout(checkCountry, 500);
    setTimeout(checkCountry, 1500);
    setTimeout(checkCountry, 3000);
    setTimeout(checkCountry, 5000);

    // Observador de mutações para detectar quando novos elementos são adicionados ao DOM
    if (typeof window !== 'undefined' && 'MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;

        mutations.forEach((mutation) => {
          // Verifica se foram adicionados novos elementos relevantes
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;

                // Verifica se é um elemento relevante para WhatsApp ou email
                if (element.id === 'wpp-link' || 
                    element.id === 'email-tab' || 
                    element.classList.contains('wpp-text') ||
                    element.querySelector('#wpp-link, #email-tab, .wpp-text')) {
                  shouldUpdate = true;
                }
              }
            });
          }
        });

        if (shouldUpdate) {
          console.log('🔄 Novos elementos detectados, atualizando geolocalização');
          setTimeout(checkCountry, 100);
        }
      });

      // Observa mudanças em todo o documento
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Detecta mudanças de navegação e executa novamente
    if (typeof window !== 'undefined') {
      let lastUrl = window.location.href;

      setInterval(() => {
        if (lastUrl !== window.location.href) {
          lastUrl = window.location.href;
          console.log('🌐 Mudança de URL detectada, executando detecção de país novamente');

          // Executa após a navegação com atrasos diferentes
          setTimeout(checkCountry, 200);
          setTimeout(checkCountry, 800);
          setTimeout(checkCountry, 2000);
        }
      }, 500);
    }

    // Executa quando a página terminar de carregar completamente
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        setTimeout(checkCountry, 100);
      } else {
        window.addEventListener('load', () => {
          setTimeout(checkCountry, 100);
          setTimeout(checkCountry, 1000);
        });
      }
    }

  } catch (error) {
    console.error('Erro na inicialização da detecção geográfica:', error);
  }
};