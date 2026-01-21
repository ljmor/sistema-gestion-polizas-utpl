import { create } from 'zustand';
import { httpClient } from '../../infrastructure/api/httpClient';
import { endpoints } from '../../infrastructure/api/endpoints';
import { AppNotification } from '../../shared/components/MacOSNotification';

interface AlertFromAPI {
  id: string;
  tipo: string;
  severidad: 'INFO' | 'WARNING' | 'CRITICAL';
  mensaje: string;
  refType: string;
  refId: string;
  fechaLimite: string;
  isResolved: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  lastFetchedAlertIds: Set<string>;
  isPolling: boolean;
  pollingInterval: number;
  
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  startPolling: () => void;
  stopPolling: () => void;
  fetchNewAlerts: () => Promise<void>;
}

const POLLING_INTERVAL = parseInt(import.meta.env.VITE_ALERTS_POLLING_INTERVAL || '30000', 10);

// Mapear severidad de la API a la del componente
const mapSeverity = (severity: string): 'info' | 'warning' | 'error' => {
  switch (severity) {
    case 'CRITICAL':
      return 'error';
    case 'WARNING':
      return 'warning';
    default:
      return 'info';
  }
};

// Mapear tipo de alerta a título legible
const mapAlertTypeToTitle = (tipo: string): string => {
  const titles: Record<string, string> = {
    PLAZO_60D: '⏰ Plazo de 60 días',
    PLAZO_15D: '⏰ Plazo de 15 días',
    PLAZO_72H: '🚨 ¡Urgente! Plazo 72h',
    VENCIMIENTO_POLIZA: '📋 Vencimiento de póliza',
    PAGO_POLIZA: '💰 Pago de póliza',
  };
  return titles[tipo] || 'Nueva alerta';
};

let pollingIntervalId: ReturnType<typeof setInterval> | null = null;

// Clave para guardar IDs de alertas ya vistas en localStorage
const SEEN_ALERTS_KEY = 'sgp_seen_alert_ids';
const MAX_STORED_IDS = 100; // Máximo de IDs a guardar

// Funciones para persistir los IDs de alertas ya vistas
const getSeenAlertIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(SEEN_ALERTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch {
    // Ignorar errores de parsing
  }
  return new Set();
};

const saveSeenAlertIds = (ids: Set<string>) => {
  try {
    // Mantener solo los últimos MAX_STORED_IDS
    const idsArray = Array.from(ids).slice(-MAX_STORED_IDS);
    localStorage.setItem(SEEN_ALERTS_KEY, JSON.stringify(idsArray));
  } catch {
    // Ignorar errores de storage
  }
};

// Referencia global a la función de navegación del router
let globalNavigate: ((path: string) => void) | null = null;

export const setGlobalNavigate = (navigate: (path: string) => void) => {
  globalNavigate = navigate;
};

// Función segura para navegar sin perder el estado
const safeNavigate = (path: string) => {
  if (globalNavigate) {
    globalNavigate(path);
  } else {
    // Fallback: usar hash navigation que no pierde estado
    window.location.hash = path;
  }
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  lastFetchedAlertIds: getSeenAlertIds(), // Cargar IDs persistidos
  isPolling: false,
  pollingInterval: POLLING_INTERVAL,

  addNotification: (notification) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 10),
    }));

    // Reproducir sonido de notificación (si está disponible)
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        // Mostrar notificación nativa del navegador también
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.svg',
          tag: newNotification.id,
        });
      }
    } catch {
      // Ignorar si no hay soporte
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  startPolling: () => {
    const { isPolling, fetchNewAlerts, pollingInterval } = get();
    
    if (isPolling) return;

    set({ isPolling: true });

    // Fetch inicial
    fetchNewAlerts();

    // Iniciar polling
    pollingIntervalId = setInterval(() => {
      fetchNewAlerts();
    }, pollingInterval);

    // Solicitar permisos de notificación del navegador
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  stopPolling: () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
    set({ isPolling: false });
  },

  fetchNewAlerts: async () => {
    try {
      const response = await httpClient.get<AlertFromAPI[]>(endpoints.alertas.unresolved);
      const alerts = response.data;
      
      const { lastFetchedAlertIds, addNotification } = get();
      const newAlertIds = new Set<string>();

      for (const alert of alerts) {
        newAlertIds.add(alert.id);

        // Solo mostrar notificación si es una alerta nueva
        if (!lastFetchedAlertIds.has(alert.id)) {
          addNotification({
            title: mapAlertTypeToTitle(alert.tipo),
            message: alert.mensaje,
            severity: mapSeverity(alert.severidad),
            caseCode: alert.refType === 'SINIESTRO' ? alert.refId : undefined,
            onClick: () => {
              // Navegar al caso o alerta usando el router
              if (alert.refType === 'SINIESTRO') {
                safeNavigate(`/app/siniestros/${alert.refId}`);
              } else {
                safeNavigate('/app/alertas');
              }
            },
          });
        }
      }

      // Guardar IDs en localStorage y en estado
      saveSeenAlertIds(newAlertIds);
      set({ lastFetchedAlertIds: newAlertIds });
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  },
}));

// Hook para usar el servicio de notificaciones
export const useNotifications = () => {
  const store = useNotificationStore();
  return {
    notifications: store.notifications,
    addNotification: store.addNotification,
    removeNotification: store.removeNotification,
    clearAll: store.clearAll,
    startPolling: store.startPolling,
    stopPolling: store.stopPolling,
  };
};
