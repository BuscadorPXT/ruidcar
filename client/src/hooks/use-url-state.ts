import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook para sincronizar estado com URL search params
 * Permite deep linking e persistência de filtros
 */
export function useUrlState<T extends Record<string, string>>(
  defaultState: T,
  options: {
    /**
     * Função para serializar estado complexo para string
     */
    serialize?: (value: any) => string;
    /**
     * Função para deserializar string da URL para valor
     */
    deserialize?: (value: string) => any;
    /**
     * Se deve atualizar a URL imediatamente ou com debounce
     */
    debounce?: number;
  } = {}
) {
  const [location, setLocation] = useLocation();
  const [state, setState] = useState<T>(defaultState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse URL params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const newState = { ...defaultState };

    // Atualiza estado com valores da URL
    Object.keys(defaultState).forEach((key) => {
      const urlValue = urlParams.get(key);
      if (urlValue !== null) {
        if (options.deserialize) {
          newState[key as keyof T] = options.deserialize(urlValue);
        } else {
          newState[key as keyof T] = urlValue as T[keyof T];
        }
      }
    });

    setState(newState);
    setIsInitialized(true);
  }, []);

  // Update URL when state changes
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    const updateUrl = () => {
      const urlParams = new URLSearchParams();

      Object.entries(state).forEach(([key, value]) => {
        // Only add non-default values to URL
        if (value !== defaultState[key as keyof T] && value !== '' && value !== null && value !== undefined) {
          const serializedValue = options.serialize ? options.serialize(value) : String(value);
          urlParams.set(key, serializedValue);
        }
      });

      const newSearch = urlParams.toString();
      const currentPath = window.location.pathname;
      const newUrl = newSearch ? `${currentPath}?${newSearch}` : currentPath;

      // Update URL without triggering navigation
      if (window.location.pathname + window.location.search !== newUrl) {
        window.history.replaceState({}, '', newUrl);
      }
    };

    if (options.debounce && options.debounce > 0) {
      const timeoutId = setTimeout(updateUrl, options.debounce);
      return () => clearTimeout(timeoutId);
    } else {
      updateUrl();
    }
  }, [state, isInitialized, options.serialize, options.debounce]);

  const updateState = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(() => {
    setState(defaultState);
  }, [defaultState]);

  return {
    state,
    updateState,
    resetState,
    isInitialized
  };
}

/**
 * Hook específico para filtros do mapa
 */
export function useMapFilters() {
  return useUrlState({
    search: '',
    state: 'all',
    view: 'map'
  }, {
    debounce: 300 // Debounce URL updates
  });
}

export default useUrlState;