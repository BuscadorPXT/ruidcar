import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export interface WebVitalsMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  entries: PerformanceEntry[];
  navigationType?: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface WebVitalsData {
  url: string;
  timestamp: number;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  metrics: {
    CLS?: WebVitalsMetric;
    FID?: WebVitalsMetric;
    FCP?: WebVitalsMetric;
    LCP?: WebVitalsMetric;
    TTFB?: WebVitalsMetric;
    INP?: WebVitalsMetric;
  };
}

class WebVitalsMonitor {
  private data: WebVitalsData;
  private onReport?: (data: WebVitalsData) => void;

  constructor(onReport?: (data: WebVitalsData) => void) {
    this.onReport = onReport;
    this.data = {
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceMemory: this.getDeviceMemory(),
      metrics: {}
    };

    this.initMonitoring();
  }

  private getConnectionType(): string | undefined {
    // @ts-ignore - Connection API não é completamente suportada em todos os tipos
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType;
  }

  private getDeviceMemory(): number | undefined {
    // @ts-ignore - Device Memory API
    return navigator.deviceMemory;
  }

  private initMonitoring() {
    // Cumulative Layout Shift (CLS)
    onCLS((metric: any) => {
      this.data.metrics.CLS = metric as WebVitalsMetric;
      this.reportMetric('CLS', metric);
    });

    // First Input Delay (FID) - deprecated, using INP instead
    // onFID is no longer available in web-vitals v4+

    // First Contentful Paint (FCP)
    onFCP((metric: any) => {
      this.data.metrics.FCP = metric as WebVitalsMetric;
      this.reportMetric('FCP', metric);
    });

    // Largest Contentful Paint (LCP)
    onLCP((metric: any) => {
      this.data.metrics.LCP = metric as WebVitalsMetric;
      this.reportMetric('LCP', metric);
    });

    // Time to First Byte (TTFB)
    onTTFB((metric: any) => {
      this.data.metrics.TTFB = metric as WebVitalsMetric;
      this.reportMetric('TTFB', metric);
    });

    // Interaction to Next Paint (INP)
    onINP((metric) => {
      this.data.metrics.INP = metric as WebVitalsMetric;
      this.reportMetric('INP', metric);
    });
  }

  private reportMetric(name: string, metric: any) {
    console.log(`[Web Vitals] ${name}:`, {
      value: metric.value,
      rating: metric.rating,
      entries: metric.entries?.length || 0
    });

    // Report to analytics service
    this.sendToAnalytics(name, metric);

    // Call custom callback
    if (this.onReport) {
      this.onReport(this.data);
    }
  }

  private sendToAnalytics(name: string, metric: any) {
    // Google Analytics 4 (gtag)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: metric.rating,
        custom_parameter_1: this.data.connectionType,
        custom_parameter_2: this.data.deviceMemory
      });
    }

    // Custom analytics endpoint
    this.sendToCustomEndpoint(name, metric);
  }

  private async sendToCustomEndpoint(name: string, metric: any) {
    if (!this.shouldSendMetrics()) return;

    try {
      const payload = {
        name,
        value: metric.value,
        id: metric.id,
        rating: metric.rating,
        url: this.data.url,
        timestamp: Date.now(),
        userAgent: this.data.userAgent,
        connectionType: this.data.connectionType,
        deviceMemory: this.data.deviceMemory,
        entries: metric.entries?.map((entry: PerformanceEntry) => ({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          entryType: entry.entryType
        })) || []
      };

      // Use sendBeacon for reliability
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/web-vitals', JSON.stringify(payload));
      } else {
        // Fallback to fetch
        fetch('/api/web-vitals', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json'
          },
          keepalive: true
        }).catch(error => {
          console.warn('Failed to send Web Vitals metric:', error);
        });
      }
    } catch (error) {
      console.warn('Error sending Web Vitals metric:', error);
    }
  }

  private shouldSendMetrics(): boolean {
    // Don't send metrics in development
    if (process.env.NODE_ENV === 'development') {
      return false;
    }

    // Sample rate (only send 10% of metrics in production to reduce load)
    return Math.random() < 0.1;
  }

  public getMetrics(): WebVitalsData {
    return this.data;
  }

  public generateReport(): string {
    const metrics = this.data.metrics;
    const report = [];

    report.push('=== Web Vitals Report ===');
    report.push(`URL: ${this.data.url}`);
    report.push(`Timestamp: ${new Date(this.data.timestamp).toISOString()}`);
    report.push(`Connection: ${this.data.connectionType || 'unknown'}`);
    report.push(`Device Memory: ${this.data.deviceMemory || 'unknown'}GB`);
    report.push('');

    Object.entries(metrics).forEach(([name, metric]) => {
      if (metric) {
        report.push(`${name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
      }
    });

    return report.join('\n');
  }
}

// Performance budget thresholds
export const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 }    // Interaction to Next Paint
};

// Helper function to get performance rating
export function getPerformanceRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[metricName as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!thresholds) return 'good';

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

// Hook para usar Web Vitals em componentes React
export function useWebVitals(onReport?: (data: WebVitalsData) => void) {
  const monitor = new WebVitalsMonitor(onReport);

  return {
    getMetrics: () => monitor.getMetrics(),
    generateReport: () => monitor.generateReport()
  };
}

// Initialize Web Vitals monitoring
export function initWebVitalsMonitoring(onReport?: (data: WebVitalsData) => void) {
  if (typeof window !== 'undefined') {
    new WebVitalsMonitor(onReport);
  }
}

// Export for global usage
export default WebVitalsMonitor;