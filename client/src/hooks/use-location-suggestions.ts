import { useState, useEffect, useCallback } from 'react';

interface LocationSuggestion {
  id: string;
  name: string;
  state: string;
  type: 'city' | 'state' | 'cep';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface UseLocationSuggestionsOptions {
  minQueryLength?: number;
  debounceMs?: number;
  maxResults?: number;
}

interface LocationSuggestionsState {
  suggestions: LocationSuggestion[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para autocomplete geográfico brasileiro
 *
 * Estratégia:
 * 1. Estados brasileiros (hardcoded para velocidade)
 * 2. Cidades via Brasil API
 * 3. CEP via ViaCEP API
 * 4. Cache inteligente de resultados
 * 5. Histórico de buscas populares
 */
export function useLocationSuggestions(
  query: string,
  options: UseLocationSuggestionsOptions = {}
) {
  const {
    minQueryLength = 2,
    debounceMs = 300,
    maxResults = 8
  } = options;

  const [state, setState] = useState<LocationSuggestionsState>({
    suggestions: [],
    isLoading: false,
    error: null
  });

  // Cache para resultados
  const [cache] = useState(() => new Map<string, LocationSuggestion[]>());

  // Estados brasileiros para sugestões rápidas
  const brazilianStates = [
    { code: 'AC', name: 'Acre' },
    { code: 'AL', name: 'Alagoas' },
    { code: 'AP', name: 'Amapá' },
    { code: 'AM', name: 'Amazonas' },
    { code: 'BA', name: 'Bahia' },
    { code: 'CE', name: 'Ceará' },
    { code: 'DF', name: 'Distrito Federal' },
    { code: 'ES', name: 'Espírito Santo' },
    { code: 'GO', name: 'Goiás' },
    { code: 'MA', name: 'Maranhão' },
    { code: 'MT', name: 'Mato Grosso' },
    { code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' },
    { code: 'PA', name: 'Pará' },
    { code: 'PB', name: 'Paraíba' },
    { code: 'PR', name: 'Paraná' },
    { code: 'PE', name: 'Pernambuco' },
    { code: 'PI', name: 'Piauí' },
    { code: 'RJ', name: 'Rio de Janeiro' },
    { code: 'RN', name: 'Rio Grande do Norte' },
    { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'RO', name: 'Rondônia' },
    { code: 'RR', name: 'Roraima' },
    { code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' },
    { code: 'SE', name: 'Sergipe' },
    { code: 'TO', name: 'Tocantins' }
  ];

  // Detectar tipo de query
  const getQueryType = useCallback((query: string) => {
    const cleanQuery = query.trim();

    // CEP pattern: 8 digits with optional dash
    if (/^\d{5}-?\d{3}$/.test(cleanQuery)) {
      return 'cep';
    }

    // State code pattern: 2 letters
    if (/^[A-Z]{2}$/i.test(cleanQuery)) {
      return 'state';
    }

    return 'city';
  }, []);

  // Buscar sugestões de estados
  const getStateSuggestions = useCallback((query: string): LocationSuggestion[] => {
    const normalizedQuery = query.toLowerCase();

    return brazilianStates
      .filter(state =>
        state.name.toLowerCase().includes(normalizedQuery) ||
        state.code.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 3)
      .map(state => ({
        id: `state-${state.code}`,
        name: `${state.name} (${state.code})`,
        state: state.code,
        type: 'state' as const
      }));
  }, [brazilianStates]);

  // Buscar CEP via ViaCEP
  const getCepSuggestion = useCallback(async (cep: string): Promise<LocationSuggestion[]> => {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

      if (!response.ok) throw new Error('CEP não encontrado');

      const data = await response.json();

      if (data.erro) throw new Error('CEP inválido');

      return [{
        id: `cep-${cleanCep}`,
        name: `${data.logradouro || 'Endereço'}, ${data.bairro || 'Bairro'} - ${data.localidade}/${data.uf}`,
        state: data.uf,
        type: 'cep' as const,
        coordinates: {
          lat: parseFloat(data.lat) || 0,
          lng: parseFloat(data.lng) || 0
        }
      }];
    } catch (error) {
      console.warn('Error fetching CEP:', error);
      return [];
    }
  }, []);

  // Buscar cidades via Brasil API (IBGE)
  const getCitySuggestions = useCallback(async (query: string): Promise<LocationSuggestion[]> => {
    try {
      // URL da Brasil API para buscar municípios
      const response = await fetch(
        `https://brasilapi.com.br/api/ibge/municipios/v1?providers=dados-abertos-br,gov,wikipedia`
      );

      if (!response.ok) throw new Error('Erro ao buscar cidades');

      const cities = await response.json();
      const normalizedQuery = query.toLowerCase();

      // Filtrar cidades que contenham a query
      const matchingCities = cities
        .filter((city: any) =>
          city.nome.toLowerCase().includes(normalizedQuery)
        )
        .slice(0, maxResults - 2) // Reservar espaço para estados
        .map((city: any) => ({
          id: `city-${city.codigo_ibge}`,
          name: `${city.nome}, ${city.microrregiao.mesorregiao.UF.sigla}`,
          state: city.microrregiao.mesorregiao.UF.sigla,
          type: 'city' as const
        }));

      return matchingCities;
    } catch (error) {
      console.warn('Error fetching cities:', error);
      return [];
    }
  }, [maxResults]);

  // Função principal de busca
  const searchSuggestions = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < minQueryLength) {
      setState(prev => ({ ...prev, suggestions: [], isLoading: false }));
      return;
    }

    // Verificar cache primeiro
    const cacheKey = trimmedQuery.toLowerCase();
    if (cache.has(cacheKey)) {
      setState(prev => ({
        ...prev,
        suggestions: cache.get(cacheKey)!,
        isLoading: false,
        error: null
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const queryType = getQueryType(trimmedQuery);
      let suggestions: LocationSuggestion[] = [];

      if (queryType === 'cep') {
        // Buscar apenas CEP
        suggestions = await getCepSuggestion(trimmedQuery);
      } else {
        // Buscar estados + cidades
        const stateSuggestions = getStateSuggestions(trimmedQuery);

        if (queryType === 'state') {
          suggestions = stateSuggestions;
        } else {
          // Buscar cidades
          const citySuggestions = await getCitySuggestions(trimmedQuery);
          suggestions = [...stateSuggestions, ...citySuggestions].slice(0, maxResults);
        }
      }

      // Cache do resultado
      cache.set(cacheKey, suggestions);

      setState(prev => ({
        ...prev,
        suggestions,
        isLoading: false,
        error: null
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar sugestões';
      setState(prev => ({
        ...prev,
        suggestions: [],
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [
    minQueryLength,
    cache,
    getQueryType,
    getCepSuggestion,
    getStateSuggestions,
    getCitySuggestions,
    maxResults
  ]);

  // Debounce da busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSuggestions(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, searchSuggestions, debounceMs]);

  // Função para limpar sugestões
  const clearSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, suggestions: [], error: null }));
  }, []);

  // Função para obter coordenadas de uma sugestão
  const getCoordinatesFromSuggestion = useCallback(async (suggestion: LocationSuggestion) => {
    if (suggestion.coordinates) {
      return suggestion.coordinates;
    }

    // Para estados e cidades sem coordenadas, usar um serviço de geocoding
    try {
      // Placeholder - implementar geocoding se necessário
      return null;
    } catch (error) {
      console.warn('Error getting coordinates:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    clearSuggestions,
    getCoordinatesFromSuggestion
  };
}