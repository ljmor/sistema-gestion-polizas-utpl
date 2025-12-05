import {
  format,
  differenceInDays,
  differenceInHours,
  differenceInBusinessDays,
  addDays,
  addBusinessDays,
  parseISO,
  isAfter,
  isBefore,
} from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  try {
    let d: Date;
    if (typeof date === 'string') {
      // Si es una fecha ISO con timezone (ej: 2024-01-01T00:00:00.000Z)
      // Extraer solo la parte de fecha para evitar problemas de timezone
      const dateOnly = date.split('T')[0]; // "2024-01-01"
      const [year, month, day] = dateOnly.split('-').map(Number);
      // Crear fecha local (sin conversión de timezone)
      d = new Date(year, month - 1, day);
    } else {
      d = date;
    }
    return format(d, 'dd/MM/yyyy', { locale: es });
  } catch {
    return '-';
  }
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd/MM/yyyy HH:mm', { locale: es });
  } catch {
    return '-';
  }
};

export const formatDateLong = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return '-';
  }
};

export const getDaysRemaining = (targetDate: string | Date): number => {
  const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
  return differenceInDays(target, new Date());
};

export const getHoursRemaining = (targetDate: string | Date): number => {
  const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
  return differenceInHours(target, new Date());
};

export const getBusinessDaysRemaining = (targetDate: string | Date): number => {
  const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
  return differenceInBusinessDays(target, new Date());
};

export const calculateDeadline60Days = (fechaDefuncion: string): Date => {
  return addDays(parseISO(fechaDefuncion), 60);
};

export const calculateDeadline15BusinessDays = (fechaEnvio: string): Date => {
  return addBusinessDays(parseISO(fechaEnvio), 15);
};

export const calculateDeadline72Hours = (fechaRecepcion: string): Date => {
  const fecha = parseISO(fechaRecepcion);
  return new Date(fecha.getTime() + 72 * 60 * 60 * 1000);
};

export const isExpired = (deadline: string | Date): boolean => {
  const target = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  return isBefore(target, new Date());
};

export const isNearExpiration = (deadline: string | Date, daysThreshold: number = 10): boolean => {
  const target = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const now = new Date();
  return isAfter(target, now) && differenceInDays(target, now) <= daysThreshold;
};

export const toISODateString = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};
