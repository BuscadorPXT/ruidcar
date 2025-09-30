import { useState, useEffect, useCallback } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  source: 'gps' | 'ip' | 'cache';
}

interface LocationState {
  location: [number, number] | null;
  isLoading: boolean;
  error: string | null;
  source: 'gps' | 'ip' | 'cache' | null;
}

const CACHE_KEY = 'ruidcar_user_location';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Hook para obter localização do usuário IMEDIATAMENTE com cache inteligente
 *
 * Estratégia:
 * 1. Verifica cache válido no localStorage (24h)
 * 2. Se não há cache, solicita GPS imediatamente
 * 3. Fallback para IP geolocation se GPS falhar
 * 4. Cache resultado para próximas visitas
 */
export function useImmediateLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: true,
    error: null,
    source: null
  });

  /**
   * Verifica se há localização válida no cache
   */
  const getCachedLocation = useCallback((): LocationData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: LocationData = JSON.parse(cached);
      const now = Date.now();

      // Verifica se cache ainda é válido (24h)
      if (now - data.timestamp < CACHE_DURATION) {
        console.log('🎯 Using cached location:', data);
        return data;
      } else {
        console.log('⏰ Cached location expired, removing...');
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
    } catch (error) {
      console.warn('Error reading cached location:', error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  /**
   * Salva localização no cache
   */
  const setCachedLocation = useCallback((latitude: number, longitude: number, source: 'gps' | 'ip') => {
    try {
      const data: LocationData = {
        latitude,
        longitude,
        timestamp: Date.now(),
        source
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      console.log(`💾 Cached location from ${source}:`, data);
    } catch (error) {
      console.warn('Error caching location:', error);
    }
  }, []);

  /**
   * Obtém localização via GPS
   */
  const getGPSLocation = useCallback((): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 GPS location obtained:', { latitude, longitude });
          resolve({ latitude, longitude });
        },
        (error) => {
          console.warn('GPS location failed:', error.message);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 segundos
          maximumAge: 300000 // 5 minutos cache GPS
        }
      );
    });
  }, []);

  /**
   * Fallback: obtém localização aproximada via IP
   */
  const getIPLocation = useCallback(async (): Promise<{ latitude: number; longitude: number }> => {
    try {
      console.log('🌐 Attempting IP geolocation fallback...');

      // Usando ipapi.co como fallback gratuito
      const response = await fetch('https://ipapi.co/json/', {
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error('IP geolocation API failed');
      }

      const data = await response.json();

      if (!data.latitude || !data.longitude) {
        throw new Error('Invalid IP geolocation response');
      }

      console.log('🌐 IP location obtained:', {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country_name
      });

      return {
        latitude: data.latitude,
        longitude: data.longitude
      };
    } catch (error) {
      console.error('IP geolocation failed:', error);
      throw error;
    }
  }, []);

  /**
   * Obtém localização com fallback strategy
   */
  const obtainLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Primeira tentativa: GPS
      try {
        const gpsLocation = await getGPSLocation();
        setCachedLocation(gpsLocation.latitude, gpsLocation.longitude, 'gps');

        setState({
          location: [gpsLocation.latitude, gpsLocation.longitude],
          isLoading: false,
          error: null,
          source: 'gps'
        });
        return;
      } catch (gpsError) {
        console.log('GPS failed, trying IP fallback...');
      }

      // Segunda tentativa: IP Geolocation
      try {
        const ipLocation = await getIPLocation();
        setCachedLocation(ipLocation.latitude, ipLocation.longitude, 'ip');

        setState({
          location: [ipLocation.latitude, ipLocation.longitude],
          isLoading: false,
          error: null,
          source: 'ip'
        });
        return;
      } catch (ipError) {
        console.log('IP geolocation also failed');
      }

      // Se ambos falharam
      setState({
        location: null,
        isLoading: false,
        error: 'Não foi possível obter sua localização. Você pode buscar manualmente por cidade.',
        source: null
      });

    } catch (error) {
      setState({
        location: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao obter localização',
        source: null
      });
    }
  }, [getGPSLocation, getIPLocation, setCachedLocation]);

  /**
   * Force refresh da localização (ignora cache)
   */
  const refreshLocation = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    obtainLocation();
  }, [obtainLocation]);

  /**
   * Effect principal: verifica cache ou obtém nova localização
   */
  useEffect(() => {
    const cached = getCachedLocation();

    if (cached) {
      // Usa localização do cache
      setState({
        location: [cached.latitude, cached.longitude],
        isLoading: false,
        error: null,
        source: 'cache'
      });
    } else {
      // Obtém nova localização
      obtainLocation();
    }
  }, [getCachedLocation, obtainLocation]);

  return {
    ...state,
    refreshLocation,
    clearCache: () => localStorage.removeItem(CACHE_KEY)
  };
}

export default useImmediateLocation;