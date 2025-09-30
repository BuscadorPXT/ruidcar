import { useState, useEffect, useCallback } from 'react';

type ContrastMode = 'normal' | 'high' | 'extra-high';

interface HighContrastConfig {
  mode: ContrastMode;
  isEnabled: boolean;
  autoDetect: boolean;
}

/**
 * Hook para gerenciar modo alto contraste
 * Implementa WCAG 2.1 AA/AAA compliance para melhor acessibilidade
 */
export function useHighContrast() {
  const [config, setConfig] = useState<HighContrastConfig>({
    mode: 'normal',
    isEnabled: false,
    autoDetect: true
  });

  const STORAGE_KEY = 'ruidcar_high_contrast';

  /**
   * Detecta preferência de alto contraste do sistema
   */
  const detectSystemPreference = useCallback(() => {
    // Verifica media query para alto contraste
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersMoreContrast = window.matchMedia('(prefers-contrast: more)').matches;

    if (prefersMoreContrast) {
      return 'extra-high';
    } else if (prefersHighContrast) {
      return 'high';
    }
    return 'normal';
  }, []);

  /**
   * Aplica o tema de alto contraste
   */
  const applyContrastTheme = useCallback((mode: ContrastMode) => {
    const root = document.documentElement;

    // Remove classes anteriores
    root.classList.remove('high-contrast', 'extra-high-contrast');

    // Aplica nova classe baseada no modo
    if (mode === 'high') {
      root.classList.add('high-contrast');
    } else if (mode === 'extra-high') {
      root.classList.add('extra-high-contrast');
    }

    // Define CSS custom properties para alto contraste
    if (mode !== 'normal') {
      root.style.setProperty('--contrast-mode', mode);
    } else {
      root.style.removeProperty('--contrast-mode');
    }

    console.log(`🎨 Applied contrast mode: ${mode}`);
  }, []);

  /**
   * Alterna entre modos de contraste
   */
  const toggleContrast = useCallback(() => {
    const modes: ContrastMode[] = ['normal', 'high', 'extra-high'];
    const currentIndex = modes.indexOf(config.mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];

    const newConfig = {
      ...config,
      mode: nextMode,
      isEnabled: nextMode !== 'normal',
      autoDetect: false // Disable auto-detect when user manually changes
    };

    setConfig(newConfig);
    applyContrastTheme(nextMode);

    // Persist preference
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));

    return nextMode;
  }, [config, applyContrastTheme]);

  /**
   * Define modo específico de contraste
   */
  const setContrastMode = useCallback((mode: ContrastMode, savePreference = true) => {
    const newConfig = {
      ...config,
      mode,
      isEnabled: mode !== 'normal',
      autoDetect: !savePreference
    };

    setConfig(newConfig);
    applyContrastTheme(mode);

    if (savePreference) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    }
  }, [config, applyContrastTheme]);

  /**
   * Reseta para preferências do sistema
   */
  const resetToSystemPreference = useCallback(() => {
    const systemMode = detectSystemPreference();

    const newConfig: HighContrastConfig = {
      mode: systemMode,
      isEnabled: systemMode !== 'normal',
      autoDetect: true
    };

    setConfig(newConfig);
    applyContrastTheme(systemMode);

    // Remove stored preference to let system decide
    localStorage.removeItem(STORAGE_KEY);
  }, [detectSystemPreference, applyContrastTheme]);

  /**
   * Obtém configurações de estilo para o modo atual
   */
  const getContrastStyles = useCallback(() => {
    const baseStyles = {
      transition: 'all 0.2s ease-in-out'
    };

    switch (config.mode) {
      case 'high':
        return {
          ...baseStyles,
          '--bg-primary': '#ffffff',
          '--bg-secondary': '#f8f9fa',
          '--text-primary': '#000000',
          '--text-secondary': '#212529',
          '--border-color': '#000000',
          '--accent-color': '#0056b3',
          '--focus-color': '#ff6600',
          '--success-color': '#006600',
          '--error-color': '#cc0000',
          '--warning-color': '#996600'
        };

      case 'extra-high':
        return {
          ...baseStyles,
          '--bg-primary': '#000000',
          '--bg-secondary': '#1a1a1a',
          '--text-primary': '#ffffff',
          '--text-secondary': '#f0f0f0',
          '--border-color': '#ffffff',
          '--accent-color': '#00bfff',
          '--focus-color': '#ffff00',
          '--success-color': '#00ff00',
          '--error-color': '#ff0000',
          '--warning-color': '#ffaa00'
        };

      default:
        return baseStyles;
    }
  }, [config.mode]);

  /**
   * Verifica se elemento atende critérios de contraste
   */
  const checkContrastRatio = useCallback((foreground: string, background: string): number => {
    // Simplified contrast ratio calculation
    // In production, use a proper color contrast library
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 5) / (darker + 5);
  }, []);

  /**
   * Valida se configuração atual atende WCAG
   */
  const validateWCAGCompliance = useCallback(() => {
    const styles = getContrastStyles() as any;
    const textColor = styles['--text-primary'] || '#000000';
    const bgColor = styles['--bg-primary'] || '#ffffff';

    const ratio = checkContrastRatio(textColor, bgColor);

    return {
      ratio,
      aa: ratio >= 4.5, // WCAG AA normal text
      aaa: ratio >= 7.0, // WCAG AAA normal text
      aaLarge: ratio >= 3.0, // WCAG AA large text
      aaaLarge: ratio >= 4.5 // WCAG AAA large text
    };
  }, [getContrastStyles, checkContrastRatio]);

  // Initialize on mount
  useEffect(() => {
    try {
      // Load saved preference
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedConfig = JSON.parse(saved);
        setConfig(savedConfig);
        applyContrastTheme(savedConfig.mode);
        return;
      }
    } catch (error) {
      console.warn('Failed to load contrast preference:', error);
    }

    // Auto-detect system preference if no saved config
    const systemMode = detectSystemPreference();
    const initialConfig: HighContrastConfig = {
      mode: systemMode,
      isEnabled: systemMode !== 'normal',
      autoDetect: true
    };

    setConfig(initialConfig);
    applyContrastTheme(systemMode);
  }, [detectSystemPreference, applyContrastTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (!config.autoDetect) return;

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    const mediaQueryMore = window.matchMedia('(prefers-contrast: more)');

    const handleChange = () => {
      const systemMode = detectSystemPreference();
      setContrastMode(systemMode, false);
    };

    mediaQuery.addEventListener('change', handleChange);
    mediaQueryMore.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      mediaQueryMore.removeEventListener('change', handleChange);
    };
  }, [config.autoDetect, detectSystemPreference, setContrastMode]);

  return {
    // Current state
    mode: config.mode,
    isEnabled: config.isEnabled,
    isHighContrast: config.mode === 'high',
    isExtraHighContrast: config.mode === 'extra-high',
    autoDetect: config.autoDetect,

    // Actions
    toggleContrast,
    setContrastMode,
    resetToSystemPreference,

    // Utilities
    getContrastStyles,
    validateWCAGCompliance,
    checkContrastRatio,

    // System detection
    systemPreference: detectSystemPreference(),

    // CSS class helpers
    getContrastClass: () => {
      if (config.mode === 'high') return 'high-contrast';
      if (config.mode === 'extra-high') return 'extra-high-contrast';
      return '';
    }
  };
}

export default useHighContrast;