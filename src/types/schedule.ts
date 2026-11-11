export interface ActivityItem {
  id: string;
  time: string; // e.g. "09:30"
  title: string;
  landmarkId?: string;
  notes?: string;
  done: boolean;
}

export interface DaySchedule {
  id: string;
  dayNumber: number;
  date?: string; // e.g. "2026-11-12"
  title: string; // e.g. "Día en Buenos Aires: Obelisco y Teatro Colón"
  city: string; // e.g. "Buenos Aires"
  activities: ActivityItem[];
  tipsForMaria: string;
}
