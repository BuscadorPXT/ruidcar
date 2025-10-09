/**
 * Network Resilience Service
 * Implementa retry logic, circuit breaker, e fallbacks para chamadas de API
 */

interface RetryOptions {
  retries?: number;
  backoffFactor?: number;
  maxDelay?: number;
  retryCondition?: (error: any) => boolean;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

interface RequestConfig extends RequestInit {
  timeout?: number;
  skipRetry?: boolean;
  skipCircuitBreaker?: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

export class NetworkResilience {
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private cache = new Map<string, CacheEntry>();
  private readonly defaultRetryOptions: Required<RetryOptions> = {
    retries: 3,
    backoffFactor: 2,
    maxDelay: 10000,
    retryCondition: (error) => this.isRetriableError(error)
  };

  // Circuit breaker configuration
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 30000; // 30 seconds
  private readonly defaultTimeout = 15000; // 15 seconds

  /**
   * Fetch com resilience (retry + circuit breaker + cache)
   */
  public async fetchWithResilience(
    url: string,
    options: RequestConfig = {},
    retryOptions: RetryOptions = {}
  ): Promise<Response> {
    const finalRetryOptions = { ...this.defaultRetryOptions, ...retryOptions };
    const cacheKey = this.getCacheKey(url, options);

    // Verificar cache primeiro
    if (options.method === 'GET' || !options.method) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          statusText: 'OK (Cached)',
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Verificar circuit breaker
    if (!options.skipCircuitBreaker) {
      this.checkCircuitBreaker(url);
    }

    return this.executeWithRetry(url, options, finalRetryOptions, cacheKey);
  }

  /**
   * Executar request com retry logic
   */
  private async executeWithRetry(
    url: string,
    options: RequestConfig,
    retryOptions: Required<RetryOptions>,
    cacheKey: string
  ): Promise<Response> {
    let lastError: any;

    for (let attempt = 0; attempt <= retryOptions.retries; attempt++) {
      try {
        const response = await this.executeRequest(url, options);

        // Sucesso - resetar circuit breaker
        this.onRequestSuccess(url);

        // Cache da resposta se for GET e bem-sucedida
        if ((options.method === 'GET' || !options.method) && response.ok) {
          await this.cacheResponse(cacheKey, response.clone());
        }

        return response;
      } catch (error) {
        lastError = error;

        // Registrar falha no circuit breaker
        this.onRequestFailure(url);

        // Verificar se deve tentar novamente
        if (attempt < retryOptions.retries && retryOptions.retryCondition(error)) {
          const delay = this.calculateBackoffDelay(attempt, retryOptions);
          console.warn(`🔄 Retry attempt ${attempt + 1}/${retryOptions.retries} for ${url} in ${delay}ms. Error:`, error.message);
          await this.delay(delay);
          continue;
        }

        break;
      }
    }

    // Tentar fallback do cache se disponível
    const cached = this.getFromCache(cacheKey, true); // incluir expirado
    if (cached) {
      console.warn(`⚠️ Using stale cache for ${url} due to network failure`);
      return new Response(JSON.stringify(cached), {
        status: 200,
        statusText: 'OK (Stale Cache)',
        headers: { 'Content-Type': 'application/json' }
      });
    }

    throw lastError;
  }

  /**
   * Executar request individual com timeout
   */
  private async executeRequest(url: string, options: RequestConfig): Promise<Response> {
    const timeout = options.timeout || this.defaultTimeout;
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Verificar estado do circuit breaker
   */
  private checkCircuitBreaker(url: string): void {
    const breaker = this.getCircuitBreaker(url);

    if (breaker.state === 'OPEN') {
      if (Date.now() < breaker.nextAttemptTime) {
        throw new Error(`Circuit breaker is OPEN for ${url}. Next attempt in ${Math.round((breaker.nextAttemptTime - Date.now()) / 1000)}s`);
      } else {
        // Transition to HALF_OPEN
        breaker.state = 'HALF_OPEN';
      }
    }
  }

  /**
   * Lidar com sucesso da request
   */
  private onRequestSuccess(url: string): void {
    const breaker = this.getCircuitBreaker(url);

    if (breaker.state === 'HALF_OPEN') {
      // Reset circuit breaker
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
    }
  }

  /**
   * Lidar com falha da request
   */
  private onRequestFailure(url: string): void {
    const breaker = this.getCircuitBreaker(url);
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failureCount >= this.failureThreshold) {
      breaker.state = 'OPEN';
      breaker.nextAttemptTime = Date.now() + this.recoveryTimeout;
      console.warn(`🚨 Circuit breaker OPEN for ${url}. Failures: ${breaker.failureCount}`);
    }
  }

  /**
   * Obter ou criar circuit breaker para URL
   */
  private getCircuitBreaker(url: string): CircuitBreakerState {
    const baseUrl = new URL(url).origin + new URL(url).pathname;

    if (!this.circuitBreakers.has(baseUrl)) {
      this.circuitBreakers.set(baseUrl, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      });
    }

    return this.circuitBreakers.get(baseUrl)!;
  }

  /**
   * Verificar se erro é retriable
   */
  private isRetriableError(error: any): boolean {
    // Network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return true;
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return true;
    }

    // HTTP status codes que podem ser retriable
    if (error.message.includes('HTTP 5')) {
      return true; // 5xx server errors
    }

    if (error.message.includes('HTTP 429')) {
      return true; // Rate limiting
    }

    if (error.message.includes('HTTP 408')) {
      return true; // Request timeout
    }

    return false;
  }

  /**
   * Calcular delay do backoff exponencial
   */
  private calculateBackoffDelay(attempt: number, options: Required<RetryOptions>): number {
    const baseDelay = 1000; // 1 second
    const exponentialDelay = baseDelay * Math.pow(options.backoffFactor, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter

    return Math.min(exponentialDelay + jitter, options.maxDelay);
  }

  /**
   * Delay assíncrono
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gerar chave de cache
   */
  private getCacheKey(url: string, options: RequestConfig): string {
    const method = options.method || 'GET';
    const body = options.body || '';
    return `${method}:${url}:${typeof body === 'string' ? body : JSON.stringify(body)}`;
  }

  /**
   * Obter dados do cache
   */
  private getFromCache(key: string, includeExpired = false): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (!includeExpired && now > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Armazenar resposta no cache
   */
  private async cacheResponse(key: string, response: Response): Promise<void> {
    try {
      const data = await response.json();
      const now = Date.now();
      const expiry = now + (5 * 60 * 1000); // 5 minutes default

      this.cache.set(key, {
        data,
        timestamp: now,
        expiry
      });

      // Limitar tamanho do cache
      if (this.cache.size > 100) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  /**
   * Limpar cache expirado
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obter estatísticas
   */
  public getStats() {
    const circuitBreakerStats = Array.from(this.circuitBreakers.entries()).map(([url, breaker]) => ({
      url,
      state: breaker.state,
      failureCount: breaker.failureCount,
      lastFailureTime: breaker.lastFailureTime
    }));

    return {
      circuitBreakers: circuitBreakerStats,
      cacheSize: this.cache.size,
      cacheEntries: Array.from(this.cache.keys())
    };
  }

  /**
   * Reset circuit breaker para URL específica
   */
  public resetCircuitBreaker(url: string): void {
    const baseUrl = new URL(url).origin + new URL(url).pathname;
    this.circuitBreakers.delete(baseUrl);
  }

  /**
   * Limpar todo o cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Request wrapper para facilitar uso
   */
  public async get(url: string, options: Omit<RequestConfig, 'method'> = {}): Promise<any> {
    const response = await this.fetchWithResilience(url, { ...options, method: 'GET' });
    return response.json();
  }

  public async post(url: string, data: any, options: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<any> {
    const response = await this.fetchWithResilience(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  public async put(url: string, data: any, options: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<any> {
    const response = await this.fetchWithResilience(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  public async delete(url: string, options: Omit<RequestConfig, 'method'> = {}): Promise<any> {
    const response = await this.fetchWithResilience(url, { ...options, method: 'DELETE' });
    return response.json();
  }
}

// Singleton instance
export const networkResilience = new NetworkResilience();

// Cleanup periódico do cache
setInterval(() => {
  networkResilience.clearExpiredCache();
}, 5 * 60 * 1000); // A cada 5 minutos