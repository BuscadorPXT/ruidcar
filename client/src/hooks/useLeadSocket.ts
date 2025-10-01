import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

interface LeadEvent {
  type: 'new_lead' | 'lead_updated' | 'lead_assigned' | 'new_interaction' | 'status_changed';
  leadId: number;
  data: any;
  timestamp: Date;
}

interface LeadStats {
  total: number;
  new_count: number;
  contacted_count: number;
  qualified_count: number;
  won_count: number;
}

let socket: Socket | null = null;

export function useLeadSocket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [shouldConnect, setShouldConnect] = useState(false);

  // Só conecta quando realmente necessário (lazy connection)
  const connect = useCallback(() => {
    if (!user?.id || !shouldConnect || socket?.connected) return;

    // Só admins precisam de socket em tempo real
    if (!hasRole('ADMIN')) {
      console.log('🔌 Socket não necessário para role não-admin');
      return;
    }

    const socketUrl = process.env.NODE_ENV === 'production'
      ? 'https://ruidcar.com.br'
      : 'http://localhost:3000';

    console.log('🔌 Conectando socket com configuração otimizada...');
    socket = io(socketUrl, {
      path: '/socket.io/',
      withCredentials: true,
      transports: ['websocket'], // Apenas WebSocket para melhor performance
      upgrade: false, // Não fazer upgrade de polling para websocket
      rememberUpgrade: false,
      timeout: 10000, // Timeout de conexão reduzido
      forceNew: true // Força nova conexão para evitar problemas de cache
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);

      // Join admin room
      socket!.emit('join-admin', user.id.toString());
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    // Listen for lead events
    socket.on('lead-event', (event: LeadEvent) => {
      console.log('📨 Lead event received:', event);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', event.leadId] });

      // Show toast notification based on event type
      switch (event.type) {
        case 'new_lead':
          toast({
            title: 'Novo Lead!',
            description: `${event.data.fullName} acabou de se cadastrar`,
            duration: 5000,
          });
          // Play notification sound
          playNotificationSound();
          break;

        case 'status_changed':
          toast({
            title: 'Status Alterado',
            description: `Lead ${event.data.lead.fullName} mudou para ${event.data.newStatus}`,
            duration: 3000,
          });
          break;

        case 'lead_assigned':
          if (event.data.assignedTo?.id === user.id) {
            toast({
              title: 'Lead Atribuído a Você!',
              description: `${event.data.lead.fullName} foi atribuído a você`,
              duration: 5000,
            });
            playNotificationSound();
          }
          break;

        case 'new_interaction':
          toast({
            title: 'Nova Interação',
            description: `${event.data.user?.name} adicionou uma nota em ${event.data.lead?.fullName}`,
            duration: 3000,
          });
          break;
      }
    });

    // Listen for stats updates
    socket.on('lead-stats-update', (data: { stats: any; timestamp: Date }) => {
      console.log('📊 Lead stats updated:', data);
      setLeadStats(data.stats);
      setNewLeadsCount(data.stats.new_count || 0);
    });

    // Listen for personal lead assignment
    socket.on('lead-assigned-to-you', (event: LeadEvent) => {
      console.log('👤 Lead assigned to you:', event);
      toast({
        title: 'Novo Lead para Você!',
        description: `${event.data.lead.fullName} foi atribuído a você`,
        duration: 5000,
        // Add action button to open lead details
      });
      playNotificationSound();
    });

    // Listen for initial stats
    socket.on('lead-stats', (data: { newLeadsCount: number; timestamp: Date }) => {
      console.log('📊 Initial lead stats:', data);
      setNewLeadsCount(data.newLeadsCount);
    });

  }, [user, queryClient, toast]);

  const disconnect = useCallback(() => {
    if (socket && user?.id) {
      socket.emit('leave-admin', user.id.toString());
      socket.disconnect();
      socket = null;
      setIsConnected(false);
    }
  }, [user]);

  // Função para iniciar conexão lazy (chamada quando necessário)
  const enableRealTime = useCallback(() => {
    setShouldConnect(true);
  }, []);

  // Auto-connect apenas quando shouldConnect é true
  useEffect(() => {
    if (shouldConnect && user?.id && hasRole('ADMIN')) {
      connect();
    }

    return () => {
      if (shouldConnect) {
        disconnect();
      }
    };
  }, [user, hasRole, shouldConnect, connect, disconnect]);

  // Helper function to play notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Function to emit custom events
  const emit = useCallback((event: string, data: any) => {
    if (socket?.connected) {
      socket.emit(event, data);
    }
  }, []);

  return {
    isConnected,
    leadStats,
    newLeadsCount,
    connect,
    disconnect,
    emit,
    enableRealTime, // Função para ativar conexão lazy quando necessário
    shouldConnect, // Estado da conexão
  };
}