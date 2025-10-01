import { useEffect, useCallback } from 'react';
import { advancedAnalytics } from '@/services/AdvancedAnalytics';

/**
 * Hook para facilitar o uso do sistema de analytics avançado
 */
export function useAnalytics() {
  useEffect(() => {
    // Analytics já é inicializado automaticamente no singleton
    return () => {
      // Cleanup será feito quando o componente principal for desmontado
    };
  }, []);

  /**
   * Rastrear conversão (ação do usuário)
   */
  const trackConversion = useCallback((
    type: 'call' | 'navigate' | 'whatsapp' | 'view_map',
    workshopId: string,
    source: 'search' | 'nearest_hero' | 'map' | 'proximity_notification',
    metadata?: any
  ) => {
    advancedAnalytics.trackConversion(type, workshopId, source, metadata);
  }, []);

  /**
   * Rastrear evento customizado
   */
  const trackEvent = useCallback((eventName: string, eventData: any) => {
    advancedAnalytics.trackEvent(eventName, eventData);
  }, []);

  /**
   * Configurar teste A/B
   */
  const setupABTest = useCallback((experimentId: string, variants: string[]) => {
    return advancedAnalytics.setupABTest(experimentId, variants);
  }, []);

  /**
   * Rastrear resultado de teste A/B
   */
  const trackABTestResult = useCallback((
    experimentId: string,
    outcome: 'conversion' | 'bounce' | 'custom',
    value?: any
  ) => {
    advancedAnalytics.trackABTestResult(experimentId, outcome, value);
  }, []);

  /**
   * Obter resumo da sessão atual
   */
  const getSessionSummary = useCallback(() => {
    return advancedAnalytics.getSessionSummary();
  }, []);

  return {
    trackConversion,
    trackEvent,
    setupABTest,
    trackABTestResult,
    getSessionSummary
  };
}