import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * Útil para otimizar buscas e evitar múltiplas requisições desnecessárias
 *
 * @param value - Valor a ser debounced
 * @param delay - Delay em milissegundos (padrão: 500ms)
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Define um timer que atualiza o valor debounced após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancela o timer se o valor mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debounce de callbacks
 * Útil quando você quer debouncear a execução de uma função
 *
 * @param callback - Função a ser executada
 * @param delay - Delay em milissegundos (padrão: 500ms)
 * @param deps - Dependências do callback
 * @returns Função debounced
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useState(() => {
    return ((...args: Parameters<T>) => {
      if (timeoutRef[0]) {
        clearTimeout(timeoutRef[0]);
      }
      timeoutRef[1](setTimeout(() => callback(...args), delay));
    }) as T;
  })[0];

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timeoutRef[0]) {
        clearTimeout(timeoutRef[0]);
      }
    };
  }, deps);

  return debouncedCallback;
}

export default useDebounce;