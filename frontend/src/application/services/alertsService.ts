import { create } from 'zustand';
import { Alerta, AlertaFilters } from '../../domain/types/alerta';

interface AlertsState {
  alertas: Alerta[];
  unreadCount: number;
  filters: AlertaFilters;
  setAlertas: (alertas: Alerta[]) => void;
  setFilters: (filters: AlertaFilters) => void;
  markAsRead: (id: string) => void;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alertas: [],
  unreadCount: 0,
  filters: {},

  setAlertas: (alertas: Alerta[]) => {
    set({
      alertas,
      unreadCount: alertas.filter((a) => !a.leida).length,
    });
  },

  setFilters: (filters: AlertaFilters) => {
    set({ filters });
  },

  markAsRead: (id: string) => {
    const alertas = get().alertas.map((a) =>
      a.id === id ? { ...a, leida: true } : a
    );
    set({
      alertas,
      unreadCount: alertas.filter((a) => !a.leida).length,
    });
  },
}));
