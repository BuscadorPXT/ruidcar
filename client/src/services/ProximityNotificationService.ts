import { type Workshop } from '@shared/schema';

interface ProximitySettings {
  enabled: boolean;
  radiusKm: number;
  minTimeBetweenNotifications: number; // milliseconds
  maxNotificationsPerDay: number;
}

interface NotificationHistory {
  workshopId: number;
  timestamp: number;
  userLocation: { lat: number; lng: number };
}

interface ProximityNotificationServiceState {
  isWatching: boolean;
  currentPosition: GeolocationPosition | null;
  watchId: number | null;
  notificationHistory: NotificationHistory[];
  settings: ProximitySettings;
}

/**
 * Serviço para monitorar proximidade de oficinas e enviar notificações
 *
 * Funcionalidades:
 * - Monitoramento de localização em background
 * - Cálculo de distância para oficinas conhecidas
 * - Notificações inteligentes com throttling
 * - Gerenciamento de permissões
 * - Histórico de notificações
 */
export class ProximityNotificationService {
  private state: ProximityNotificationServiceState;
  private workshops: Workshop[] = [];
  private readonly STORAGE_KEY = 'proximity_notifications_state';
  private readonly HISTORY_KEY = 'proximity_notification_history';

  constructor() {
    this.state = {
      isWatching: false,
      currentPosition: null,
      watchId: null,
      notificationHistory: this.loadNotificationHistory(),
      settings: {
        enabled: false,
        radiusKm: 2, // 2km de raio padrão
        minTimeBetweenNotifications: 60 * 60 * 1000, // 1 hora entre notificações da mesma oficina
        maxNotificationsPerDay: 5 // Máximo 5 notificações por dia
      }
    };

    this.loadSettings();
    this.setupServiceWorkerMessaging();
  }

  /**
   * Inicializar serviço e solicitar permissões
   */
  async initialize(): Promise<boolean> {
    try {
      // Verificar suporte a notificações
      if (!('Notification' in window)) {
        console.warn('ProximityNotificationService: Notifications not supported');
        return false;
      }

      // Verificar suporte a geolocalização
      if (!('geolocation' in navigator)) {
        console.warn('ProximityNotificationService: Geolocation not supported');
        return false;
      }

      // Solicitar permissão para notificações
      const notificationPermission = await this.requestNotificationPermission();
      if (notificationPermission !== 'granted') {
        console.warn('ProximityNotificationService: Notification permission denied');
        return false;
      }

      console.log('✅ ProximityNotificationService initialized successfully');
      return true;
    } catch (error) {
      console.error('ProximityNotificationService initialization failed:', error);
      return false;
    }
  }

  /**
   * Solicitar permissão para notificações
   */
  private async requestNotificationPermission(): Promise<NotificationPermission> {
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Solicitar permissão
    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Iniciar monitoramento de proximidade
   */
  async startWatching(workshops: Workshop[]): Promise<boolean> {
    if (this.state.isWatching) {
      console.log('ProximityNotificationService: Already watching');
      return true;
    }

    if (!this.state.settings.enabled) {
      console.log('ProximityNotificationService: Service disabled in settings');
      return false;
    }

    try {
      this.workshops = workshops;

      // Iniciar watch de localização
      const watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position),
        (error) => this.handlePositionError(error),
        {
          enableHighAccuracy: false, // Para economizar bateria
          timeout: 30000, // 30 segundos
          maximumAge: 60000 // Cache de 1 minuto
        }
      );

      this.state.watchId = watchId;
      this.state.isWatching = true;

      console.log('📍 ProximityNotificationService: Started watching location');
      return true;
    } catch (error) {
      console.error('Error starting proximity watching:', error);
      return false;
    }
  }

  /**
   * Parar monitoramento
   */
  stopWatching(): void {
    if (this.state.watchId !== null) {
      navigator.geolocation.clearWatch(this.state.watchId);
      this.state.watchId = null;
    }

    this.state.isWatching = false;
    console.log('🛑 ProximityNotificationService: Stopped watching location');
  }

  /**
   * Handle da atualização de posição
   */
  private async handlePositionUpdate(position: GeolocationPosition): Promise<void> {
    this.state.currentPosition = position;
    const { latitude, longitude } = position.coords;

    console.log(`📍 Location updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

    // Verificar proximidade com oficinas
    await this.checkProximityToWorkshops(latitude, longitude);
  }

  /**
   * Handle de erro de posição
   */
  private handlePositionError(error: GeolocationPositionError): void {
    console.warn('ProximityNotificationService position error:', error.message);

    // Se erro for crítico, parar o watching
    if (error.code === error.PERMISSION_DENIED) {
      this.stopWatching();
      this.updateSettings({ enabled: false });
    }
  }

  /**
   * Verificar proximidade com oficinas
   */
  private async checkProximityToWorkshops(userLat: number, userLng: number): Promise<void> {
    const currentTime = Date.now();
    const notificationsToday = this.getTodayNotificationCount();

    // Limite diário de notificações
    if (notificationsToday >= this.state.settings.maxNotificationsPerDay) {
      console.log('Daily notification limit reached');
      return;
    }

    for (const workshop of this.workshops) {
      try {
        const workshopLat = parseFloat(workshop.latitude);
        const workshopLng = parseFloat(workshop.longitude);

        if (isNaN(workshopLat) || isNaN(workshopLng)) {
          continue;
        }

        const distance = this.calculateDistance(userLat, userLng, workshopLat, workshopLng);

        // Verificar se está dentro do raio
        if (distance <= this.state.settings.radiusKm) {
          // Verificar se não notificamos recentemente desta oficina
          const lastNotification = this.getLastNotificationForWorkshop(workshop.id);

          if (!lastNotification ||
              (currentTime - lastNotification.timestamp) >= this.state.settings.minTimeBetweenNotifications) {

            await this.sendProximityNotification(workshop, distance, userLat, userLng);
          }
        }
      } catch (error) {
        console.warn(`Error checking proximity for workshop ${workshop.id}:`, error);
      }
    }
  }

  /**
   * Enviar notificação de proximidade
   */
  private async sendProximityNotification(
    workshop: Workshop,
    distance: number,
    userLat: number,
    userLng: number
  ): Promise<void> {
    try {
      const title = '🎯 Oficina RuidCar próxima!';
      const body = `${workshop.name} está a ${distance.toFixed(1)}km de você`;
      const tag = `workshop-${workshop.id}`;

      // Criar notificação
      const notification = new Notification(title, {
        body,
        tag,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        image: '/icons/ruidcar-icon.svg',
        requireInteraction: false,
        silent: false,
        actions: [
          {
            action: 'view',
            title: 'Ver no mapa'
          },
          {
            action: 'call',
            title: 'Ligar'
          },
          {
            action: 'dismiss',
            title: 'Dispensar'
          }
        ],
        data: {
          workshopId: workshop.id,
          workshopName: workshop.name,
          distance,
          userLocation: { lat: userLat, lng: userLng }
        }
      });

      // Handle de cliques na notificação
      notification.onclick = () => {
        window.focus();
        window.open(`/mapa?workshop=${workshop.id}`, '_blank');
        notification.close();
      };

      // Salvar no histórico
      this.saveNotificationHistory({
        workshopId: workshop.id,
        timestamp: Date.now(),
        userLocation: { lat: userLat, lng: userLng }
      });

      console.log(`🔔 Proximity notification sent for ${workshop.name}`);

    } catch (error) {
      console.error('Error sending proximity notification:', error);
    }
  }

  /**
   * Calcular distância entre dois pontos (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Configurar messaging com Service Worker
   */
  private setupServiceWorkerMessaging(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'PROXIMITY_NOTIFICATION_CLICK') {
          console.log('Proximity notification clicked:', event.data);
          // Handle click events from service worker
        }
      });
    }
  }

  /**
   * Salvar histórico de notificação
   */
  private saveNotificationHistory(notification: NotificationHistory): void {
    this.state.notificationHistory.push(notification);

    // Manter apenas últimas 100 notificações
    if (this.state.notificationHistory.length > 100) {
      this.state.notificationHistory = this.state.notificationHistory.slice(-100);
    }

    this.persistNotificationHistory();
  }

  /**
   * Obter última notificação para uma oficina
   */
  private getLastNotificationForWorkshop(workshopId: number): NotificationHistory | null {
    const workshopNotifications = this.state.notificationHistory
      .filter(n => n.workshopId === workshopId)
      .sort((a, b) => b.timestamp - a.timestamp);

    return workshopNotifications[0] || null;
  }

  /**
   * Contar notificações de hoje
   */
  private getTodayNotificationCount(): number {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return this.state.notificationHistory.filter(
      n => n.timestamp >= todayStart.getTime()
    ).length;
  }

  /**
   * Carregar configurações
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        this.state.settings = { ...this.state.settings, ...settings };
      }
    } catch (error) {
      console.warn('Error loading proximity notification settings:', error);
    }
  }

  /**
   * Salvar configurações
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state.settings));
    } catch (error) {
      console.warn('Error saving proximity notification settings:', error);
    }
  }

  /**
   * Carregar histórico de notificações
   */
  private loadNotificationHistory(): NotificationHistory[] {
    try {
      const saved = localStorage.getItem(this.HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Error loading notification history:', error);
      return [];
    }
  }

  /**
   * Persistir histórico de notificações
   */
  private persistNotificationHistory(): void {
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.state.notificationHistory));
    } catch (error) {
      console.warn('Error persisting notification history:', error);
    }
  }

  // Public API methods

  /**
   * Atualizar configurações
   */
  updateSettings(newSettings: Partial<ProximitySettings>): void {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveSettings();

    // Se foi desabilitado, parar watching
    if (!this.state.settings.enabled && this.state.isWatching) {
      this.stopWatching();
    }
  }

  /**
   * Obter configurações atuais
   */
  getSettings(): ProximitySettings {
    return { ...this.state.settings };
  }

  /**
   * Obter status do serviço
   */
  getStatus() {
    return {
      isWatching: this.state.isWatching,
      hasPermission: Notification.permission === 'granted',
      currentPosition: this.state.currentPosition,
      notificationCount: this.state.notificationHistory.length,
      todayCount: this.getTodayNotificationCount(),
      settings: this.getSettings()
    };
  }

  /**
   * Limpar histórico de notificações
   */
  clearHistory(): void {
    this.state.notificationHistory = [];
    this.persistNotificationHistory();
  }

  /**
   * Destruir serviço
   */
  destroy(): void {
    this.stopWatching();
    this.saveSettings();
    this.persistNotificationHistory();
  }
}

// Singleton instance
export const proximityNotificationService = new ProximityNotificationService();