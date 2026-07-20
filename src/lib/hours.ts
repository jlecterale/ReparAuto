import type { WorkingHours } from '@/types/oficina';

export interface StatusInfo {
  status: 'open' | 'closed' | '24h';
  label: string;
  colorClass: string;
}

// Utility function to resolve operating hours status in real-time
export function getStatusFuncionamento(workingHours?: WorkingHours): StatusInfo {
  if (!workingHours) {
    return {
      status: 'closed',
      label: 'Horário indisponível',
      colorClass: 'text-neutral-500 bg-neutral-100 border-neutral-200'
    };
  }

  if (workingHours.is24h) {
    return {
      status: '24h',
      label: '24 Horas / Emergência',
      colorClass: 'text-amber-700 bg-amber-50 border-amber-200 font-bold'
    };
  }

  const now = new Date();
  const days: ('dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab')[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const currentDay = days[now.getDay()];

  const daySchedule = workingHours.schedule?.[currentDay];
  if (!daySchedule || daySchedule.closed || !daySchedule.openTime || !daySchedule.closeTime) {
    return {
      status: 'closed',
      label: 'Fechado',
      colorClass: 'text-red-600 bg-red-50 border-red-200'
    };
  }

  const currentHours = now.getHours().toString().padStart(2, '0');
  const currentMinutes = now.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  if (currentTimeStr >= daySchedule.openTime && currentTimeStr <= daySchedule.closeTime) {
    return {
      status: 'open',
      label: 'Aberto agora',
      colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-medium'
    };
  }

  return {
    status: 'closed',
    label: 'Fechado',
    colorClass: 'text-red-600 bg-red-50 border-red-200'
  };
}
