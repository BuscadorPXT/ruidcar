/**
 * Global Error Handler Service
 * Captura e reporta erros JavaScript não tratados e promise rejections
 */

interface GlobalErrorReport {
  id: string;
  timestamp: number;
  type: 'javascript' | 'unhandled_promise' | 'resource';
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  url: string;
  userAgent: string;
  source?: string;
  promiseRejectionReason?: any;
  performance: {
    memory?: any;
    navigation?: any;
  };
}

export class GlobalErrorHandler {
  private isInitialized = false;
  private errorQueue: GlobalErrorReport[] = [];
  private readonly maxQueueSize = 100;
  private readonly batchSendDelay = 5000; // 5 segundos

  /**
   * Inicializar global error handling
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('GlobalErrorHandler already initialized');
      return;
    }

    this.setupGlobalErrorListeners();
    this.setupPeriodicSend();
    this.isInitialized = true;
    console.log('🔧 GlobalErrorHandler initialized');
  }

  /**
   * Setup listeners para erros globais
   */
  private setupGlobalErrorListeners(): void {
    // JavaScript runtime errors
    window.addEventListener('error', (event) => {
      const report: GlobalErrorReport = {
        id: this.generateErrorId(),
        timestamp: Date.now(),
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        source: event.error?.toString(),
        performance: this.getPerformanceData()
      };

      this.handleGlobalError(report);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const report: GlobalErrorReport = {
        id: this.generateErrorId(),
        timestamp: Date.now(),
        type: 'unhandled_promise',
        message: event.reason?.toString() || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        promiseRejectionReason: event.reason,
        performance: this.getPerformanceData()
      };

      this.handleGlobalError(report);

      // Prevent default browser behavior (console error)
      // event.preventDefault();
    });

    // Resource loading errors (images, scripts, etc.)
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        const report: GlobalErrorReport = {
          id: this.generateErrorId(),
          timestamp: Date.now(),
          type: 'resource',
          message: `Failed to load resource: ${target.tagName}`,
          filename: (target as any).src || (target as any).href,
          url: window.location.href,
          userAgent: navigator.userAgent,
          source: target.outerHTML?.substring(0, 200),
          performance: this.getPerformanceData()
        };

        this.handleGlobalError(report);
      }
    }, true); // Capture phase for resource errors
  }

  /**
   * Processar erro global capturado
   */
  private handleGlobalError(report: GlobalErrorReport): void {
    // Log no console para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Global Error Captured');
      console.error('Type:', report.type);
      console.error('Message:', report.message);
      console.error('Location:', report.filename, report.lineno, report.colno);
      console.error('Stack:', report.stack);
      console.error('Report ID:', report.id);
      console.groupEnd();
    }

    // Adicionar à fila
    this.addToQueue(report);

    // Filtrar erros conhecidos/ignoráveis
    if (this.shouldIgnoreError(report)) {
      return;
    }

    // Enviar para analytics se for crítico
    if (this.isCriticalError(report)) {
      this.sendImmediately(report);
    }
  }

  /**
   * Verificar se erro deve ser ignorado
   */
  private shouldIgnoreError(report: GlobalErrorReport): boolean {
    const ignoredPatterns = [
      /Script error/i,
      /Non-Error promise rejection captured/i,
      /ResizeObserver loop limit exceeded/i,
      /NetworkError when attempting to fetch resource/i,
      /Loading chunk \d+ failed/i, // Webpack chunk loading
      /ChunkLoadError/i,
      /Loading CSS chunk/i,
      /favicon\.ico/i // Favicon errors
    ];

    return ignoredPatterns.some(pattern =>
      pattern.test(report.message) ||
      pattern.test(report.filename || '') ||
      pattern.test(report.stack || '')
    );
  }

  /**
   * Verificar se é erro crítico que precisa ser enviado imediatamente
   */
  private isCriticalError(report: GlobalErrorReport): boolean {
    const criticalPatterns = [
      /ReferenceError/i,
      /TypeError.*Cannot read prop/i,
      /hooks.*wrong context/i,
      /React.*#310/i,
      /Cannot update.*unmounted component/i
    ];

    return criticalPatterns.some(pattern =>
      pattern.test(report.message) ||
      pattern.test(report.stack || '')
    );
  }

  /**
   * Adicionar erro à fila
   */
  private addToQueue(report: GlobalErrorReport): void {
    this.errorQueue.push(report);

    // Manter tamanho da fila limitado
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  /**
   * Enviar erro imediatamente
   */
  private async sendImmediately(report: GlobalErrorReport): Promise<void> {
    try {
      await this.sendErrorReport(report);
    } catch (error) {
      console.warn('Failed to send critical error report:', error);
    }
  }

  /**
   * Setup envio periódico de erros em batch
   */
  private setupPeriodicSend(): void {
    setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.sendBatchErrors();
      }
    }, this.batchSendDelay);

    // Enviar erros ao sair da página
    window.addEventListener('beforeunload', () => {
      if (this.errorQueue.length > 0) {
        this.sendBatchErrors(true);
      }
    });
  }

  /**
   * Enviar batch de erros
   */
  private async sendBatchErrors(useBeacon = false): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const batch = [...this.errorQueue];
    this.errorQueue = [];

    try {
      const payload = JSON.stringify({
        type: 'error_batch',
        timestamp: Date.now(),
        errors: batch,
        sessionInfo: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
      });

      if (useBeacon && navigator.sendBeacon) {
        // Usar sendBeacon para envio durante beforeunload
        navigator.sendBeacon('/api/error-reports/batch', payload);
      } else {
        // Envio normal
        await fetch('/api/error-reports/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        });
      }
    } catch (error) {
      console.warn('Failed to send error batch:', error);
      // Recolocar erros na fila se falhou
      this.errorQueue.unshift(...batch.slice(-50)); // Manter apenas os últimos 50
    }
  }

  /**
   * Enviar relatório individual de erro
   */
  private async sendErrorReport(report: GlobalErrorReport): Promise<void> {
    try {
      await fetch('/api/error-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true
      });
    } catch (error) {
      console.warn('Failed to send individual error report:', error);
    }
  }

  /**
   * Gerar ID único para erro
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Obter dados de performance
   */
  private getPerformanceData(): GlobalErrorReport['performance'] {
    return {
      // @ts-ignore - Performance memory API
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : undefined,
      navigation: performance.getEntriesByType ?
        performance.getEntriesByType('navigation')[0] : undefined
    };
  }

  /**
   * Obter estatísticas do error handler
   */
  public getStats() {
    return {
      isInitialized: this.isInitialized,
      queueSize: this.errorQueue.length,
      maxQueueSize: this.maxQueueSize
    };
  }

  /**
   * Limpar fila de erros
   */
  public clearQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Reportar erro manualmente
   */
  public reportError(error: Error, context?: string): void {
    const report: GlobalErrorReport = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: 'javascript',
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      source: context || 'manual_report',
      performance: this.getPerformanceData()
    };

    this.handleGlobalError(report);
  }
}

// Singleton instance
export const globalErrorHandler = new GlobalErrorHandler();