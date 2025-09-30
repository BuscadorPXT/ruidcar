import { useState, useEffect, useCallback, useRef } from 'react';

export interface AnalyticsEvent {
  id: string;
  type: 'search' | 'map_interaction' | 'workshop_view' | 'performance' | 'navigation' | 'error';
  timestamp: number;
  data: Record<string, any>;
  sessionId: string;
  userId?: string;
}

interface SessionData {
  sessionId: string;
  startTime: number;
  pageViews: number;
  totalInteractions: number;
  searchCount: number;
  workshopViews: number;
  errors: number;
}

interface PerformanceMetrics {
  loadTime: number;
  searchResponseTime: number;
  mapRenderTime: number;
  cacheHitRate: number;
}

/**
 * Hook para analytics de comportamento do usuário
 * Coleta métricas de UX, performance e engajamento
 */
export function useUserAnalytics() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    searchResponseTime: 0,
    mapRenderTime: 0,
    cacheHitRate: 0
  });

  const sessionRef = useRef<string>('');
  const startTimeRef = useRef<number>(Date.now());
  const interactionCountRef = useRef<number>(0);

  // Configurações
  const MAX_EVENTS_STORED = 1000;
  const ANALYTICS_KEY = 'ruidcar_analytics';
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

  /**
   * Gera ID único para eventos
   */
  const generateEventId = useCallback(() => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Gera ID de sessão único
   */
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Inicializa sessão analytics
   */
  const initializeSession = useCallback(() => {
    const now = Date.now();
    const existingSession = localStorage.getItem('analytics_session');

    let sessionId: string;

    // Verificar se sessão existente ainda é válida
    if (existingSession) {
      const parsed = JSON.parse(existingSession);
      if (now - parsed.lastActivity < SESSION_TIMEOUT) {
        sessionId = parsed.sessionId;
      } else {
        sessionId = generateSessionId();
      }
    } else {
      sessionId = generateSessionId();
    }

    sessionRef.current = sessionId;

    // Salvar sessão atual
    localStorage.setItem('analytics_session', JSON.stringify({
      sessionId,
      lastActivity: now
    }));

    const session: SessionData = {
      sessionId,
      startTime: now,
      pageViews: 1,
      totalInteractions: 0,
      searchCount: 0,
      workshopViews: 0,
      errors: 0
    };

    setSessionData(session);
    console.log('📊 Analytics session initialized:', sessionId);
  }, [generateSessionId]);

  /**
   * Registra evento analytics
   */
  const trackEvent = useCallback((
    type: AnalyticsEvent['type'],
    data: Record<string, any> = {},
    persist = true
  ) => {
    const event: AnalyticsEvent = {
      id: generateEventId(),
      type,
      timestamp: Date.now(),
      data: {
        ...data,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown'
      },
      sessionId: sessionRef.current
    };

    setEvents(prev => {
      const newEvents = [event, ...prev];
      // Manter apenas os últimos eventos
      return newEvents.slice(0, MAX_EVENTS_STORED);
    });

    // Atualizar contador de interações
    interactionCountRef.current++;

    // Atualizar dados da sessão
    setSessionData(prev => prev ? {
      ...prev,
      totalInteractions: interactionCountRef.current,
      ...(type === 'search' && { searchCount: prev.searchCount + 1 }),
      ...(type === 'workshop_view' && { workshopViews: prev.workshopViews + 1 }),
      ...(type === 'error' && { errors: prev.errors + 1 })
    } : null);

    // Persistir se necessário
    if (persist) {
      try {
        const stored = localStorage.getItem(ANALYTICS_KEY);
        const existingEvents = stored ? JSON.parse(stored) : [];
        const allEvents = [event, ...existingEvents].slice(0, MAX_EVENTS_STORED);
        localStorage.setItem(ANALYTICS_KEY, JSON.stringify(allEvents));
      } catch (error) {
        console.warn('Failed to persist analytics event:', error);
      }
    }

    console.log(`📊 Tracked ${type}:`, data);
  }, [generateEventId]);

  /**
   * Eventos específicos para facilitar uso
   */
  const analytics = {
    // Buscas
    trackSearch: (query: string, filters: any, resultsCount: number, responseTime: number) => {
      trackEvent('search', {
        query,
        filters,
        resultsCount,
        responseTime,
        cacheUsed: responseTime < 100
      });

      setPerformanceMetrics(prev => ({
        ...prev,
        searchResponseTime: responseTime
      }));
    },

    // Interações com mapa
    trackMapInteraction: (interaction: 'zoom' | 'pan' | 'marker_click' | 'cluster_expand', data: any = {}) => {
      trackEvent('map_interaction', {
        interaction,
        ...data,
        timestamp: Date.now()
      });
    },

    // Visualizações de oficina
    trackWorkshopView: (workshopId: string, source: 'search' | 'map' | 'direct', workshopData: any = {}) => {
      trackEvent('workshop_view', {
        workshopId,
        source,
        name: workshopData.name,
        state: workshopData.state,
        city: workshopData.city
      });
    },

    // Performance
    trackPerformance: (metric: string, value: number, context: any = {}) => {
      trackEvent('performance', {
        metric,
        value,
        context
      });

      // Atualizar métricas de performance
      setPerformanceMetrics(prev => ({
        ...prev,
        [metric]: value
      }));
    },

    // Navegação
    trackNavigation: (from: string, to: string, method: 'click' | 'url' | 'back' = 'click') => {
      trackEvent('navigation', {
        from,
        to,
        method,
        duration: Date.now() - startTimeRef.current
      });
    },

    // Erros
    trackError: (error: string, context: any = {}) => {
      trackEvent('error', {
        error,
        context,
        stack: context.stack || 'No stack trace'
      });
    }
  };

  /**
   * Obtém estatísticas da sessão atual
   */
  const getSessionStats = useCallback(() => {
    const now = Date.now();
    const duration = sessionData ? now - sessionData.startTime : 0;

    return {
      ...sessionData,
      duration,
      eventsCount: events.length,
      avgInteractionTime: duration / Math.max(interactionCountRef.current, 1),
      performanceMetrics
    };
  }, [sessionData, events.length, performanceMetrics]);

  /**
   * Obtém insights de comportamento
   */
  const getBehaviorInsights = useCallback(() => {
    const searchEvents = events.filter(e => e.type === 'search');
    const mapEvents = events.filter(e => e.type === 'map_interaction');
    const workshopEvents = events.filter(e => e.type === 'workshop_view');

    // Análise de buscas populares
    const searchTerms = searchEvents.map(e => e.data.query.toLowerCase());
    const popularSearches = searchTerms.reduce((acc, term) => {
      acc[term] = (acc[term] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Análise de interações com mapa
    const mapInteractions = mapEvents.reduce((acc, event) => {
      const type = event.data.interaction;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Taxa de conversão (busca -> visualização)
    const conversionRate = searchEvents.length > 0
      ? (workshopEvents.length / searchEvents.length) * 100
      : 0;

    return {
      popularSearches: Object.entries(popularSearches)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10),
      mapInteractions,
      conversionRate,
      avgSearchResponseTime: searchEvents.length > 0
        ? searchEvents.reduce((sum, e) => sum + (e.data.responseTime || 0), 0) / searchEvents.length
        : 0,
      cacheUsageRate: searchEvents.filter(e => e.data.cacheUsed).length / Math.max(searchEvents.length, 1) * 100
    };
  }, [events]);

  /**
   * Exporta dados analytics para análise externa
   */
  const exportAnalytics = useCallback(() => {
    const analytics = {
      session: getSessionStats(),
      events: events,
      insights: getBehaviorInsights(),
      exportedAt: new Date().toISOString()
    };

    return analytics;
  }, [getSessionStats, events, getBehaviorInsights]);

  /**
   * Limpa dados analytics
   */
  const clearAnalytics = useCallback(() => {
    setEvents([]);
    localStorage.removeItem(ANALYTICS_KEY);
    localStorage.removeItem('analytics_session');
    console.log('🗑️ Analytics data cleared');
  }, []);

  // Inicializar sessão ao montar
  useEffect(() => {
    initializeSession();

    // Carregar eventos persistidos
    try {
      const stored = localStorage.getItem(ANALYTICS_KEY);
      if (stored) {
        const persistedEvents = JSON.parse(stored);
        setEvents(persistedEvents.slice(0, MAX_EVENTS_STORED));
      }
    } catch (error) {
      console.warn('Failed to load persisted analytics:', error);
    }

    // Tracking de performance inicial
    const loadTime = performance.now();
    analytics.trackPerformance('pageLoadTime', loadTime);

    // Listener para beforeunload para salvar dados finais
    const handleBeforeUnload = () => {
      const finalStats = getSessionStats();
      localStorage.setItem('last_session_stats', JSON.stringify(finalStats));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Auto-save periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (events.length > 0) {
        try {
          localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
        } catch (error) {
          console.warn('Failed to auto-save analytics:', error);
        }
      }
    }, 30000); // Salvar a cada 30 segundos

    return () => clearInterval(interval);
  }, [events]);

  return {
    // Dados
    events,
    sessionData,
    performanceMetrics,

    // Métodos de tracking
    ...analytics,

    // Análises
    getSessionStats,
    getBehaviorInsights,
    exportAnalytics,
    clearAnalytics,

    // Status
    isInitialized: !!sessionData,
    eventsCount: events.length
  };
}

export default useUserAnalytics;