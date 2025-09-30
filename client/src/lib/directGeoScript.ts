/**
 * Uma implementação mais direta e literal do arquivo geo.js original
 * 
 * Este arquivo é uma versão adaptada do código geo.js fornecido,
 * respeitando exatamente a mesma lógica, estrutura e comportamento.
 */

import axios from 'axios';

/**
 * Função principal que verifica o país do usuário e atualiza os elementos DOM
 * Esta é uma implementação direta e literal do arquivo geo.js
 */
export const checkCountry = async (): Promise<void> => {
  try {
    // 1. Verifica se modo de teste internacional está ativado
    const testMode = new URLSearchParams(window.location.search).get('country');
    let country = 'BR'; // Padrão Brasil
    
    if (testMode === 'international' || testMode === 'int' || testMode === 'external') {
      console.log('🌎 Modo de teste via URL ativado - simulando país estrangeiro');
      country = 'US'; // Simula EUA para testes
    } else {
      // Tenta obter o país através da API ipinfo.io (exatamente como o geo.js)
      try {
        const response = await axios.get('https://ipinfo.io?token=9473f46e9baeed', {
          timeout: 5000
        });
        
        country = response.data.country;
        console.log('País detectado via ipinfo.io:', country);
      } catch (err) {
        console.error('Erro ao consultar ipinfo.io:', err);
        // Mantém país padrão Brasil em caso de erro
      }
    }
    
    // 2. Obtém os elementos DOM exatamente como no geo.js original
    const wppLink = document.getElementById('wpp-link');
    const whatsappText = document.querySelector('.wpp-text');
    const emailTab = document.getElementById('email-tab');
    
    console.log('Country:', country);
    
    // 3. Implementa exatamente a mesma lógica de troca com os mesmos valores do geo.js
    if (country !== 'BR') {
      console.log('Updating for non-Brazil visitors');
      
      if (wppLink) {
        wppLink.setAttribute('href', 'https://wa.me/5549988862954');
        wppLink.textContent = '+55 (49) 98886-2954';
      }
      
      if (whatsappText) {
        whatsappText.innerHTML = 'WhatsApp: <a id="wpp-link" href="https://wa.me/5549988862954">+55 (49) 98886-2954</a>';
      }
      
      if (emailTab) {
        emailTab.style.display = 'none';
      }
    } else {
      console.log('Updating for Brazil visitors');
      
      if (wppLink) {
        wppLink.setAttribute('href', 'https://wa.me/554999992055');
        wppLink.textContent = '(49) 9 9999-2055';
      }
      
      if (whatsappText) {
        whatsappText.innerHTML = 'WhatsApp: <a id="wpp-link" href="https://wa.me/554999992055">(49) 9 9999-2055</a>';
      }
      
      if (emailTab) {
        emailTab.style.display = 'block';
      }
    }
    
    // 4. Logs exatamente como no geo.js original
    console.log('wppLink:', wppLink);
    console.log('whatsappText:', whatsappText);
    console.log('emailTab:', emailTab);
    
  } catch (error) {
    console.error('Error fetching country information:', error);
  }
};

/**
 * Inicializa a detecção geográfica configurando múltiplas chamadas
 * para garantir que os elementos sejam atualizados mesmo após carregamentos dinâmicos
 */
export const initDirectGeoScript = (): void => {
  try {
    // Implementa o mesmo comportamento do evento load do geo.js
    // mas com múltiplas chamadas para garantir que funcione em todos os cenários
    
    // Executa imediatamente
    checkCountry();
    
    // Também executa após pequenos intervalos para garantir que os
    // elementos DOM estejam carregados e acessíveis
    setTimeout(checkCountry, 500);
    setTimeout(checkCountry, 1500);
    setTimeout(checkCountry, 3000);
    
    // Detecta mudanças de navegação e executa novamente
    if (typeof window !== 'undefined') {
      let lastUrl = window.location.href;
      
      setInterval(() => {
        if (lastUrl !== window.location.href) {
          lastUrl = window.location.href;
          
          setTimeout(checkCountry, 200);
          setTimeout(checkCountry, 800);
          setTimeout(checkCountry, 1600);
        }
      }, 1000);
    }
  } catch (error) {
    console.error('Error initializing direct geo script:', error);
  }
};