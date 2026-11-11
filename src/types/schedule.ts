export interface ActivityItem {
  id: string;
  time: string; // e.g. "10:00"
  title: string;
  landmarkId?: string;
  vintageSpotId?: string;
  notes?: string;
  done: boolean;
}

export interface DaySchedule {
  id: string;
  dayNumber: number;
  date?: string; // e.g. "2026-11-12"
  title: string; // e.g. "Día 1: Recoleta, Obelisco & Juan Perez Vintage"
  city: string; // e.g. "Buenos Aires (CABA)"
  activities: ActivityItem[];
  tipsForMaria: string;
}
