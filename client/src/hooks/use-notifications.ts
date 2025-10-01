import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface Notification {
  id: string;
  type: 'workshop_pending' | 'workshop_approved' | 'workshop_rejected' | 'general';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

export function useNotifications() {
  const { isAuthenticated, hasRole } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: false
  });

  // Polling interval otimizado (menos frequente para reduzir carga)
  const getPollingInterval = useCallback(() => {
    if (hasRole('ADMIN')) return 60000; // 60s (era 30s)
    if (hasRole('OFICINA_OWNER')) return 120000; // 120s (era 60s)
    return 300000; // 5min para clientes (era 2min)
  }, [hasRole]);

  // Exponential backoff para erros
  const [errorCount, setErrorCount] = useState(0);
  const getBackoffInterval = useCallback(() => {
    if (errorCount === 0) return getPollingInterval();
    return Math.min(getPollingInterval() * Math.pow(2, errorCount), 300000); // Max 5min
  }, [errorCount, getPollingInterval]);

  // Buscar notificações
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setState(prev => ({ ...prev, loading: true }));

      const response = await fetch('/api/notifications', {
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Erro ao buscar notificações');
        return;
      }

      const data = await response.json();

      // Verificar novas notificações importantes
      const newNotifications = data.notifications.filter(
        (n: Notification) =>
          !state.notifications.find(existing => existing.id === n.id) &&
          !n.read
      );

      // Mostrar toast para notificações importantes
      newNotifications.forEach((notification: Notification) => {
        if (notification.type === 'workshop_pending' && hasRole('ADMIN')) {
          toast({
            title: '🔔 ' + notification.title,
            description: notification.message,
            duration: 5000
          });
        } else if (notification.type === 'workshop_approved' && hasRole('OFICINA_OWNER')) {
          toast({
            title: '✅ ' + notification.title,
            description: notification.message,
            duration: 5000
          });
        }
      });

      setState({
        notifications: data.notifications,
        unreadCount: data.notifications.filter((n: Notification) => !n.read).length,
        loading: false
      });

      // Reset error count em caso de sucesso
      setErrorCount(0);

    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      setState(prev => ({ ...prev, loading: false }));

      // Incrementar contador de erros para backoff
      setErrorCount(prev => prev + 1);
    }
  }, [isAuthenticated, hasRole, toast, state.notifications]);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1)
        }));
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        }));
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, []);

  // Limpar notificação
  const clearNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== notificationId),
          unreadCount: prev.notifications.find(n => n.id === notificationId && !n.read)
            ? prev.unreadCount - 1
            : prev.unreadCount
        }));
      }
    } catch (error) {
      console.error('Erro ao limpar notificação:', error);
    }
  }, []);

  // Setup polling com backoff
  useEffect(() => {
    if (!isAuthenticated) return;

    // Busca inicial
    fetchNotifications();

    // Setup polling com backoff interval
    const interval = setInterval(fetchNotifications, getBackoffInterval());

    // Cleanup
    return () => clearInterval(interval);
  }, [isAuthenticated, getBackoffInterval, fetchNotifications]);

  // Criar notificações mock para desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isAuthenticated) {
      // Simular notificações para admin
      if (hasRole('ADMIN')) {
        setState(prev => ({
          ...prev,
          notifications: [
            {
              id: '1',
              type: 'workshop_pending',
              title: 'Nova oficina aguardando aprovação',
              message: 'Oficina Central SP cadastrou-se e aguarda sua aprovação',
              timestamp: new Date(),
              read: false,
              actionUrl: '/admin/workshops/pending'
            },
            ...prev.notifications.filter(n => n.id !== '1')
          ],
          unreadCount: prev.notifications.filter(n => !n.read).length + 1
        }));
      }

      // Simular notificação para oficina
      if (hasRole('OFICINA_OWNER')) {
        const hasApproval = sessionStorage.getItem('workshop-approved');
        if (!hasApproval) {
          setState(prev => ({
            ...prev,
            notifications: [
              {
                id: '2',
                type: 'workshop_approved',
                title: 'Sua oficina foi aprovada!',
                message: 'Parabéns! Sua oficina foi aprovada e já está visível no mapa.',
                timestamp: new Date(),
                read: false,
                actionUrl: '/workshop/dashboard'
              },
              ...prev.notifications.filter(n => n.id !== '2')
            ]
          }));
          sessionStorage.setItem('workshop-approved', 'true');
        }
      }
    }
  }, [isAuthenticated, hasRole]);

  return {
    ...state,
    markAsRead,
    markAllAsRead,
    clearNotification,
    refetch: fetchNotifications
  };
}