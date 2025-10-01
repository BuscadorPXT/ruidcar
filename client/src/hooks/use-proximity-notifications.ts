import { useState, useEffect, useCallback } from 'react';
import { proximityNotificationService } from '@/services/ProximityNotificationService';
import { type Workshop } from '@shared/schema';

interface UseProximityNotificationsReturn {
  isEnabled: boolean;
  isWatching: boolean;
  hasPermission: boolean;
  settings: any;
  status: any;
  initialize: () => Promise<boolean>;
  startWatching: (workshops: Workshop[]) => Promise<boolean>;
  stopWatching: () => void;
  updateSettings: (settings: any) => void;
  clearHistory: () => void;
}

/**
 * Hook para gerenciar notificações de proximidade
 */
export function useProximityNotifications(): UseProximityNotificationsReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState(proximityNotificationService.getStatus());

  // Atualizar status periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(proximityNotificationService.getStatus());
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  /**
   * Inicializar serviço
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    if (isInitialized) return true;

    const success = await proximityNotificationService.initialize();
    setIsInitialized(success);
    setStatus(proximityNotificationService.getStatus());
    return success;
  }, [isInitialized]);

  /**
   * Iniciar monitoramento
   */
  const startWatching = useCallback(async (workshops: Workshop[]): Promise<boolean> => {
    if (!isInitialized) {
      const initialized = await initialize();
      if (!initialized) return false;
    }

    const success = await proximityNotificationService.startWatching(workshops);
    setStatus(proximityNotificationService.getStatus());
    return success;
  }, [isInitialized, initialize]);

  /**
   * Parar monitoramento
   */
  const stopWatching = useCallback((): void => {
    proximityNotificationService.stopWatching();
    setStatus(proximityNotificationService.getStatus());
  }, []);

  /**
   * Atualizar configurações
   */
  const updateSettings = useCallback((newSettings: any): void => {
    proximityNotificationService.updateSettings(newSettings);
    setStatus(proximityNotificationService.getStatus());
  }, []);

  /**
   * Limpar histórico
   */
  const clearHistory = useCallback((): void => {
    proximityNotificationService.clearHistory();
    setStatus(proximityNotificationService.getStatus());
  }, []);

  // Cleanup quando componente é desmontado
  useEffect(() => {
    return () => {
      // Não destruir o serviço aqui pois ele deve persistir entre páginas
    };
  }, []);

  return {
    isEnabled: status.settings?.enabled || false,
    isWatching: status.isWatching,
    hasPermission: status.hasPermission,
    settings: status.settings,
    status,
    initialize,
    startWatching,
    stopWatching,
    updateSettings,
    clearHistory
  };
}