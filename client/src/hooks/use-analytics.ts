import { useEffect, useCallback, useRef } from 'react';
import { advancedAnalytics } from '@/services/AdvancedAnalytics';

/**
 * Hook para facilitar o uso do sistema de analytics avançado
 */
export function useAnalytics() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Analytics já é inicializado automaticamente no singleton
    return () => {
      isMountedRef.current = false;
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
    if (!isMountedRef.current) return;

    try {
      advancedAnalytics.trackConversion(type, workshopId, source, metadata);
    } catch (error) {
      console.warn('Failed to track conversion in useAnalytics:', error);
    }
  }, []);

  /**
   * Rastrear evento customizado
   */
  const trackEvent = useCallback((eventName: string, eventData: any) => {
    if (!isMountedRef.current) return;

    try {
      advancedAnalytics.trackEvent(eventName, eventData);
    } catch (error) {
      console.warn('Failed to track event in useAnalytics:', error);
    }
  }, []);

  /**
   * Configurar teste A/B
   */
  const setupABTest = useCallback((experimentId: string, variants: string[]) => {
    if (!isMountedRef.current) return null;

    try {
      return advancedAnalytics.setupABTest(experimentId, variants);
    } catch (error) {
      console.warn('Failed to setup A/B test in useAnalytics:', error);
      return null;
    }
  }, []);

  /**
   * Rastrear resultado de teste A/B
   */
  const trackABTestResult = useCallback((
    experimentId: string,
    outcome: 'conversion' | 'bounce' | 'custom',
    value?: any
  ) => {
    if (!isMountedRef.current) return;

    try {
      advancedAnalytics.trackABTestResult(experimentId, outcome, value);
    } catch (error) {
      console.warn('Failed to track A/B test result in useAnalytics:', error);
    }
  }, []);

  /**
   * Obter resumo da sessão atual
   */
  const getSessionSummary = useCallback(() => {
    if (!isMountedRef.current) return null;

    try {
      return advancedAnalytics.getSessionSummary();
    } catch (error) {
      console.warn('Failed to get session summary in useAnalytics:', error);
      return null;
    }
  }, []);

  return {
    trackConversion,
    trackEvent,
    setupABTest,
    trackABTestResult,
    getSessionSummary
  };
}