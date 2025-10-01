interface PerformanceMetrics {
  ttfmp: number; // Time to First Meaningful Paint
  loadTime: number;
  interactionTime: number;
  cacheHitRate: number;
}

interface ConversionEvent {
  type: 'call' | 'navigate' | 'whatsapp' | 'view_map';
  workshopId: string;
  source: 'search' | 'nearest_hero' | 'map' | 'proximity_notification';
  timestamp: number;
  sessionId: string;
}

interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  pageViews: string[];
  events: any[];
  userAgent: string;
  referrer: string;
  isMobile: boolean;
  hasGeolocation: boolean;
  isReturningUser: boolean;
}

interface ABTestVariant {
  experimentId: string;
  variantId: string;
  startTime: number;
}

interface AdvancedAnalyticsConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of users to track
  debug: boolean;
  apiEndpoint?: string;
}

/**
 * Sistema de analytics avançado para métricas de UX mobile
 *
 * Coleta e analisa:
 * - Performance metrics (TTFMP, load times)
 * - Conversion events (calls, navigation, views)
 * - Session behavior
 * - A/B testing results
 * - PWA install metrics
 */
export class AdvancedAnalytics {
  private config: AdvancedAnalyticsConfig;
  private sessionData: SessionData;
  private currentABTests: Map<string, ABTestVariant> = new Map();
  private performanceObserver?: PerformanceObserver;
  private sessionStartTime: number = Date.now();
  private lastActivityTime: number = Date.now();
  private isTracking: boolean = false;

  private readonly STORAGE_KEY = 'advanced_analytics_session';
  private readonly AB_TEST_KEY = 'ab_test_variants';
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor(config: AdvancedAnalyticsConfig) {
    this.config = config;
    this.sessionData = this.initializeSession();

    if (this.config.enabled && this.shouldTrackUser()) {
      this.initialize();
    }
  }

  /**
   * Inicializar analytics
   */
  private initialize(): void {
    this.isTracking = true;
    this.setupPerformanceTracking();
    this.setupUserInteractionTracking();
    this.setupVisibilityTracking();
    this.setupPWATracking();
    this.loadABTests();

    console.log('📊 Advanced Analytics initialized for session:', this.sessionData.sessionId);
  }

  /**
   * Determinar se deve rastrear este usuário (sampling)
   */
  private shouldTrackUser(): boolean {
    const userId = this.getUserId();
    const hash = this.simpleHash(userId);
    return (hash % 100) < (this.config.sampleRate * 100);
  }

  /**
   * Inicializar sessão
   */
  private initializeSession(): SessionData {
    const existingSession = this.loadSession();
    const now = Date.now();

    // Verificar se sessão ainda é válida
    if (existingSession && (now - existingSession.startTime) < this.SESSION_TIMEOUT) {
      existingSession.pageViews.push(window.location.pathname);
      return existingSession;
    }

    // Criar nova sessão
    const newSession: SessionData = {
      sessionId: this.generateSessionId(),
      startTime: now,
      pageViews: [window.location.pathname],
      events: [],
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      isMobile: this.isMobileDevice(),
      hasGeolocation: 'geolocation' in navigator,
      isReturningUser: !!existingSession
    };

    this.saveSession(newSession);
    return newSession;
  }

  /**
   * Configurar tracking de performance
   */
  private setupPerformanceTracking(): void {
    // Track navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => this.collectPerformanceMetrics(), 1000);
    });

    // Track paint timing
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            this.trackPerformanceEvent('paint', {
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration
            });
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['paint', 'navigation', 'resource'] });
    }

    // Track LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        this.trackPerformanceEvent('lcp', {
          value: lastEntry.startTime,
          element: lastEntry.element?.tagName
        });
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  /**
   * Coletar métricas de performance
   */
  private collectPerformanceMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = this.getLastLCP();

    const metrics: PerformanceMetrics = {
      ttfmp: lcp || fcp, // Usando LCP como proxy para TTFMP
      loadTime: navigation.loadEventEnd - navigation.navigationStart,
      interactionTime: navigation.domInteractive - navigation.navigationStart,
      cacheHitRate: this.calculateCacheHitRate()
    };

    this.trackEvent('performance_metrics', metrics);

    // Enviar métricas para Google Analytics se disponível
    if (typeof gtag !== 'undefined') {
      gtag('event', 'timing_complete', {
        name: 'page_load',
        value: Math.round(metrics.loadTime)
      });

      gtag('event', 'web_vital', {
        name: 'TTFMP',
        value: Math.round(metrics.ttfmp),
        metric_rating: metrics.ttfmp < 2000 ? 'good' : metrics.ttfmp < 4000 ? 'needs_improvement' : 'poor'
      });
    }
  }

  /**
   * Configurar tracking de interações do usuário
   */
  private setupUserInteractionTracking(): void {
    // Track clicks
    document.addEventListener('click', (event) => {
      this.updateLastActivity();

      const target = event.target as HTMLElement;
      const clickData = {
        tag: target.tagName,
        className: target.className,
        id: target.id,
        text: target.textContent?.slice(0, 50),
        x: event.clientX,
        y: event.clientY
      };

      this.trackEvent('click', clickData);
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      this.updateLastActivity();

      const scrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;

        // Track milestone scroll depths
        if ([25, 50, 75, 90].includes(scrollDepth)) {
          this.trackEvent('scroll_depth', { depth: scrollDepth });
        }
      }
    });

    // Track form interactions
    document.addEventListener('input', (event) => {
      this.updateLastActivity();

      const target = event.target as HTMLInputElement;
      if (target.type === 'search' || target.placeholder?.includes('busca')) {
        this.trackEvent('search_interaction', {
          query: target.value.slice(0, 50),
          length: target.value.length
        });
      }
    });
  }

  /**
   * Configurar tracking de visibilidade
   */
  private setupVisibilityTracking(): void {
    // Track quando usuário sai/volta da página
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', { duration: Date.now() - this.lastActivityTime });
      } else {
        this.updateLastActivity();
        this.trackEvent('page_visible', {});
      }
    });

    // Track quando usuário vai sair da página
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  /**
   * Configurar tracking de PWA
   */
  private setupPWATracking(): void {
    // Track PWA install prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      this.trackEvent('pwa_install_prompt_shown', {
        userAgent: navigator.userAgent,
        platform: (navigator as any).platform
      });
    });

    // Track PWA install
    window.addEventListener('appinstalled', (event) => {
      this.trackEvent('pwa_installed', {
        userAgent: navigator.userAgent,
        platform: (navigator as any).platform
      });

      // Send to Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_install', {
          event_category: 'engagement',
          event_label: 'ruidcar_map'
        });
      }
    });

    // Detect if running as PWA
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.trackEvent('pwa_usage', {
        displayMode: 'standalone'
      });
    }
  }

  /**
   * Rastrear conversão (ação do usuário)
   */
  trackConversion(
    type: ConversionEvent['type'],
    workshopId: string,
    source: ConversionEvent['source'],
    metadata?: any
  ): void {
    const conversionEvent: ConversionEvent = {
      type,
      workshopId,
      source,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId
    };

    this.trackEvent('conversion', { ...conversionEvent, ...metadata });

    // Enviar para Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'conversion', {
        event_category: 'workshop_interaction',
        event_label: `${type}_${source}`,
        workshop_id: workshopId,
        custom_parameter_1: source
      });
    }

    // Calcular funil de conversão
    this.updateConversionFunnel(type, source);
  }

  /**
   * Rastrear eventos gerais
   */
  trackEvent(eventName: string, eventData: any): void {
    if (!this.isTracking) return;

    const event = {
      name: eventName,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
      url: window.location.href,
      data: eventData
    };

    this.sessionData.events.push(event);
    this.saveSession(this.sessionData);

    if (this.config.debug) {
      console.log('📊 Analytics Event:', event);
    }

    // Enviar para endpoint personalizado se configurado
    if (this.config.apiEndpoint) {
      this.sendToEndpoint(event);
    }
  }

  /**
   * Rastrear evento de performance
   */
  private trackPerformanceEvent(name: string, data: any): void {
    this.trackEvent(`performance_${name}`, data);
  }

  /**
   * Configurar teste A/B
   */
  setupABTest(experimentId: string, variants: string[]): string {
    // Verificar se usuário já tem variante para este experimento
    const existing = this.currentABTests.get(experimentId);
    if (existing) {
      return existing.variantId;
    }

    // Selecionar variante baseado em hash do user ID
    const userId = this.getUserId();
    const hash = this.simpleHash(userId + experimentId);
    const variantIndex = hash % variants.length;
    const selectedVariant = variants[variantIndex];

    // Salvar variante
    const abTest: ABTestVariant = {
      experimentId,
      variantId: selectedVariant,
      startTime: Date.now()
    };

    this.currentABTests.set(experimentId, abTest);
    this.saveABTests();

    // Track início do experimento
    this.trackEvent('ab_test_start', {
      experimentId,
      variantId: selectedVariant
    });

    return selectedVariant;
  }

  /**
   * Rastrear resultado de teste A/B
   */
  trackABTestResult(experimentId: string, outcome: 'conversion' | 'bounce' | 'custom', value?: any): void {
    const abTest = this.currentABTests.get(experimentId);
    if (!abTest) return;

    this.trackEvent('ab_test_result', {
      experimentId,
      variantId: abTest.variantId,
      outcome,
      value,
      duration: Date.now() - abTest.startTime
    });
  }

  /**
   * Obter métricas de resumo da sessão
   */
  getSessionSummary() {
    const now = Date.now();
    const sessionDuration = now - this.sessionData.startTime;
    const bounceRate = this.calculateBounceRate();
    const conversionRate = this.calculateConversionRate();

    return {
      sessionId: this.sessionData.sessionId,
      duration: sessionDuration,
      pageViews: this.sessionData.pageViews.length,
      eventCount: this.sessionData.events.length,
      bounceRate,
      conversionRate,
      isMobile: this.sessionData.isMobile,
      hasGeolocation: this.sessionData.hasGeolocation,
      isReturningUser: this.sessionData.isReturningUser
    };
  }

  /**
   * Finalizar sessão
   */
  private endSession(): void {
    if (!this.isTracking) return;

    this.sessionData.endTime = Date.now();
    const summary = this.getSessionSummary();

    this.trackEvent('session_end', summary);

    // Enviar dados finais
    if (this.config.apiEndpoint) {
      this.sendSessionSummary(summary);
    }

    if (this.config.debug) {
      console.log('📊 Session Summary:', summary);
    }
  }

  // Utility methods

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private getUserId(): string {
    let userId = localStorage.getItem('analytics_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('analytics_user_id', userId);
    }
    return userId;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private updateLastActivity(): void {
    this.lastActivityTime = Date.now();
  }

  private calculateBounceRate(): number {
    return this.sessionData.pageViews.length === 1 ? 1 : 0;
  }

  private calculateConversionRate(): number {
    const conversions = this.sessionData.events.filter(e => e.name === 'conversion').length;
    return conversions / Math.max(1, this.sessionData.events.length);
  }

  private calculateCacheHitRate(): number {
    const resources = performance.getEntriesByType('resource');
    const cachedResources = resources.filter((r: any) => r.transferSize === 0).length;
    return resources.length > 0 ? cachedResources / resources.length : 0;
  }

  private getLastLCP(): number {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
  }

  private updateConversionFunnel(type: string, source: string): void {
    // Implementar lógica de funil de conversão
    const funnelData = {
      step: type,
      source,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId
    };

    this.trackEvent('conversion_funnel', funnelData);
  }

  // Storage methods

  private saveSession(session: SessionData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save analytics session:', error);
    }
  }

  private loadSession(): SessionData | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load analytics session:', error);
      return null;
    }
  }

  private saveABTests(): void {
    try {
      const testsArray = Array.from(this.currentABTests.entries());
      localStorage.setItem(this.AB_TEST_KEY, JSON.stringify(testsArray));
    } catch (error) {
      console.warn('Failed to save AB tests:', error);
    }
  }

  private loadABTests(): void {
    try {
      const saved = localStorage.getItem(this.AB_TEST_KEY);
      if (saved) {
        const testsArray = JSON.parse(saved);
        this.currentABTests = new Map(testsArray);
      }
    } catch (error) {
      console.warn('Failed to load AB tests:', error);
    }
  }

  // API methods

  private async sendToEndpoint(event: any): Promise<void> {
    if (!this.config.apiEndpoint) return;

    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      if (this.config.debug) {
        console.warn('Failed to send analytics event:', error);
      }
    }
  }

  private async sendSessionSummary(summary: any): Promise<void> {
    if (!this.config.apiEndpoint) return;

    try {
      await fetch(this.config.apiEndpoint + '/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary)
      });
    } catch (error) {
      if (this.config.debug) {
        console.warn('Failed to send session summary:', error);
      }
    }
  }

  // Public API

  /**
   * Destruir analytics (cleanup)
   */
  destroy(): void {
    this.endSession();

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.isTracking = false;
  }
}

// Singleton instance
export const advancedAnalytics = new AdvancedAnalytics({
  enabled: true,
  sampleRate: 1.0, // Track 100% of users (adjust based on needs)
  debug: process.env.NODE_ENV === 'development'
});