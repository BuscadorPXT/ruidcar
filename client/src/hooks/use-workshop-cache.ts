import { useState, useEffect, useCallback } from 'react';
import { type Workshop } from '@shared/schema';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface SearchCacheEntry extends CacheEntry<Workshop[]> {
  query: string;
  filters: {
    state: string;
  };
}

/**
 * Hook para cache inteligente de resultados de busca de oficinas
 * Implementa cache em memória com TTL e invalidação automática
 */
export function useWorkshopCache() {
  const [searchCache, setSearchCache] = useState<Map<string, SearchCacheEntry>>(new Map());
  const [allWorkshopsCache, setAllWorkshopsCache] = useState<CacheEntry<Workshop[]> | null>(null);

  // Cache TTL configs
  const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutos para buscas
  const ALL_WORKSHOPS_TTL = 10 * 60 * 1000; // 10 minutos para lista completa
  const MAX_CACHE_ENTRIES = 20; // Máximo de entradas de busca no cache

  /**
   * Gera chave única para cache baseada na query e filtros
   */
  const generateCacheKey = useCallback((query: string, filters: { state: string }) => {
    return `${query.toLowerCase().trim()}_${filters.state}`;
  }, []);

  /**
   * Verifica se entrada do cache ainda é válida
   */
  const isValidCacheEntry = useCallback(<T>(entry: CacheEntry<T> | null): boolean => {
    if (!entry) return false;
    return Date.now() < entry.expiry;
  }, []);

  /**
   * Limpa entradas expiradas do cache
   */
  const cleanExpiredEntries = useCallback(() => {
    setSearchCache(prev => {
      const now = Date.now();
      const cleaned = new Map();

      for (const [key, entry] of Array.from(prev.entries())) {
        if (now < entry.expiry) {
          cleaned.set(key, entry);
        }
      }

      return cleaned;
    });
  }, []);

  /**
   * Remove entradas mais antigas se cache atingir limite
   */
  const enforceMaxCacheSize = useCallback(() => {
    setSearchCache(prev => {
      if (prev.size <= MAX_CACHE_ENTRIES) return prev;

      // Converte para array, ordena por timestamp, remove mais antigas
      const entries = Array.from(prev.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);

      return new Map(entries.slice(0, MAX_CACHE_ENTRIES));
    });
  }, []);

  /**
   * Recupera resultados de busca do cache
   */
  const getCachedSearchResults = useCallback((query: string, filters: { state: string }): Workshop[] | null => {
    const key = generateCacheKey(query, filters);
    const entry = searchCache.get(key);

    if (entry && isValidCacheEntry(entry)) {
      console.log(`🎯 Cache hit for search: "${query}" with filters:`, filters);
      return entry.data;
    }

    return null;
  }, [searchCache, generateCacheKey, isValidCacheEntry]);

  /**
   * Armazena resultados de busca no cache
   */
  const setCachedSearchResults = useCallback((query: string, filters: { state: string }, data: Workshop[]) => {
    const key = generateCacheKey(query, filters);
    const entry: SearchCacheEntry = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + SEARCH_CACHE_TTL,
      query,
      filters
    };

    setSearchCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, entry);
      return newCache;
    });

    console.log(`💾 Cached search results for: "${query}" (${data.length} workshops)`);

    // Limpa cache periodicamente
    setTimeout(() => {
      cleanExpiredEntries();
      enforceMaxCacheSize();
    }, 100);
  }, [generateCacheKey, cleanExpiredEntries, enforceMaxCacheSize]);

  /**
   * Recupera lista completa de oficinas do cache
   */
  const getCachedAllWorkshops = useCallback((): Workshop[] | null => {
    if (isValidCacheEntry(allWorkshopsCache)) {
      console.log('🎯 Cache hit for all workshops');
      return allWorkshopsCache!.data;
    }
    return null;
  }, [allWorkshopsCache, isValidCacheEntry]);

  /**
   * Armazena lista completa de oficinas no cache
   */
  const setCachedAllWorkshops = useCallback((data: Workshop[]) => {
    const entry: CacheEntry<Workshop[]> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ALL_WORKSHOPS_TTL
    };

    setAllWorkshopsCache(entry);
    console.log(`💾 Cached all workshops (${data.length} workshops)`);
  }, []);

  /**
   * Invalida todo o cache (útil quando dados são atualizados)
   */
  const invalidateCache = useCallback(() => {
    setSearchCache(new Map());
    setAllWorkshopsCache(null);
    console.log('🗑️ Cache invalidated');
  }, []);

  /**
   * Recupera estatísticas do cache
   */
  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const validSearchEntries = Array.from(searchCache.values()).filter(entry => now < entry.expiry);

    return {
      searchCacheSize: validSearchEntries.length,
      totalSearchQueries: searchCache.size,
      hasValidAllWorkshops: isValidCacheEntry(allWorkshopsCache),
      oldestEntry: validSearchEntries.length > 0
        ? Math.min(...validSearchEntries.map(e => e.timestamp))
        : null,
      newestEntry: validSearchEntries.length > 0
        ? Math.max(...validSearchEntries.map(e => e.timestamp))
        : null
    };
  }, [searchCache, allWorkshopsCache, isValidCacheEntry]);

  /**
   * Pré-carregamento inteligente baseado em queries populares
   */
  const preloadPopularSearches = useCallback(async () => {
    const popularQueries = [
      { query: 'oficinas em SP', filters: { state: 'SP' } },
      { query: 'oficinas em RJ', filters: { state: 'RJ' } },
      { query: 'RuidCar', filters: { state: 'all' } }
    ];

    for (const { query, filters } of popularQueries) {
      const cached = getCachedSearchResults(query, filters);
      if (!cached) {
        try {
          console.log(`🔄 Preloading popular search: "${query}"`);
          // Simulate API call - replace with actual search function
          // const results = await searchWorkshops(query, filters);
          // setCachedSearchResults(query, filters, results);
        } catch (error) {
          console.warn(`Failed to preload search for "${query}":`, error);
        }
      }
    }
  }, [getCachedSearchResults]);

  // Cleanup expired entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cleanExpiredEntries();
    }, 60000); // Limpa a cada minuto

    return () => clearInterval(interval);
  }, [cleanExpiredEntries]);

  // Preload popular searches on mount
  useEffect(() => {
    const timer = setTimeout(preloadPopularSearches, 2000); // Aguarda 2s após mount
    return () => clearTimeout(timer);
  }, [preloadPopularSearches]);

  return {
    // Search cache methods
    getCachedSearchResults,
    setCachedSearchResults,

    // All workshops cache methods
    getCachedAllWorkshops,
    setCachedAllWorkshops,

    // Cache management
    invalidateCache,
    getCacheStats,
    preloadPopularSearches,

    // Cache status
    isSearchCacheEnabled: true,
    cacheStats: getCacheStats()
  };
}

export default useWorkshopCache;