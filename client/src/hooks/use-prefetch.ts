import { useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';

interface PrefetchOptions {
  priority?: 'high' | 'low';
  delay?: number;
  condition?: () => boolean;
}

// Rotas críticas por role
const CRITICAL_ROUTES = {
  ADMIN: [
    '/admin/dashboard',
    '/admin/leads',
    '/admin/workshops',
    '/admin/notifications'
  ],
  OFICINA_OWNER: [
    '/workshop/dashboard',
    '/workshop/appointments',
    '/workshop/profile'
  ],
  CLIENTE: [
    '/cliente/dashboard'
  ],
  PUBLIC: [
    '/mapa',
    '/agendar'
  ]
} as const;

// Cache de recursos já prefetchados
const prefetchCache = new Set<string>();

class ResourcePrefetcher {
  private static instance: ResourcePrefetcher;
  private pendingPrefetches = new Map<string, Promise<void>>();

  static getInstance(): ResourcePrefetcher {
    if (!ResourcePrefetcher.instance) {
      ResourcePrefetcher.instance = new ResourcePrefetcher();
    }
    return ResourcePrefetcher.instance;
  }

  // Prefetch de chunks JavaScript específicos
  async prefetchRoute(route: string, options: PrefetchOptions = {}): Promise<void> {
    if (prefetchCache.has(route)) {
      return; // Já foi prefetchado
    }

    // Verificar condição se fornecida
    if (options.condition && !options.condition()) {
      return;
    }

    // Se já existe uma requisição pendente, aguardar ela
    if (this.pendingPrefetches.has(route)) {
      return this.pendingPrefetches.get(route);
    }

    const prefetchPromise = this.performPrefetch(route, options);
    this.pendingPrefetches.set(route, prefetchPromise);

    try {
      await prefetchPromise;
      prefetchCache.add(route);
    } finally {
      this.pendingPrefetches.delete(route);
    }
  }

  private async performPrefetch(route: string, options: PrefetchOptions): Promise<void> {
    // Aguardar delay se especificado
    if (options.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }

    try {
      // Estratégia 1: Prefetch via link rel="prefetch"
      await this.prefetchWithLink(route, options.priority);

      // Estratégia 2: Prefetch de dados da API se necessário
      await this.prefetchApiData(route);

    } catch (error) {
      console.warn(`Failed to prefetch route ${route}:`, error);
    }
  }

  private async prefetchWithLink(route: string, priority: 'high' | 'low' = 'low'): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar se já existe um link de prefetch para esta rota
      const existingLink = document.querySelector(`link[href="${route}"]`);
      if (existingLink) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = priority === 'high' ? 'preload' : 'prefetch';
      link.href = route;
      link.as = 'document';

      link.onload = () => {
        console.log(`✅ Prefetched route: ${route}`);
        resolve();
      };

      link.onerror = () => {
        console.warn(`❌ Failed to prefetch route: ${route}`);
        reject(new Error(`Failed to prefetch ${route}`));
      };

      // Adicionar ao head
      document.head.appendChild(link);

      // Timeout de segurança
      setTimeout(() => {
        console.warn(`⏰ Prefetch timeout for route: ${route}`);
        resolve(); // Resolver mesmo com timeout para não travar
      }, 5000);
    });
  }

  private async prefetchApiData(route: string): Promise<void> {
    // Mapear rotas para endpoints de API relevantes
    const apiEndpoints: Record<string, string[]> = {
      '/admin/dashboard': ['/api/admin/dashboard'],
      '/admin/leads': ['/api/leads?limit=10'],
      '/admin/workshops': ['/api/admin/workshops?limit=10'],
      '/workshop/dashboard': ['/api/workshop/dashboard'],
      '/workshop/appointments': ['/api/appointments?limit=10'],
      '/mapa': ['/api/workshops/public?limit=50']
    };

    const endpoints = apiEndpoints[route];
    if (!endpoints) return;

    // Prefetch dos dados em paralelo
    const prefetchPromises = endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint, {
          credentials: 'include',
          priority: 'low' as any // Prioridade baixa para não interferir em requisições críticas
        });

        if (response.ok) {
          console.log(`✅ Prefetched API data: ${endpoint}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to prefetch API data: ${endpoint}`, error);
      }
    });

    await Promise.allSettled(prefetchPromises);
  }

  // Prefetch inteligente baseado no comportamento do usuário
  async smartPrefetch(userRole: string, currentRoute: string): Promise<void> {
    const roleRoutes = CRITICAL_ROUTES[userRole as keyof typeof CRITICAL_ROUTES] || [];

    // Determinar próximas rotas prováveis baseado na rota atual
    const likelyNextRoutes = this.predictNextRoutes(currentRoute, roleRoutes);

    // Prefetch com delay escalonado
    const prefetchPromises = likelyNextRoutes.map((route, index) =>
      this.prefetchRoute(route, {
        priority: index === 0 ? 'high' : 'low',
        delay: index * 1000, // Escalonar prefetches
        condition: () => this.shouldPrefetch()
      })
    );

    await Promise.allSettled(prefetchPromises);
  }

  private predictNextRoutes(currentRoute: string, availableRoutes: readonly string[]): string[] {
    // Lógica de predição baseada em padrões de navegação
    const predictions: Record<string, string[]> = {
      '/admin': ['/admin/leads', '/admin/workshops', '/admin/dashboard'],
      '/admin/dashboard': ['/admin/leads', '/admin/workshops'],
      '/admin/leads': ['/admin/leads/dashboard', '/admin/workshops'],
      '/workshop': ['/workshop/appointments', '/workshop/profile'],
      '/workshop/dashboard': ['/workshop/appointments', '/workshop/services'],
      '/': ['/mapa', '/agendar'],
      '/mapa': ['/agendar']
    };

    const predicted = predictions[currentRoute] || [];

    // Filtrar apenas rotas disponíveis para o usuário
    return predicted.filter(route => availableRoutes.includes(route));
  }

  private shouldPrefetch(): boolean {
    // Não fazer prefetch em conexões lentas ou dados limitados
    // @ts-ignore - Connection API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      // Evitar prefetch em conexões 2G/slow-2g
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        return false;
      }

      // Evitar prefetch se dados são limitados
      if (connection.saveData) {
        return false;
      }
    }

    // Verificar se há memória suficiente
    // @ts-ignore - Memory API
    const memory = (performance as any).memory;
    if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
      return false; // Não prefetch se memória está quase cheia
    }

    return true;
  }

  // Limpar cache de prefetch (útil para economia de memória)
  clearCache(): void {
    prefetchCache.clear();
    this.pendingPrefetches.clear();

    // Remover links de prefetch do DOM
    const prefetchLinks = document.querySelectorAll('link[rel="prefetch"], link[rel="preload"][as="document"]');
    prefetchLinks.forEach(link => link.remove());
  }

  getCacheStatus(): { cached: string[], pending: string[] } {
    return {
      cached: Array.from(prefetchCache),
      pending: Array.from(this.pendingPrefetches.keys())
    };
  }
}

// Hook principal para usar prefetch
export function usePrefetch() {
  const { user, currentRole } = useAuth();
  const prefetcher = ResourcePrefetcher.getInstance();

  // Prefetch inteligente baseado no usuário
  const prefetchForUser = useCallback(async (currentRoute: string) => {
    if (!user || !currentRole) return;

    await prefetcher.smartPrefetch(currentRole.roleName, currentRoute);
  }, [user, currentRole]);

  // Prefetch manual de rota específica
  const prefetchRoute = useCallback((route: string, options?: PrefetchOptions) => {
    return prefetcher.prefetchRoute(route, options);
  }, []);

  // Prefetch em hover (para links)
  const onHoverPrefetch = useCallback((route: string) => {
    prefetcher.prefetchRoute(route, {
      priority: 'low',
      delay: 100 // Pequeno delay para evitar prefetch desnecessário
    });
  }, []);

  // Limpeza do cache
  const clearPrefetchCache = useCallback(() => {
    prefetcher.clearCache();
  }, []);

  // Status do cache
  const getCacheStatus = useCallback(() => {
    return prefetcher.getCacheStatus();
  }, []);

  return {
    prefetchForUser,
    prefetchRoute,
    onHoverPrefetch,
    clearPrefetchCache,
    getCacheStatus
  };
}

// Hook para prefetch automático na inicialização
export function useAutoPrefetch(currentRoute: string) {
  const { prefetchForUser } = usePrefetch();
  const { currentRole } = useAuth();

  useEffect(() => {
    if (!currentRole) return;

    // Aguardar um tempo antes de iniciar prefetch para não interferir com carregamento inicial
    const timer = setTimeout(() => {
      prefetchForUser(currentRoute);
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentRoute, currentRole, prefetchForUser]);
}

// Hook para prefetch em hover de links
export function useHoverPrefetch() {
  const { onHoverPrefetch } = usePrefetch();

  const handleMouseEnter = useCallback((href: string) => {
    onHoverPrefetch(href);
  }, [onHoverPrefetch]);

  return { handleMouseEnter };
}

export default ResourcePrefetcher;